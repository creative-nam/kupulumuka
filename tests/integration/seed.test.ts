// @vitest-environment node
import "dotenv/config";
import { execSync } from "node:child_process";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runSeed } from "@/prisma/seed";

const dbUrl = process.env["TEST_DIRECT_URL"];
if (!dbUrl) throw new Error("TEST_DIRECT_URL is not set");

async function createClient() {
  const adapter = new PrismaPg({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

beforeAll(async () => {
  // Deploy migrations to the test database
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DIRECT_URL: dbUrl },
    stdio: "inherit",
  });

  prisma = await createClient();

  // Truncate all tables in dependency order for a clean slate
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

describe("Seed data integration", () => {
  it("seeds all 4 provinces", async () => {
    const count = await prisma.provincia.count();
    expect(count).toBe(4);
  });

  it("seeds Cidade de Maputo and Província de Maputo as separate Provincia rows", async () => {
    const cidade = await prisma.provincia.findFirst({
      where: { name: "Cidade de Maputo" },
    });
    const provincia = await prisma.provincia.findFirst({
      where: { name: "Província de Maputo" },
    });
    expect(cidade).not.toBeNull();
    expect(provincia).not.toBeNull();
    expect(cidade!.id).not.toBe(provincia!.id);
  });

  it("seeds Sofala and Gaza", async () => {
    const sofala = await prisma.provincia.findFirst({
      where: { name: "Sofala" },
    });
    const gaza = await prisma.provincia.findFirst({
      where: { name: "Gaza" },
    });
    expect(sofala).not.toBeNull();
    expect(gaza).not.toBeNull();
  });

  it("seeds Matola and Boane as Distrito rows under Província de Maputo", async () => {
    const provinciaMaputo = await prisma.provincia.findFirst({
      where: { name: "Província de Maputo" },
      include: { distritos: true },
    });
    const distritoNames = provinciaMaputo!.distritos.map((d) => d.name);
    expect(distritoNames).toContain("Matola");
    expect(distritoNames).toContain("Boane");
  });

  it("seeds roughly 5 bairros per province", async () => {
    const provincias = await prisma.provincia.findMany({
      include: {
        distritos: {
          include: { bairros: true },
        },
      },
    });
    for (const p of provincias) {
      const bairroCount = p.distritos.reduce(
        (sum, d) => sum + d.bairros.length,
        0,
      );
      expect(bairroCount).toBeGreaterThanOrEqual(4);
      expect(bairroCount).toBeLessThanOrEqual(8);
    }
  });

  it("seeds the three mockup shelters under Khongolote", async () => {
    const khongolote = await prisma.bairro.findFirst({
      where: { name: "Khongolote", distrito: { provincia: { name: "Província de Maputo" } } },
      include: {
        quarteiroes: {
          include: { shelters: true },
        },
      },
    });
    expect(khongolote).not.toBeNull();
    const shelterNames = khongolote!.quarteiroes
      .flatMap((q) => q.shelters)
      .map((s) => s.name);
    expect(shelterNames).toContain("EPC Khongolote");
    expect(shelterNames).toContain("Igreja Católica");
    expect(shelterNames).toContain("Salão Paroquial S. João");
  });

  it("gives EPC Khongolote OFFICIAL tier and AVAILABLE capacity", async () => {
    const shelter = await prisma.shelter.findFirst({
      where: { name: "EPC Khongolote" },
    });
    expect(shelter).not.toBeNull();
    expect(shelter!.tier).toBe("OFFICIAL");
    expect(shelter!.capacityStatus).toBe("AVAILABLE");
  });

  it("gives Igreja Católica OFFICIAL tier and NEARLY_FULL capacity", async () => {
    const shelter = await prisma.shelter.findFirst({
      where: { name: "Igreja Católica" },
    });
    expect(shelter).not.toBeNull();
    expect(shelter!.tier).toBe("OFFICIAL");
    expect(shelter!.capacityStatus).toBe("NEARLY_FULL");
  });

  it("gives Salão Paroquial S. João COMMUNITY tier and AVAILABLE capacity, owned by a User", async () => {
    const shelter = await prisma.shelter.findFirst({
      where: { name: "Salão Paroquial S. João" },
      include: { uploadedBy: true },
    });
    expect(shelter).not.toBeNull();
    expect(shelter!.tier).toBe("COMMUNITY");
    expect(shelter!.capacityStatus).toBe("AVAILABLE");
    expect(shelter!.uploadedBy).not.toBeNull();
    expect(shelter!.uploadedBy!.email).toBe("carlos@example.com");
  });

  it("has Shelter.routeDescription as a required (non-nullable) column", async () => {
    const result = await prisma.$queryRaw<
      { is_nullable: string }[]
    >`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'Shelter' AND column_name = 'routeDescription' AND table_schema = 'public'`;
    expect(result.length).toBe(1);
    expect(result[0].is_nullable).toBe("NO");
  });

  it("mixes all three capacity statuses across the dataset", async () => {
    const statuses = await prisma.shelter.groupBy({
      by: ["capacityStatus"],
      _count: true,
    });
    const foundStatuses = statuses.map((s) => s.capacityStatus);
    expect(foundStatuses).toContain("AVAILABLE");
    expect(foundStatuses).toContain("NEARLY_FULL");
    expect(foundStatuses).toContain("FULL");
  });

  it("creates all 26 declared BairroVizinho adjacency pairs", async () => {
    const count = await prisma.bairroVizinho.count();
    // 6 (Cidade Maputo) + 6 (Matola) + 2 (Boane) + 6 (Beira) + 6 (Chókwè)
    expect(count).toBe(26);
  });

  it("has adjacency pairs in all 4 provinces", async () => {
    const vizinhos = await prisma.bairroVizinho.findMany({
      include: {
        bairroA: {
          include: { distrito: { include: { provincia: true } } },
        },
      },
    });
    const provincesWithAdjacency = new Set(
      vizinhos.map((v) => v.bairroA.distrito.provincia.name),
    );
    expect(provincesWithAdjacency).toEqual(
      new Set(["Cidade de Maputo", "Província de Maputo", "Sofala", "Gaza"]),
    );
  });

  it("has no self-referencing BairroVizinho pairs", async () => {
    const vizinhos = await prisma.bairroVizinho.findMany();
    const selfRefs = vizinhos.filter((v) => v.bairroAId === v.bairroBId);
    expect(selfRefs.length).toBe(0);
  });

  it("resolves specific known BairroVizinho pairs in multiple provinces", async () => {
    // Cidade de Maputo: Central → Alto Maé
    const central = await prisma.bairro.findFirst({
      where: { name: "Central", distrito: { provincia: { name: "Cidade de Maputo" } } },
    });
    const altoMae = await prisma.bairro.findFirst({
      where: { name: "Alto Maé", distrito: { provincia: { name: "Cidade de Maputo" } } },
    });
    const pairCentralAltoMae = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: central!.id,
          bairroBId: altoMae!.id,
        },
      },
    });
    expect(pairCentralAltoMae).not.toBeNull();

    // Província de Maputo (Matola): Khongolote → T-3
    const khongolote = await prisma.bairro.findFirst({
      where: { name: "Khongolote", distrito: { provincia: { name: "Província de Maputo" } } },
    });
    const t3 = await prisma.bairro.findFirst({
      where: { name: "T-3", distrito: { provincia: { name: "Província de Maputo" } } },
    });
    const pairKhongoloteT3 = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: khongolote!.id,
          bairroBId: t3!.id,
        },
      },
    });
    expect(pairKhongoloteT3).not.toBeNull();

    // Sofala: Ponta-Gêa → Matacuane
    const pontaGea = await prisma.bairro.findFirst({
      where: { name: "Ponta-Gêa", distrito: { provincia: { name: "Sofala" } } },
    });
    const matacuane = await prisma.bairro.findFirst({
      where: { name: "Matacuane", distrito: { provincia: { name: "Sofala" } } },
    });
    const pairPontaGeaMatacuane = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: pontaGea!.id,
          bairroBId: matacuane!.id,
        },
      },
    });
    expect(pairPontaGeaMatacuane).not.toBeNull();

    // Gaza: Chókwè Sede → Lionde
    const chokweSede = await prisma.bairro.findFirst({
      where: { name: "Chókwè Sede", distrito: { provincia: { name: "Gaza" } } },
    });
    const lionde = await prisma.bairro.findFirst({
      where: { name: "Lionde", distrito: { provincia: { name: "Gaza" } } },
    });
    const pairChokweLionde = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: chokweSede!.id,
          bairroBId: lionde!.id,
        },
      },
    });
    expect(pairChokweLionde).not.toBeNull();
  });

  it("resolves both directions for a bidirectional adjacency pair", async () => {
    const central = await prisma.bairro.findFirst({
      where: { name: "Central", distrito: { provincia: { name: "Cidade de Maputo" } } },
    });
    const altoMae = await prisma.bairro.findFirst({
      where: { name: "Alto Maé", distrito: { provincia: { name: "Cidade de Maputo" } } },
    });

    const forward = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: central!.id,
          bairroBId: altoMae!.id,
        },
      },
    });
    const reverse = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: altoMae!.id,
          bairroBId: central!.id,
        },
      },
    });
    expect(forward).not.toBeNull();
    expect(reverse).not.toBeNull();
  });

  it("resolves a second bidirectional pair in a different province", async () => {
    const boaneSede = await prisma.bairro.findFirst({
      where: { name: "Boane Sede", distrito: { provincia: { name: "Província de Maputo" } } },
    });
    const beluluane = await prisma.bairro.findFirst({
      where: { name: "Beluluane", distrito: { provincia: { name: "Província de Maputo" } } },
    });

    const forward = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: boaneSede!.id,
          bairroBId: beluluane!.id,
        },
      },
    });
    const reverse = await prisma.bairroVizinho.findUnique({
      where: {
        bairroAId_bairroBId: {
          bairroAId: beluluane!.id,
          bairroBId: boaneSede!.id,
        },
      },
    });
    expect(forward).not.toBeNull();
    expect(reverse).not.toBeNull();
  });

  it("seeds institutional Users (verified, email-based) per province", async () => {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });
    expect(admins.length).toBe(4);
    for (const admin of admins) {
      expect(admin.email).not.toBeNull();
      expect(admin.verificationStatus).toBe("VERIFIED");
    }
  });

  it("seeds community Users (unverified, phone-based) per province", async () => {
    const citizens = await prisma.user.findMany({
      where: { role: "CITIZEN" },
    });
    expect(citizens.length).toBe(4);
    const allHavePhone = citizens.every((u) => u.phone !== null);
    expect(allHavePhone).toBe(true);
    const someHaveNullEmail = citizens.some((u) => u.email === null);
    expect(someHaveNullEmail).toBe(true);
    const allUnverified = citizens.every(
      (u) => u.verificationStatus === "UNVERIFIED",
    );
    expect(allUnverified).toBe(true);
  });

  it("has all three capacity statuses (AVAILABLE / NEARLY_FULL / FULL) as valid values", async () => {
    const shelters = await prisma.shelter.findMany();
    const statuses = shelters.map((s) => s.capacityStatus);
    expect(statuses).toEqual(
      expect.arrayContaining(["AVAILABLE", "NEARLY_FULL", "FULL"]),
    );
  });

  it("has both ShelterTier values (OFFICIAL / COMMUNITY)", async () => {
    const shelters = await prisma.shelter.findMany();
    const tiers = shelters.map((s) => s.tier);
    expect(tiers).toEqual(expect.arrayContaining(["OFFICIAL", "COMMUNITY"]));
  });
});
