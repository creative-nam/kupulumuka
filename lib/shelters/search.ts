import type { PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/prisma-client";
import {
  rankAndFilterShelters,
} from "./rank-and-filter";
import type { ShelterSearchResult } from "./rank-and-filter";

export type { ShelterSearchResult };

export async function getSheltersForQuarteirao(
  quarteiraoId: string,
  client?: PrismaClient,
): Promise<ShelterSearchResult[]> {
  const db = client ?? prisma;

  const quarteirao = await db.quarteirao.findUnique({
    where: { id: quarteiraoId },
    select: { bairroId: true },
  });

  if (!quarteirao) return [];

  const [dbShelters, dbAdjacency] = await Promise.all([
    db.shelter.findMany({
      include: {
        quarteirao: {
          select: {
            id: true,
            name: true,
            bairro: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.bairroVizinho.findMany(),
  ]);

  const shelterInputs = dbShelters.map((s) => ({
    id: s.id,
    name: s.name,
    tier: s.tier,
    capacityStatus: s.capacityStatus,
    routeDescription: s.routeDescription,
    quarteiraoId: s.quarteiraoId,
    quarteiraoName: s.quarteirao.name,
    bairroId: s.quarteirao.bairro.id,
    bairroName: s.quarteirao.bairro.name,
  }));

  const adjacencyPairs = dbAdjacency.map((v) => ({
    bairroAId: v.bairroAId,
    bairroBId: v.bairroBId,
  }));

  return rankAndFilterShelters(shelterInputs, quarteirao.bairroId, adjacencyPairs);
}
