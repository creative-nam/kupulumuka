export type ShelterInput = {
  id: string;
  name: string;
  tier: "OFFICIAL" | "COMMUNITY";
  capacityStatus: "AVAILABLE" | "NEARLY_FULL" | "FULL";
  routeDescription: string;
  quarteiraoId: string;
  quarteiraoName: string;
  bairroId: string;
  bairroName: string;
};

export type AdjacencyPair = {
  bairroAId: string;
  bairroBId: string;
};

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

export function rankAndFilterShelters(
  shelters: ShelterInput[],
  targetBairroId: string,
  adjacencyPairs: AdjacencyPair[],
): ShelterSearchResult[] {
  const localShelters = shelters.filter(
    (s) => s.bairroId === targetBairroId,
  );

  let results: ShelterSearchResult[];

  if (localShelters.length > 0) {
    results = localShelters.map((s) => ({
      ...s,
      fromNeighboringBairro: false,
    }));
  } else {
    const neighborIds = adjacencyPairs
      .filter(
        (p) =>
          p.bairroAId === targetBairroId || p.bairroBId === targetBairroId,
      )
      .map((p) =>
        p.bairroAId === targetBairroId ? p.bairroBId : p.bairroAId,
      );

    if (neighborIds.length === 0) return [];

    results = shelters
      .filter((s) => neighborIds.includes(s.bairroId))
      .map((s) => ({
        ...s,
        fromNeighboringBairro: true,
      }));
  }

  results.sort((a, b) => {
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;

    const capDiff =
      CAPACITY_ORDER[a.capacityStatus] - CAPACITY_ORDER[b.capacityStatus];
    if (capDiff !== 0) return capDiff;

    return a.name.localeCompare(b.name);
  });

  return results;
}
