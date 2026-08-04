// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaPgConstructed } = vi.hoisted(() => ({
  prismaPgConstructed: { count: 0 },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor() {
      prismaPgConstructed.count += 1;
    }
  },
}));

vi.mock("@/lib/generated/prisma/client", () => ({
  PrismaClient: class {
    constructor(public options: unknown) {}
  },
}));

describe("lib/db/prisma-client", () => {
  beforeEach(() => {
    delete (globalThis as { prisma?: unknown }).prisma;
    prismaPgConstructed.count = 0;
    delete process.env["DATABASE_URL"];
    vi.resetModules();
  });

  it("reuses the cached client across module re-evaluations without constructing a new adapter", async () => {
    process.env["DATABASE_URL"] =
      "postgresql://user:pass@localhost:5432/kupulumuka";

    const { prisma: first } = await import("./prisma-client");
    expect(prismaPgConstructed.count).toBe(1);

    vi.resetModules();
    const { prisma: second } = await import("./prisma-client");
    expect(second).toBe(first);
    expect(prismaPgConstructed.count).toBe(1);
  });

  it("constructs exactly one new adapter per freshly created client", async () => {
    process.env["DATABASE_URL"] =
      "postgresql://user:pass@localhost:5432/kupulumuka";

    await import("./prisma-client");
    expect(prismaPgConstructed.count).toBe(1);

    delete (globalThis as { prisma?: unknown }).prisma;
    vi.resetModules();
    await import("./prisma-client");
    expect(prismaPgConstructed.count).toBe(2);
  });

  it("throws a clear error when DATABASE_URL is missing", async () => {
    await expect(import("./prisma-client")).rejects.toThrow(
      "DATABASE_URL is not set",
    );
  });
});
