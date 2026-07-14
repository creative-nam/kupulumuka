// @vitest-environment node
import "dotenv/config";
import { execSync } from "node:child_process";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runSeed } from "@/prisma/seed";
import { generateGeoSnapshot } from "@/scripts/generate-geo-snapshot";

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

describe("Geo-snapshot generation", () => {
  it("produces a snapshot with 4 provincias", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    expect(snapshot.provincias.length).toBe(4);
  });

  it("includes all four expected provincia names", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    const names = snapshot.provincias.map((p) => p.name);
    expect(names).toContain("Cidade de Maputo");
    expect(names).toContain("Província de Maputo");
    expect(names).toContain("Sofala");
    expect(names).toContain("Gaza");
  });

  it("includes distritos under each provincia with correct counts", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    const maputoCidade = snapshot.provincias.find(
      (p) => p.name === "Cidade de Maputo",
    )!;
    expect(maputoCidade.distritos.length).toBe(1);
    expect(maputoCidade.distritos[0].name).toBe("Distrito Municipal Kampfumo");

    const maputoProvincia = snapshot.provincias.find(
      (p) => p.name === "Província de Maputo",
    )!;
    expect(maputoProvincia.distritos.length).toBe(2);
    const distritoNames = maputoProvincia.distritos.map((d) => d.name);
    expect(distritoNames).toContain("Matola");
    expect(distritoNames).toContain("Boane");

    const sofala = snapshot.provincias.find((p) => p.name === "Sofala")!;
    expect(sofala.distritos.length).toBe(1);
    expect(sofala.distritos[0].name).toBe("Beira");

    const gaza = snapshot.provincias.find((p) => p.name === "Gaza")!;
    expect(gaza.distritos.length).toBe(1);
    expect(gaza.distritos[0].name).toBe("Chókwè");
  });

  it("includes bairros under each distrito", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    const maputoProvincia = snapshot.provincias.find(
      (p) => p.name === "Província de Maputo",
    )!;
    const matola = maputoProvincia.distritos.find((d) => d.name === "Matola")!;
    expect(matola.bairros.length).toBe(5);
    const bairroNames = matola.bairros.map((b) => b.name);
    expect(bairroNames).toContain("Khongolote");
    expect(bairroNames).toContain("T-3");
    expect(bairroNames).toContain("Matola Gare");
    expect(bairroNames).toContain("Fomento");
    expect(bairroNames).toContain("Tsalala");

    const boane = maputoProvincia.distritos.find((d) => d.name === "Boane")!;
    expect(boane.bairros.length).toBe(2);
  });

  it("includes quarteiroes under each bairro", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    const maputoProvincia = snapshot.provincias.find(
      (p) => p.name === "Província de Maputo",
    )!;
    const matola = maputoProvincia.distritos.find((d) => d.name === "Matola")!;
    const khongolote = matola.bairros.find((b) => b.name === "Khongolote")!;
    expect(khongolote.quarteiroes.length).toBe(3);
    const quarteiraoNames = khongolote.quarteiroes.map((q) => q.name);
    expect(quarteiraoNames).toContain("Quarteirão 12");
    expect(quarteiraoNames).toContain("Quarteirão 14");
    expect(quarteiraoNames).toContain("Quarteirão 7");
  });

  it("includes id and name fields at every level", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    for (const p of snapshot.provincias) {
      expect(p.id).toBeTruthy();
      expect(typeof p.name).toBe("string");
      for (const d of p.distritos) {
        expect(d.id).toBeTruthy();
        expect(typeof d.name).toBe("string");
        for (const b of d.bairros) {
          expect(b.id).toBeTruthy();
          expect(typeof b.name).toBe("string");
          for (const q of b.quarteiroes) {
            expect(q.id).toBeTruthy();
            expect(typeof q.name).toBe("string");
          }
        }
      }
    }
  });

  it("counts all bairros in the snapshot match the seeded total of 22", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    const totalBairros = snapshot.provincias.reduce(
      (sum, p) =>
        sum + p.distritos.reduce((s, d) => s + d.bairros.length, 0),
      0,
    );
    expect(totalBairros).toBe(22);
  });

  it("counts all quarteiroes in the snapshot match the seeded total of 30", async () => {
    const snapshot = await generateGeoSnapshot(prisma);
    const totalQuarteiroes = snapshot.provincias.reduce(
      (sum, p) =>
        sum +
        p.distritos.reduce(
          (s, d) => s + d.bairros.reduce((t, b) => t + b.quarteiroes.length, 0),
          0,
        ),
      0,
    );
    expect(totalQuarteiroes).toBe(30);
  });
});
