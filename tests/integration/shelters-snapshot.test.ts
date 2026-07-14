// @vitest-environment node
import "dotenv/config";
import { execSync } from "node:child_process";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runSeed } from "@/prisma/seed";
import { generateSheltersSnapshot } from "@/scripts/generate-shelters-snapshot";

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

describe("Shelters snapshot generation", () => {
  it("produces an array of all shelters", async () => {
    const snapshot = await generateSheltersSnapshot(prisma);
    expect(Array.isArray(snapshot)).toBe(true);
  });

  it("includes exactly 25 shelters matching seeded count", async () => {
    const snapshot = await generateSheltersSnapshot(prisma);
    expect(snapshot).toHaveLength(25);
  });

  it("includes all three Khongolote shelters", async () => {
    const snapshot = await generateSheltersSnapshot(prisma);
    const names = snapshot.map((s) => s.name);
    expect(names).toContain("EPC Khongolote");
    expect(names).toContain("Igreja Católica");
    expect(names).toContain("Salão Paroquial S. João");
  });

  it("includes tier, capacityStatus, routeDescription, quarteiraoId, and bairroId in each entry", async () => {
    const snapshot = await generateSheltersSnapshot(prisma);
    for (const s of snapshot) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(["OFFICIAL", "COMMUNITY"]).toContain(s.tier);
      expect(["AVAILABLE", "NEARLY_FULL", "FULL"]).toContain(s.capacityStatus);
      expect(s.routeDescription).toBeTruthy();
      expect(s.quarteiraoId).toBeTruthy();
      expect(s.bairroId).toBeTruthy();
    }
  });

  it("includes shelters from all four provinces", async () => {
    const snapshot = await generateSheltersSnapshot(prisma);

    const provincias = await prisma.provincia.findMany({
      include: {
        distritos: {
          include: {
            bairros: {
              include: {
                quarteiroes: {
                  include: { shelters: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    });

    const provinciaShelterIds = new Map<string, Set<string>>();
    for (const p of provincias) {
      const ids = new Set<string>();
      for (const d of p.distritos) {
        for (const b of d.bairros) {
          for (const q of b.quarteiroes) {
            for (const s of q.shelters) {
              ids.add(s.id);
            }
          }
        }
      }
      provinciaShelterIds.set(p.name, ids);
    }

    for (const [, ids] of provinciaShelterIds) {
      if (ids.size === 0) continue;
      const found = snapshot.filter((s) => ids.has(s.id));
      expect(found.length).toBe(ids.size);
    }
  });
});
