import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { getDb, resetDb } from "./db";
import { getCachedShelters } from "./query";
import type { GeoSnapshot } from "@/scripts/generate-geo-snapshot";
import type { SheltersSnapshotItem } from "@/scripts/generate-shelters-snapshot";

const BAIRRO_A_ID = "bairro-a";
const BAIRRO_B_ID = "bairro-b";
const BAIRRO_C_ID = "bairro-c";
const Q1_ID = "q1";
const Q2_ID = "q2";
const Q3_ID = "q3";

const geoSnapshot: GeoSnapshot = {
  provincias: [
    {
      id: "prov1",
      name: "Província Teste",
      distritos: [
        {
          id: "dist1",
          name: "Distrito Teste",
          bairros: [
            {
              id: BAIRRO_A_ID,
              name: "Bairro A",
              quarteiroes: [{ id: Q1_ID, name: "Quarteirão 1" }],
            },
            {
              id: BAIRRO_B_ID,
              name: "Bairro B",
              quarteiroes: [{ id: Q2_ID, name: "Quarteirão 2" }],
            },
            {
              id: BAIRRO_C_ID,
              name: "Bairro C",
              quarteiroes: [{ id: Q3_ID, name: "Quarteirão 3" }],
            },
          ],
        },
      ],
    },
  ],
};

const shelterInB: SheltersSnapshotItem = {
  id: "shelter-b-community",
  name: "Centro Comunitário B",
  tier: "COMMUNITY",
  capacityStatus: "FULL",
  routeDescription: "Rota B comunitária",
  quarteiraoId: Q2_ID,
  bairroId: BAIRRO_B_ID,
};

const shelterInB2: SheltersSnapshotItem = {
  id: "shelter-b-official",
  name: "EPC Bairro B",
  tier: "OFFICIAL",
  capacityStatus: "AVAILABLE",
  routeDescription: "Rota B oficial",
  quarteiraoId: Q2_ID,
  bairroId: BAIRRO_B_ID,
};

const shelterInC: SheltersSnapshotItem = {
  id: "shelter-c",
  name: "EPC Bairro C",
  tier: "OFFICIAL",
  capacityStatus: "AVAILABLE",
  routeDescription: "Rota C",
  quarteiraoId: Q3_ID,
  bairroId: BAIRRO_C_ID,
};

const shelterInA: SheltersSnapshotItem = {
  id: "shelter-a",
  name: "EPC Bairro A",
  tier: "OFFICIAL",
  capacityStatus: "NEARLY_FULL",
  routeDescription: "Rota A",
  quarteiraoId: Q1_ID,
  bairroId: BAIRRO_A_ID,
};

const LAST_SYNCED_AT = "2026-08-02T10:00:00.000Z";

async function seedDexie(options: {
  shelters: SheltersSnapshotItem[];
  adjacencyPairs?: { bairroAId: string; bairroBId: string }[];
}): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    db.geoSnapshot,
    db.shelters,
    db.adjacencyPairs,
    db.syncMeta,
    async () => {
      await db.geoSnapshot.put({ id: "primary", data: geoSnapshot });
      await db.shelters.clear();
      await db.shelters.bulkAdd(options.shelters);
      await db.adjacencyPairs.clear();
      if (options.adjacencyPairs) {
        await db.adjacencyPairs.bulkAdd(options.adjacencyPairs);
      }
      await db.syncMeta.put({ id: "lastSyncedAt", value: LAST_SYNCED_AT });
    },
  );
}

describe("getCachedShelters (real Dexie composition)", () => {
  beforeEach(() => {
    resetDb();
  });

  it("returns neighboring-bairro shelters from cached adjacency pairs when the selected bairro has zero local shelters", async () => {
    await seedDexie({
      shelters: [shelterInB, shelterInB2, shelterInC],
      adjacencyPairs: [{ bairroAId: BAIRRO_A_ID, bairroBId: BAIRRO_B_ID }],
    });

    const result = await getCachedShelters(Q1_ID);

    expect(result.originBairro).toEqual({
      id: BAIRRO_A_ID,
      name: "Bairro A",
    });
    expect(result.lastSyncedAt).toBe(LAST_SYNCED_AT);
    expect(result.results).toHaveLength(2);
    expect(result.results.map((r) => r.id).sort()).toEqual(
      [shelterInB2.id, shelterInB.id].sort(),
    );
    expect(
      result.results.every((r) => r.fromNeighboringBairro === true),
    ).toBe(true);
    expect(
      result.results.some((r) => r.bairroName === "Bairro C"),
    ).toBe(false);
    expect(result.results[0].bairroName).toBe("Bairro B");
    expect(result.results[0].quarteiraoName).toBe("Quarteirão 2");
  });

  it("runs the overflow results through rankAndFilterShelters sort order (tier, then capacity, then name)", async () => {
    await seedDexie({
      shelters: [shelterInB, shelterInB2],
      adjacencyPairs: [{ bairroAId: BAIRRO_A_ID, bairroBId: BAIRRO_B_ID }],
    });

    const result = await getCachedShelters(Q1_ID);

    expect(result.results.map((r) => r.id)).toEqual([
      shelterInB2.id,
      shelterInB.id,
    ]);
  });

  it("returns only local shelters, unflagged, when the selected bairro has shelters", async () => {
    await seedDexie({
      shelters: [shelterInA, shelterInB2],
      adjacencyPairs: [{ bairroAId: BAIRRO_A_ID, bairroBId: BAIRRO_B_ID }],
    });

    const result = await getCachedShelters(Q1_ID);

    expect(result.originBairro).toEqual({
      id: BAIRRO_A_ID,
      name: "Bairro A",
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe(shelterInA.id);
    expect(result.results[0].fromNeighboringBairro).toBe(false);
    expect(
      result.results.some((r) => r.bairroName === "Bairro B"),
    ).toBe(false);
  });

  it("returns empty results and a null origin when the quarteirao is unknown to the cached geo snapshot", async () => {
    await seedDexie({
      shelters: [shelterInB2],
      adjacencyPairs: [{ bairroAId: BAIRRO_A_ID, bairroBId: BAIRRO_B_ID }],
    });

    const result = await getCachedShelters("unknown-quarteirao");

    expect(result.originBairro).toBeNull();
    expect(result.results).toEqual([]);
    expect(result.lastSyncedAt).toBe(LAST_SYNCED_AT);
  });
});
