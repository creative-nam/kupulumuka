import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSheltersForQuarteirao = vi.fn();

vi.mock("@/lib/shelters/search", () => ({
  getSheltersForQuarteirao: (...args: unknown[]) =>
    mockGetSheltersForQuarteirao(...args),
}));

import { GET } from "./route";

describe("GET /api/shelters", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when quarteiraoId is missing", async () => {
    const req = new NextRequest("http://localhost/api/shelters");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "quarteiraoId query parameter is required" });
  });

  it("returns 500 when getSheltersForQuarteirao throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetSheltersForQuarteirao.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const req = new NextRequest(
      "http://localhost/api/shelters?quarteiraoId=some-id",
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockGetSheltersForQuarteirao).toHaveBeenCalledWith("some-id");

    consoleErrorSpy.mockRestore();
  });
});
