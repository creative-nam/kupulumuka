// @vitest-environment node
import "dotenv/config";
import { execSync } from "node:child_process";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runSeed } from "@/prisma/seed";
import { getSheltersForQuarteirao } from "./search";

const dbUrl = process.env["TEST_DIRECT_URL"];
if (!dbUrl) throw new Error("TEST_DIRECT_URL is not set");

async function createClient() {
  const adapter = new PrismaPg({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

beforeAll(async () => {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DIRECT_URL: dbUrl },
    stdio: "inherit",
  });

  prisma = await createClient();

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BairroVizinho" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Shelter" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Quarteirao" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Bairro" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Distrito" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Provincia" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE`);

  await runSeed(prisma);
});

afterAll(async () => {
  if (!prisma) return;

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BairroVizinho" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Shelter" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Quarteirao" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Bairro" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Distrito" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Provincia" CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE`);

  await prisma.$disconnect();
});

describe("getSheltersForQuarteirao", () => {
  it("returns empty results and no origin bairro when quarteiraoId does not exist", async () => {
    const result = await getSheltersForQuarteirao("nonexistent-id", prisma);
    expect(result.originBairro).toBeNull();
    expect(result.results).toEqual([]);
  });

  it("returns shelters for a quarteirao in Khongolote ordered by tier, capacity, name", async () => {
    const khongolote = await prisma.bairro.findFirst({
      where: {
        name: "Khongolote",
        distrito: { provincia: { name: "Província de Maputo" } },
      },
      include: { quarteiroes: true },
    });
    expect(khongolote).not.toBeNull();

    const quarteiraoId = khongolote!.quarteiroes[0].id;

    const response = await getSheltersForQuarteirao(quarteiraoId, prisma);
    const results = response.results;

    expect(response.originBairro?.name).toBe("Khongolote");
    expect(results).toHaveLength(3);
    expect(results[0].name).toBe("EPC Khongolote");
    expect(results[0].tier).toBe("OFFICIAL");
    expect(results[0].capacityStatus).toBe("AVAILABLE");

    expect(results[1].name).toBe("Igreja Católica");
    expect(results[1].tier).toBe("OFFICIAL");
    expect(results[1].capacityStatus).toBe("NEARLY_FULL");

    expect(results[2].name).toBe("Salão Paroquial S. João");
    expect(results[2].tier).toBe("COMMUNITY");
    expect(results[2].capacityStatus).toBe("AVAILABLE");
  });

  it("sets fromNeighboringBairro to false for local shelters", async () => {
    const khongolote = await prisma.bairro.findFirst({
      where: {
        name: "Khongolote",
        distrito: { provincia: { name: "Província de Maputo" } },
      },
      include: { quarteiroes: true },
    });
    const quarteiraoId = khongolote!.quarteiroes[0].id;

    const results = (await getSheltersForQuarteirao(quarteiraoId, prisma))
      .results;

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.fromNeighboringBairro).toBe(false);
    }
  });

  it("triggers overflow to neighboring bairros when local bairro has zero shelters", async () => {
    const provinciaMaputo = await prisma.provincia.findFirst({
      where: { name: "Província de Maputo" },
    });

    const distritoMatola = await prisma.distrito.findFirst({
      where: { name: "Matola", provinciaId: provinciaMaputo!.id },
    });

    const zeroShelterBairro = await prisma.bairro.create({
      data: {
        name: "Bairro Teste Zero Abrigos",
        distritoId: distritoMatola!.id,
      },
    });

    const zeroShelterQuarteirao = await prisma.quarteirao.create({
      data: {
        name: "Quarteirão Teste Zero",
        bairroId: zeroShelterBairro.id,
      },
    });

    const khongolote = await prisma.bairro.findFirst({
      where: {
        name: "Khongolote",
        distrito: { provincia: { name: "Província de Maputo" } },
      },
    });

    await prisma.bairroVizinho.create({
      data: {
        bairroAId: zeroShelterBairro.id,
        bairroBId: khongolote!.id,
      },
    });

    const response = await getSheltersForQuarteirao(
      zeroShelterQuarteirao.id,
      prisma,
    );
    const results = response.results;

    expect(response.originBairro?.name).toBe("Bairro Teste Zero Abrigos");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.fromNeighboringBairro).toBe(true);
    }
    const names = results.map((r) => r.name);
    expect(names).toContain("EPC Khongolote");
    expect(names).toContain("Igreja Católica");
    expect(names).toContain("Salão Paroquial S. João");
  });

  it("returns empty array when local bairro and all neighbors have zero shelters", async () => {
    const provinciaGaza = await prisma.provincia.findFirst({
      where: { name: "Gaza" },
    });

    const distritoChokwe = await prisma.distrito.findFirst({
      where: { name: "Chókwè", provinciaId: provinciaGaza!.id },
    });

    const emptyBairro1 = await prisma.bairro.create({
      data: { name: "Bairro Vazio 1", distritoId: distritoChokwe!.id },
    });
    const emptyBairro2 = await prisma.bairro.create({
      data: { name: "Bairro Vazio 2", distritoId: distritoChokwe!.id },
    });

    const emptyQuarteirao = await prisma.quarteirao.create({
      data: { name: "Quarteirão Vazio", bairroId: emptyBairro1.id },
    });

    await prisma.bairroVizinho.create({
      data: { bairroAId: emptyBairro1.id, bairroBId: emptyBairro2.id },
    });

    const response = await getSheltersForQuarteirao(
      emptyQuarteirao.id,
      prisma,
    );
    expect(response.originBairro?.name).toBe("Bairro Vazio 1");
    expect(response.results).toEqual([]);
  });

  it("correctly sorts OFFICIAL before COMMUNITY across different bairros during overflow", async () => {
    const provinciaMaputo = await prisma.provincia.findFirst({
      where: { name: "Província de Maputo" },
    });

    const distritoMatola = await prisma.distrito.findFirst({
      where: { name: "Matola", provinciaId: provinciaMaputo!.id },
    });

    const overflowBairro = await prisma.bairro.create({
      data: {
        name: "Overflow Test Bairro",
        distritoId: distritoMatola!.id,
      },
    });

    const overflowQuarteirao = await prisma.quarteirao.create({
      data: {
        name: "Overflow Test Q",
        bairroId: overflowBairro.id,
      },
    });

    const komunidade = await prisma.bairro.findFirst({
      where: {
        name: "Khongolote",
        distrito: { provincia: { name: "Província de Maputo" } },
      },
    });
    const t3 = await prisma.bairro.findFirst({
      where: {
        name: "T-3",
        distrito: { provincia: { name: "Província de Maputo" } },
      },
    });

    await prisma.bairroVizinho.create({
      data: { bairroAId: overflowBairro.id, bairroBId: komunidade!.id },
    });
    await prisma.bairroVizinho.create({
      data: { bairroAId: overflowBairro.id, bairroBId: t3!.id },
    });

    const results = (await getSheltersForQuarteirao(
      overflowQuarteirao.id,
      prisma,
    )).results;

    let foundCommunity = false;
    for (const r of results) {
      if (r.tier === "COMMUNITY") foundCommunity = true;
      if (foundCommunity) {
        expect(r.tier).toBe("COMMUNITY");
      }
    }

    expect(foundCommunity).toBe(true);
  });

  it("includes routeDescription, quarteiraoName, and bairroName in results", async () => {
    const khongolote = await prisma.bairro.findFirst({
      where: {
        name: "Khongolote",
        distrito: { provincia: { name: "Província de Maputo" } },
      },
      include: { quarteiroes: true },
    });
    const quarteiraoId = khongolote!.quarteiroes[0].id;

    const results = (await getSheltersForQuarteirao(quarteiraoId, prisma))
      .results;

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.routeDescription).toBeTruthy();
      expect(r.quarteiraoName).toBeTruthy();
      expect(r.bairroName).toBeTruthy();
    }
  });
});
