import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { getDb, resetDb } from "./db";
import { syncData } from "./sync";
import { DEFAULT_FETCH_TIMEOUT_MS } from "./fetch-with-timeout";

const mockGeoSnapshot = {
  provincias: [
    {
      id: "p1",
      name: "Província A",
      distritos: [
        {
          id: "d1",
          name: "Distrito A1",
          bairros: [
            {
              id: "b1",
              name: "Bairro A1-1",
              quarteiroes: [{ id: "q1", name: "Quarteirão A1-1-1" }],
            },
          ],
        },
      ],
    },
  ],
};

const mockSheltersSnapshot = [
  {
    id: "s1",
    name: "Abrigo Teste",
    tier: "OFFICIAL" as const,
    capacityStatus: "AVAILABLE" as const,
    routeDescription: "Rota de teste",
    quarteiraoId: "q1",
    bairroId: "b1",
  },
  {
    id: "s2",
    name: "Abrigo Teste 2",
    tier: "COMMUNITY" as const,
    capacityStatus: "FULL" as const,
    routeDescription: "Rota de teste 2",
    quarteiraoId: "q2",
    bairroId: "b2",
  },
];

const mockAdjacencyPairs = [
  { bairroAId: "b1", bairroBId: "b2" },
  { bairroAId: "b2", bairroBId: "b3" },
];

const mockFetchGeo = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(mockGeoSnapshot),
});

const mockFetchShelters = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(mockSheltersSnapshot),
});

const mockFetchAdjacency = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(mockAdjacencyPairs),
});

describe("syncData", () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetDb();
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/geo-snapshot.json") return mockFetchGeo();
      if (url === "/shelters-snapshot.json") return mockFetchShelters();
      if (url === "/api/adjacency") return mockFetchAdjacency();
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it("stores geo snapshot, shelters, adjacency pairs, and timestamp on successful sync", async () => {
    const result = await syncData();

    const db = getDb();
    const geo = await db.geoSnapshot.get("primary");
    expect(geo).not.toBeUndefined();
    expect(geo!.data).toEqual(mockGeoSnapshot);

    const shelters = await db.shelters.toArray();
    expect(shelters).toHaveLength(2);
    expect(shelters.map((s) => s.name)).toContain("Abrigo Teste");

    const pairs = await db.adjacencyPairs.toArray();
    expect(pairs).toHaveLength(2);

    const meta = await db.syncMeta.get("lastSyncedAt");
    expect(meta).not.toBeUndefined();
    expect(meta!.value).toBe(result.lastSyncedAt);

    const parsedTime = new Date(result.lastSyncedAt).getTime();
    expect(parsedTime).not.toBeNaN();
    expect(Date.now() - parsedTime).toBeLessThan(5000);
  });

  it("refreshes data on second sync rather than skipping", async () => {
    await syncData();

    const updatedShelter = {
      ...mockSheltersSnapshot[0],
      name: "Abrigo Actualizado",
    };
    const updatedShelters = [updatedShelter, mockSheltersSnapshot[1]];

    mockFetchShelters.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updatedShelters),
    });
    mockFetchGeo.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeoSnapshot),
    });
    mockFetchAdjacency.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdjacencyPairs),
    });

    const result2 = await syncData();

    const db = getDb();
    const shelters = await db.shelters.toArray();
    expect(shelters).toHaveLength(2);
    expect(shelters.map((s) => s.name)).toContain("Abrigo Actualizado");

    const meta = await db.syncMeta.get("lastSyncedAt");
    expect(meta!.value).toBe(result2.lastSyncedAt);
  });

  it("throws when geo snapshot fetch fails", async () => {
    mockFetchGeo.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(syncData()).rejects.toThrow("Failed to fetch sync data");
  });

  it("throws when shelters snapshot fetch fails", async () => {
    mockFetchShelters.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(syncData()).rejects.toThrow("Failed to fetch sync data");
  });

  it("throws when adjacency fetch fails", async () => {
    mockFetchAdjacency.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(syncData()).rejects.toThrow("Failed to fetch sync data");
  });

  it("rejects instead of hanging forever when a sync fetch never settles", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      global.fetch = vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
        if (url === "/geo-snapshot.json") {
          return new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(
                new DOMException("The operation was aborted", "AbortError"),
              ),
            );
          });
        }
        if (url === "/shelters-snapshot.json") return mockFetchShelters();
        if (url === "/api/adjacency") return mockFetchAdjacency();
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const promise = syncData();
      const rejection = expect(promise).rejects.toThrow();

      await vi.advanceTimersByTimeAsync(DEFAULT_FETCH_TIMEOUT_MS);

      await rejection;
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-syncs and updates timestamp when going back online after a cached session", async () => {
    const result1 = await syncData();
    const ts1 = result1.lastSyncedAt;

    await new Promise((r) => setTimeout(r, 10));

    mockFetchGeo.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeoSnapshot),
    });
    mockFetchShelters.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSheltersSnapshot),
    });
    mockFetchAdjacency.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdjacencyPairs),
    });

    const result2 = await syncData();
    const ts2 = result2.lastSyncedAt;

    expect(ts2).not.toBe(ts1);

    const ts1Time = new Date(ts1).getTime();
    const ts2Time = new Date(ts2).getTime();
    expect(ts2Time).toBeGreaterThan(ts1Time);
  });

  it("dedupes overlapping syncData calls: one fetch sequence, same result for both callers", async () => {
    let releaseGeo!: () => void;
    const geoGate = new Promise<void>((resolve) => {
      releaseGeo = resolve;
    });

    const fetchCounts = new Map<string, number>();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      fetchCounts.set(url, (fetchCounts.get(url) ?? 0) + 1);
      if (url === "/geo-snapshot.json") {
        return geoGate.then(() => ({
          ok: true,
          json: () => Promise.resolve(mockGeoSnapshot),
        }));
      }
      if (url === "/shelters-snapshot.json") return mockFetchShelters();
      if (url === "/api/adjacency") return mockFetchAdjacency();
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const first = syncData();
    const second = syncData();

    expect(fetchCounts.get("/geo-snapshot.json")).toBe(1);
    expect(fetchCounts.get("/shelters-snapshot.json")).toBe(1);
    expect(fetchCounts.get("/api/adjacency")).toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(3);

    releaseGeo();

    const [resultA, resultB] = await Promise.all([first, second]);

    expect(resultA).toBe(resultB);
    expect(resultA.lastSyncedAt).toBe(resultB.lastSyncedAt);

    const db = getDb();
    const shelters = await db.shelters.toArray();
    expect(shelters).toHaveLength(2);
    expect(await db.syncMeta.get("lastSyncedAt")).toHaveProperty(
      "value",
      resultA.lastSyncedAt,
    );
  });
});
