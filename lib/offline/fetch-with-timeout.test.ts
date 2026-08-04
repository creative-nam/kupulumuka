import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  fetchWithTimeout,
} from "./fetch-with-timeout";

function hangingFetch(_url: RequestInfo | URL, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () =>
      reject(new DOMException("The operation was aborted", "AbortError")),
    );
  });
}

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves with the response when fetch settles before the timeout", async () => {
    const response = { ok: true } as Response;
    global.fetch = vi.fn().mockResolvedValue(response);

    const promise = fetchWithTimeout("/geo-snapshot.json");

    await expect(promise).resolves.toBe(response);
    expect(global.fetch).toHaveBeenCalledWith(
      "/geo-snapshot.json",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes request init through to fetch alongside the abort signal", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

    await fetchWithTimeout("/api/shelters", {
      method: "GET",
      headers: { "X-Test": "1" },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/shelters",
      expect.objectContaining({
        method: "GET",
        headers: { "X-Test": "1" },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("rejects instead of hanging forever when the request never settles", async () => {
    global.fetch = vi.fn(hangingFetch);

    const promise = fetchWithTimeout("/hung-endpoint", {}, 1_000);
    const rejection = expect(promise).rejects.toThrow();

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1_000);

    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses the default timeout when none is provided", async () => {
    global.fetch = vi.fn(hangingFetch);

    const promise = fetchWithTimeout("/hung-endpoint");
    const rejection = expect(promise).rejects.toThrow();

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(DEFAULT_FETCH_TIMEOUT_MS);

    await rejection;
  });
});
