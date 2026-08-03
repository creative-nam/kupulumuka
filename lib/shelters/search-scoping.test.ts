import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSheltersForQuarteirao } from "./search";

const { shelterFindMany, bairroVizinhoFindMany, quarteiraoFindUnique } =
  vi.hoisted(() => ({
    shelterFindMany: vi.fn(),
    bairroVizinhoFindMany: vi.fn(),
    quarteiraoFindUnique: vi.fn(),
  }));

vi.mock("@/lib/db/prisma-client", () => ({
  prisma: {
    shelter: { findMany: shelterFindMany },
    bairroVizinho: { findMany: bairroVizinhoFindMany },
    quarteirao: { findUnique: quarteiraoFindUnique },
  },
}));

function shelterRow({
  id,
  name,
  bairroId,
  bairroName,
  quarteiraoId,
  quarteiraoName,
}: {
  id: string;
  name: string;
  bairroId: string;
  bairroName: string;
  quarteiraoId: string;
  quarteiraoName: string;
}) {
  return {
    id,
    name,
    tier: "OFFICIAL",
    capacityStatus: "AVAILABLE",
    routeDescription: "Seguir pela estrada principal até à entrada.",
    quarteiraoId,
    quarteirao: {
      id: quarteiraoId,
      name: quarteiraoName,
      bairro: { id: bairroId, name: bairroName },
    },
  };
}

describe("getSheltersForQuarteirao query scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quarteiraoFindUnique.mockResolvedValue({
      bairro: { id: "bairro-1", name: "Bairro A" },
    });
  });

  it("scopes the local shelter query to the selected bairro and the adjacency query to that bairro's pairs", async () => {
    shelterFindMany.mockResolvedValue([
      shelterRow({
        id: "shelter-1",
        name: "EPC Bairro A",
        bairroId: "bairro-1",
        bairroName: "Bairro A",
        quarteiraoId: "q-1",
        quarteiraoName: "Quarteirão 1",
      }),
    ]);
    bairroVizinhoFindMany.mockResolvedValue([]);

    const response = await getSheltersForQuarteirao("q-1");

    expect(shelterFindMany).toHaveBeenCalledTimes(1);
    expect(shelterFindMany.mock.calls[0][0].where).toEqual({
      quarteirao: { bairroId: "bairro-1" },
    });

    expect(bairroVizinhoFindMany).toHaveBeenCalledTimes(1);
    expect(bairroVizinhoFindMany.mock.calls[0][0].where).toEqual({
      OR: [{ bairroAId: "bairro-1" }, { bairroBId: "bairro-1" }],
    });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].name).toBe("EPC Bairro A");
    expect(response.results[0].fromNeighboringBairro).toBe(false);
  });

  it("runs a second shelter query scoped to the neighbor ids when the local bairro has zero shelters", async () => {
    shelterFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      shelterRow({
        id: "shelter-2",
        name: "EPC Khongolote",
        bairroId: "neighbor-1",
        bairroName: "Khongolote",
        quarteiraoId: "q-2",
        quarteiraoName: "Quarteirão 2",
      }),
    ]);
    bairroVizinhoFindMany.mockResolvedValue([
      { bairroAId: "bairro-1", bairroBId: "neighbor-1" },
      { bairroAId: "bairro-1", bairroBId: "neighbor-2" },
    ]);

    const response = await getSheltersForQuarteirao("q-1");

    expect(shelterFindMany).toHaveBeenCalledTimes(2);
    expect(shelterFindMany.mock.calls[0][0].where).toEqual({
      quarteirao: { bairroId: "bairro-1" },
    });
    expect(shelterFindMany.mock.calls[1][0].where).toEqual({
      quarteirao: { bairroId: { in: ["neighbor-1", "neighbor-2"] } },
    });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].name).toBe("EPC Khongolote");
    expect(response.results[0].fromNeighboringBairro).toBe(true);
  });

  it("does not run a neighbor query when the local bairro has zero shelters and no adjacency pairs", async () => {
    shelterFindMany.mockResolvedValue([]);
    bairroVizinhoFindMany.mockResolvedValue([]);

    const response = await getSheltersForQuarteirao("q-1");

    expect(shelterFindMany).toHaveBeenCalledTimes(1);
    expect(bairroVizinhoFindMany).toHaveBeenCalledTimes(1);
    expect(response.results).toEqual([]);
  });
});
