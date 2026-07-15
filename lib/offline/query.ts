import { getDb } from "./db";
import {
  rankAndFilterShelters,
} from "@/lib/shelters/rank-and-filter";
import type { ShelterSearchResult } from "@/lib/shelters/rank-and-filter";
import type { SheltersSnapshotItem } from "@/scripts/generate-shelters-snapshot";
import type { GeoSnapshot } from "@/scripts/generate-geo-snapshot";

type Lookups = {
  bairroName: Map<string, string>;
  quarteiraoName: Map<string, string>;
  quarteiraoToBairro: Map<string, string>;
};

function buildLookups(geo: GeoSnapshot): Lookups {
  const bairroName = new Map<string, string>();
  const quarteiraoName = new Map<string, string>();
  const quarteiraoToBairro = new Map<string, string>();

  for (const p of geo.provincias) {
    for (const d of p.distritos) {
      for (const b of d.bairros) {
        bairroName.set(b.id, b.name);
        for (const q of b.quarteiroes) {
          quarteiraoName.set(q.id, q.name);
          quarteiraoToBairro.set(q.id, b.id);
        }
      }
    }
  }

  return { bairroName, quarteiraoName, quarteiraoToBairro };
}

function shelteInputsWithNames(
  shelters: SheltersSnapshotItem[],
  lookups: Lookups,
) {
  return shelters.map((s) => ({
    id: s.id,
    name: s.name,
    tier: s.tier as "OFFICIAL" | "COMMUNITY",
    capacityStatus: s.capacityStatus as "AVAILABLE" | "NEARLY_FULL" | "FULL",
    routeDescription: s.routeDescription,
    quarteiraoId: s.quarteiraoId,
    quarteiraoName: lookups.quarteiraoName.get(s.quarteiraoId) ?? "",
    bairroId: s.bairroId,
    bairroName: lookups.bairroName.get(s.bairroId) ?? "",
  }));
}

export async function getCachedShelters(
  quarteiraoId: string,
): Promise<{ results: ShelterSearchResult[]; lastSyncedAt: string | null }> {
  const db = getDb();

  const [geoEntry, allShelters, adjacencyPairs, meta] = await Promise.all([
    db.geoSnapshot.get("primary"),
    db.shelters.toArray(),
    db.adjacencyPairs.toArray(),
    db.syncMeta.get("lastSyncedAt"),
  ]);

  if (!geoEntry) {
    return { results: [], lastSyncedAt: meta?.value ?? null };
  }

  const lookups = buildLookups(geoEntry.data);
  const targetBairroId = lookups.quarteiraoToBairro.get(quarteiraoId);

  if (!targetBairroId) {
    return { results: [], lastSyncedAt: meta?.value ?? null };
  }

  const shelterInputs = shelteInputsWithNames(allShelters, lookups);

  const adjacencyPairsMapped = adjacencyPairs.map((a) => ({
    bairroAId: a.bairroAId,
    bairroBId: a.bairroBId,
  }));

  const results = rankAndFilterShelters(
    shelterInputs,
    targetBairroId,
    adjacencyPairsMapped,
  );

  return { results, lastSyncedAt: meta?.value ?? null };
}

export async function getCachedGeoSnapshot(): Promise<GeoSnapshot | null> {
  const db = getDb();
  const entry = await db.geoSnapshot.get("primary");
  return entry?.data ?? null;
}

export async function getLastSyncedAt(): Promise<string | null> {
  const db = getDb();
  const meta = await db.syncMeta.get("lastSyncedAt");
  return meta?.value ?? null;
}
