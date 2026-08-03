import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();

vi.mock("@/lib/db/prisma-client", () => ({
  prisma: {
    bairroVizinho: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { GET } from "./route";

describe("GET /api/adjacency", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindMany.mockReset();
  });

  it("returns adjacency pairs on success", async () => {
    const pairs = [
      { bairroAId: "b1", bairroBId: "b2" },
      { bairroAId: "b2", bairroBId: "b3" },
    ];
    mockFindMany.mockResolvedValue(pairs);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(pairs);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when bairroVizinho.findMany throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockFindMany.mockRejectedValue(new Error("Database connection failed"));

    const res = await GET();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockFindMany).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });
});
