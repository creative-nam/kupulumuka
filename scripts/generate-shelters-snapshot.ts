import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFileSync } from "node:fs";
import path from "node:path";

export type SheltersSnapshotItem = {
  id: string;
  name: string;
  tier: "OFFICIAL" | "COMMUNITY";
  capacityStatus: "AVAILABLE" | "NEARLY_FULL" | "FULL";
  routeDescription: string;
  quarteiraoId: string;
  bairroId: string;
};

export async function generateSheltersSnapshot(
  prisma: PrismaClient,
): Promise<SheltersSnapshotItem[]> {
  const shelters = await prisma.shelter.findMany({
    include: {
      quarteirao: {
        select: {
          id: true,
          bairroId: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return shelters.map((s) => ({
    id: s.id,
    name: s.name,
    tier: s.tier,
    capacityStatus: s.capacityStatus,
    routeDescription: s.routeDescription,
    quarteiraoId: s.quarteirao.id,
    bairroId: s.quarteirao.bairroId,
  }));
}

async function main() {
  const connectionString =
    process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];
  if (!connectionString) {
    console.error("DIRECT_URL or DATABASE_URL must be set");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const snapshot = await generateSheltersSnapshot(prisma);

    const outputPath = path.resolve(
      __dirname,
      "..",
      "public",
      "shelters-snapshot.json",
    );
    writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), "utf-8");
    console.log(`Written ${snapshot.length} shelters to ${outputPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("generate-shelters-snapshot.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
