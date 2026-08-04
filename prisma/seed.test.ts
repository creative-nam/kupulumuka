// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  prismaPgConstructed: { count: 0 },
  disconnectCalls: { count: 0 },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor() {
      state.prismaPgConstructed.count += 1;
    }
  },
}));

vi.mock("@/lib/generated/prisma/client", () => ({
  PrismaClient: class {
    async $transaction() {
      throw new Error("db unavailable");
    }
    async $disconnect() {
      state.disconnectCalls.count += 1;
    }
  },
}));

describe("prisma/seed entrypoint (main)", () => {
  beforeEach(() => {
    delete process.env["DIRECT_URL"];
    state.prismaPgConstructed.count = 0;
    state.disconnectCalls.count = 0;
    vi.resetModules();
  });

  it("throws a clear error when DIRECT_URL is missing without constructing the adapter or client", async () => {
    const { main } = await import("./seed");
    await expect(main()).rejects.toThrow("DIRECT_URL is not set");
    expect(state.prismaPgConstructed.count).toBe(0);
    expect(state.disconnectCalls.count).toBe(0);
  });

  it("disconnects the client even when the seed throws partway through", async () => {
    process.env["DIRECT_URL"] =
      "postgresql://user:pass@localhost:5432/kupulumuka";
    const { main } = await import("./seed");
    await expect(main()).rejects.toThrow("db unavailable");
    expect(state.prismaPgConstructed.count).toBe(1);
    expect(state.disconnectCalls.count).toBe(1);
  });
});
