import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/offline/sync", () => ({
  syncData: vi.fn(),
}));

import { syncData } from "@/lib/offline/sync";
import { SyncOnLoad } from "./sync-on-load";

const syncDataMock = syncData as ReturnType<typeof vi.fn>;

describe("SyncOnLoad", () => {
  beforeEach(() => {
    syncDataMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("logs when the initial sync fails instead of silently swallowing the error", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    const error = new Error("Snapshot endpoint down");
    syncDataMock.mockRejectedValue(error);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<SyncOnLoad />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Initial sync failed:", error);
    });
  });

  it("logs when the online re-sync fails instead of silently swallowing the error", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const error = new Error("Snapshot endpoint down");
    syncDataMock.mockRejectedValue(error);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<SyncOnLoad />);
    window.dispatchEvent(new Event("online"));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Online sync failed:", error);
    });
  });
});
