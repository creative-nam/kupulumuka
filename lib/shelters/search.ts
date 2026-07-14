import type { PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/prisma-client";

export type ShelterSearchResult = {
  id: string;
  name: string;
  tier: "OFFICIAL" | "COMMUNITY";
  capacityStatus: "AVAILABLE" | "NEARLY_FULL" | "FULL";
  routeDescription: string;
  quarteiraoId: string;
  quarteiraoName: string;
  bairroName: string;
  fromNeighboringBairro: boolean;
};

const CAPACITY_ORDER: Record<string, number> = {
  AVAILABLE: 0,
  NEARLY_FULL: 1,
  FULL: 2,
};

const TIER_ORDER: Record<string, number> = {
  OFFICIAL: 0,
  COMMUNITY: 1,
};

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

  const bairroId = quarteirao.bairroId;

  const localQuarteiraoIds = await db.quarteirao
    .findMany({
      where: { bairroId },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  const localShelterCount = await db.shelter.count({
    where: { quarteiraoId: { in: localQuarteiraoIds } },
  });

  let targetBairroIds: string[];

  if (localShelterCount > 0) {
    targetBairroIds = [bairroId];
  } else {
    const vizinhos = await db.bairroVizinho.findMany({
      where: {
        OR: [{ bairroAId: bairroId }, { bairroBId: bairroId }],
      },
      select: { bairroAId: true, bairroBId: true },
    });
    targetBairroIds = vizinhos.map((v) =>
      v.bairroAId === bairroId ? v.bairroBId : v.bairroAId,
    );

    if (targetBairroIds.length === 0) return [];
  }

  const shelters = await db.shelter.findMany({
    where: {
      quarteirao: { bairroId: { in: targetBairroIds } },
    },
    include: {
      quarteirao: {
        select: {
          id: true,
          name: true,
          bairro: { select: { id: true, name: true } },
        },
      },
    },
  });

  const results: ShelterSearchResult[] = shelters.map((s) => ({
    id: s.id,
    name: s.name,
    tier: s.tier,
    capacityStatus: s.capacityStatus,
    routeDescription: s.routeDescription,
    quarteiraoId: s.quarteiraoId,
    quarteiraoName: s.quarteirao.name,
    bairroName: s.quarteirao.bairro.name,
    fromNeighboringBairro: s.quarteirao.bairro.id !== bairroId,
  }));

  results.sort((a, b) => {
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;

    const capDiff = CAPACITY_ORDER[a.capacityStatus] - CAPACITY_ORDER[b.capacityStatus];
    if (capDiff !== 0) return capDiff;

    return a.name.localeCompare(b.name);
  });

  return results;
}
