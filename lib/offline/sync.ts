import { getDb } from "./db";
import type { GeoSnapshot } from "@/scripts/generate-geo-snapshot";
import type { SheltersSnapshotItem } from "@/scripts/generate-shelters-snapshot";
import type { AdjacencyPairRecord } from "./db";

type AdjacencyResponse = { bairroAId: string; bairroBId: string }[];

export async function syncData(): Promise<{ lastSyncedAt: string }> {
  const [geoRes, sheltersRes, adjacencyRes] = await Promise.all([
    fetch("/geo-snapshot.json"),
    fetch("/shelters-snapshot.json"),
    fetch("/api/adjacency"),
  ]);

  if (!geoRes.ok || !sheltersRes.ok || !adjacencyRes.ok) {
    throw new Error("Failed to fetch sync data");
  }

  const geo: GeoSnapshot = await geoRes.json();
  const shelters: SheltersSnapshotItem[] = await sheltersRes.json();
  const adjacency: AdjacencyResponse = await adjacencyRes.json();

  const now = new Date().toISOString();
  const db = getDb();

  await db.transaction(
    "rw",
    db.geoSnapshot,
    db.shelters,
    db.adjacencyPairs,
    db.syncMeta,
    async () => {
      await db.geoSnapshot.put({ id: "primary", data: geo });

      await db.shelters.clear();
      await db.shelters.bulkAdd(shelters);

      await db.adjacencyPairs.clear();
      const pairs: AdjacencyPairRecord[] = adjacency.map((a) => ({
        bairroAId: a.bairroAId,
        bairroBId: a.bairroBId,
      }));
      if (pairs.length > 0) {
        await db.adjacencyPairs.bulkAdd(pairs);
      }

      await db.syncMeta.put({ id: "lastSyncedAt", value: now });
    },
  );

  return { lastSyncedAt: now };
}
