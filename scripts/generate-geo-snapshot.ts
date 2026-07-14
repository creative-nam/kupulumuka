import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFileSync } from "node:fs";
import path from "node:path";

export type GeoSnapshot = {
  provincias: {
    id: string;
    name: string;
    distritos: {
      id: string;
      name: string;
      bairros: {
        id: string;
        name: string;
        quarteiroes: { id: string; name: string }[];
      }[];
    }[];
  }[];
};

export async function generateGeoSnapshot(
  prisma: PrismaClient,
): Promise<GeoSnapshot> {
  const provincias = await prisma.provincia.findMany({
    include: {
      distritos: {
        orderBy: { name: "asc" },
        include: {
          bairros: {
            orderBy: { name: "asc" },
            include: {
              quarteiroes: {
                orderBy: { name: "asc" },
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    provincias: provincias.map((p) => ({
      id: p.id,
      name: p.name,
      distritos: p.distritos.map((d) => ({
        id: d.id,
        name: d.name,
        bairros: d.bairros.map((b) => ({
          id: b.id,
          name: b.name,
          quarteiroes: b.quarteiroes.map((q) => ({
            id: q.id,
            name: q.name,
          })),
        })),
      })),
    })),
  };
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
    const snapshot = await generateGeoSnapshot(prisma);

    const outputPath = path.resolve(
      __dirname,
      "..",
      "public",
      "geo-snapshot.json",
    );
    writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), "utf-8");
    console.log(`Written to ${outputPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("generate-geo-snapshot.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
