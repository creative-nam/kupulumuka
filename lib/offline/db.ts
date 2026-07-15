import Dexie from "dexie";
import type { GeoSnapshot } from "@/scripts/generate-geo-snapshot";
import type { SheltersSnapshotItem } from "@/scripts/generate-shelters-snapshot";

export type SyncMetaEntry = {
  id: string;
  value: string;
};

export type AdjacencyPairRecord = {
  id?: number;
  bairroAId: string;
  bairroBId: string;
};

export class KupulumukaDB extends Dexie {
  geoSnapshot!: Dexie.Table<{ id: string; data: GeoSnapshot }, string>;
  shelters!: Dexie.Table<SheltersSnapshotItem, string>;
  adjacencyPairs!: Dexie.Table<AdjacencyPairRecord, number>;
  syncMeta!: Dexie.Table<SyncMetaEntry, string>;

  constructor(name = "kupulumuka") {
    super(name);
    this.version(1).stores({
      geoSnapshot: "id",
      shelters: "id",
      adjacencyPairs: "++id",
      syncMeta: "id",
    });
  }
}

export function createDb(name?: string): KupulumukaDB {
  return new KupulumukaDB(name);
}

let _db: KupulumukaDB | null = null;

export function getDb(): KupulumukaDB {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export function resetDb(): void {
  _db = null;
}
