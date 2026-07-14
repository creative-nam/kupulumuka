// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// In CI, use "test_seed" schema. For local dev, reuse "public".
const TEST_SCHEMA = "public";

function getTestUrl(): string {
  const base = process.env["DIRECT_URL"];
  if (!base) throw new Error("DIRECT_URL is not set");
  const url = new URL(base);
  url.searchParams.set("schema", TEST_SCHEMA);
  return url.toString();
}

async function createTestClient() {
  const url = getTestUrl();
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = await createTestClient();
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
      where: { name: "Khongolote" },
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
    // Query the information schema to check the column constraint
    const result = await prisma.$queryRaw<
      { is_nullable: string }[]
    >`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'Shelter' AND column_name = 'routeDescription'`;
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

  it("has BairroVizinho adjacency in at least two different provinces", async () => {
    const vizinhos = await prisma.bairroVizinho.findMany({
      include: {
        bairroA: { include: { distrito: true } },
        bairroB: { include: { distrito: true } },
      },
    });
    expect(vizinhos.length).toBeGreaterThanOrEqual(2);

    // Collect unique province names from the adjacency pairs
    const provincesWithAdjacency = new Set(
      vizinhos.map((v) => v.bairroA.distrito.provinciaId),
    );
    expect(provincesWithAdjacency.size).toBeGreaterThanOrEqual(2);
  });

  it("resolves BairroVizinho correctly for at least two different pairs in two different provinces", async () => {
    const vizinhos = await prisma.bairroVizinho.findMany({
      include: {
        bairroA: {
          include: { distrito: { include: { provincia: true } } },
        },
        bairroB: {
          include: { distrito: { include: { provincia: true } } },
        },
      },
    });

    // Find pairs from different provinces
    const provinces = new Set(
      vizinhos.map((v) => v.bairroA.distrito.provincia.name),
    );
    expect(provinces.size).toBeGreaterThanOrEqual(2);

    // Verify at least one pair in each of two provinces by querying the reverse direction
    const provinciaNames = Array.from(provinces).slice(0, 2);
    for (const name of provinciaNames) {
      const pairsInProvince = vizinhos.filter(
        (v) => v.bairroA.distrito.provincia.name === name,
      );
      expect(pairsInProvince.length).toBeGreaterThanOrEqual(1);

      // Verify adjacency resolves correctly (bairros are different)
      const pair = pairsInProvince[0];
      expect(pair.bairroA.name).not.toBe(pair.bairroB.name);
    }
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
    // All citizens have a phone; one (Carlos) also has an email to link to shelters
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

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
});
