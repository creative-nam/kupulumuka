import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/prisma-client";
import {
  rankAndFilterShelters,
} from "./rank-and-filter";
import type {
  ShelterSearchResponse,
  ShelterSearchResult,
} from "./rank-and-filter";

export type { ShelterSearchResponse, ShelterSearchResult };

const shelterInclude = {
  quarteirao: {
    select: {
      id: true,
      name: true,
      bairro: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ShelterInclude;

export async function getSheltersForQuarteirao(
  quarteiraoId: string,
  client?: PrismaClient,
): Promise<ShelterSearchResponse> {
  const db = client ?? prisma;

  const quarteirao = await db.quarteirao.findUnique({
    where: { id: quarteiraoId },
    select: {
      bairro: { select: { id: true, name: true } },
    },
  });

  if (!quarteirao) {
    return { originBairro: null, results: [] };
  }

  const originBairro = {
    id: quarteirao.bairro.id,
    name: quarteirao.bairro.name,
  };

  const bairroId = quarteirao.bairro.id;

  const [localShelters, scopedAdjacency] = await Promise.all([
    db.shelter.findMany({
      where: { quarteirao: { bairroId } },
      include: shelterInclude,
    }),
    db.bairroVizinho.findMany({
      where: { OR: [{ bairroAId: bairroId }, { bairroBId: bairroId }] },
    }),
  ]);

  const adjacencyPairs = scopedAdjacency.map((v) => ({
    bairroAId: v.bairroAId,
    bairroBId: v.bairroBId,
  }));

  let dbShelters = localShelters;

  if (localShelters.length === 0) {
    const neighborIds = adjacencyPairs.map((p) =>
      p.bairroAId === bairroId ? p.bairroBId : p.bairroAId,
    );

    if (neighborIds.length > 0) {
      dbShelters = await db.shelter.findMany({
        where: { quarteirao: { bairroId: { in: neighborIds } } },
        include: shelterInclude,
      });
    }
  }

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

  return {
    originBairro,
    results: rankAndFilterShelters(
      shelterInputs,
      bairroId,
      adjacencyPairs,
    ),
  };
}
