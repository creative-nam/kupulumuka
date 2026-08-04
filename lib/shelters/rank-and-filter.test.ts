import { describe, it, expect } from "vitest";
import { rankAndFilterShelters } from "./rank-and-filter";
import type { AdjacencyPair, ShelterInput } from "./rank-and-filter";

const tierOrder = { OFFICIAL: 0, COMMUNITY: 1 } as const;
const capOrder = { AVAILABLE: 0, NEARLY_FULL: 1, FULL: 2 } as const;

function expectSorted(results: { tier: string; capacityStatus: string; name: string }[]) {
  for (let i = 1; i < results.length; i++) {
    const a = results[i - 1];
    const b = results[i];
    const aTier = tierOrder[a.tier as keyof typeof tierOrder];
    const bTier = tierOrder[b.tier as keyof typeof tierOrder];
    if (aTier !== bTier) {
      expect(aTier).toBeLessThan(bTier);
      continue;
    }
    const aCap = capOrder[a.capacityStatus as keyof typeof capOrder];
    const bCap = capOrder[b.capacityStatus as keyof typeof capOrder];
    if (aCap !== bCap) {
      expect(aCap).toBeLessThan(bCap);
      continue;
    }
    expect(a.name.localeCompare(b.name)).toBeLessThanOrEqual(0);
  }
}

const khongoloteBairroId = "bairro-khongolote";
const t3BairroId = "bairro-t3";

const khongoloteShelters: ShelterInput[] = [
  {
    id: "shelter-epc",
    name: "EPC Khongolote",
    tier: "OFFICIAL",
    capacityStatus: "AVAILABLE",
    routeDescription: "Rota 1",
    quarteiraoId: "q12",
    quarteiraoName: "Quarteirão 12",
    bairroId: khongoloteBairroId,
    bairroName: "Khongolote",
  },
  {
    id: "shelter-igreja",
    name: "Igreja Católica",
    tier: "OFFICIAL",
    capacityStatus: "NEARLY_FULL",
    routeDescription: "Rota 2",
    quarteiraoId: "q14",
    quarteiraoName: "Quarteirão 14",
    bairroId: khongoloteBairroId,
    bairroName: "Khongolote",
  },
  {
    id: "shelter-salao",
    name: "Salão Paroquial S. João",
    tier: "COMMUNITY",
    capacityStatus: "AVAILABLE",
    routeDescription: "Rota 3",
    quarteiraoId: "q7",
    quarteiraoName: "Quarteirão 7",
    bairroId: khongoloteBairroId,
    bairroName: "Khongolote",
  },
];

const t3Shelters: ShelterInput[] = [
  {
    id: "shelter-t3",
    name: "Centro Comunitário T-3",
    tier: "COMMUNITY",
    capacityStatus: "AVAILABLE",
    routeDescription: "Rota T3",
    quarteiraoId: "qt3",
    quarteiraoName: "Quarteirão T-3",
    bairroId: t3BairroId,
    bairroName: "T-3",
  },
];

const allShelters = [...khongoloteShelters, ...t3Shelters];

describe("rankAndFilterShelters", () => {
  it("returns empty array when no shelters are provided", () => {
    const result = rankAndFilterShelters([], "some-bairro", []);
    expect(result).toEqual([]);
  });

  it("returns local shelters sorted by tier, capacity, name when bairro has shelters", () => {
    const result = rankAndFilterShelters(
      khongoloteShelters,
      khongoloteBairroId,
      [],
    );

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("EPC Khongolote");
    expect(result[0].tier).toBe("OFFICIAL");
    expect(result[0].capacityStatus).toBe("AVAILABLE");

    expect(result[1].name).toBe("Igreja Católica");
    expect(result[1].tier).toBe("OFFICIAL");
    expect(result[1].capacityStatus).toBe("NEARLY_FULL");

    expect(result[2].name).toBe("Salão Paroquial S. João");
    expect(result[2].tier).toBe("COMMUNITY");
    expect(result[2].capacityStatus).toBe("AVAILABLE");

    expectSorted(result);
  });

  it("sets fromNeighboringBairro to false for local shelters", () => {
    const result = rankAndFilterShelters(
      khongoloteShelters,
      khongoloteBairroId,
      [],
    );

    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.fromNeighboringBairro).toBe(false);
    }
  });

  it("triggers overflow to neighboring bairros when local bairro has zero shelters", () => {
    const zeroShelterBairroId = "bairro-zero";

    const result = rankAndFilterShelters(
      allShelters,
      zeroShelterBairroId,
      [
        { bairroAId: zeroShelterBairroId, bairroBId: khongoloteBairroId },
      ],
    );

    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.fromNeighboringBairro).toBe(true);
    }
    const names = result.map((r) => r.name);
    expect(names).toContain("EPC Khongolote");
    expect(names).toContain("Igreja Católica");
    expect(names).toContain("Salão Paroquial S. João");
    expectSorted(result);
  });

  it("returns empty array when local bairro and all neighbors have zero shelters", () => {
    const emptyBairro1Id = "bairro-empty-1";
    const emptyBairro2Id = "bairro-empty-2";

    const result = rankAndFilterShelters(
      [],
      emptyBairro1Id,
      [{ bairroAId: emptyBairro1Id, bairroBId: emptyBairro2Id }],
    );

    expect(result).toEqual([]);
  });

  it("correctly sorts OFFICIAL before COMMUNITY across different bairros during overflow", () => {
    const overflowBairroId = "bairro-overflow";

    const overflowAdjacency: AdjacencyPair[] = [
      { bairroAId: overflowBairroId, bairroBId: khongoloteBairroId },
      { bairroAId: overflowBairroId, bairroBId: t3BairroId },
    ];

    const result = rankAndFilterShelters(
      allShelters,
      overflowBairroId,
      overflowAdjacency,
    );

    let foundCommunity = false;
    for (const r of result) {
      if (r.tier === "COMMUNITY") foundCommunity = true;
      if (foundCommunity) {
        expect(r.tier).toBe("COMMUNITY");
      }
    }

    expect(foundCommunity).toBe(true);
    expectSorted(result);
  });

  it("includes routeDescription, quarteiraoName, and bairroName in results", () => {
    const result = rankAndFilterShelters(
      khongoloteShelters,
      khongoloteBairroId,
      [],
    );

    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.routeDescription).toBeTruthy();
      expect(r.quarteiraoName).toBeTruthy();
      expect(r.bairroName).toBeTruthy();
    }
  });
});
