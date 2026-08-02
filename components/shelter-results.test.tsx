import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ShelterResults } from "./shelter-results";
import { DEFAULT_FETCH_TIMEOUT_MS } from "@/lib/offline/fetch-with-timeout";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/abrigos",
}));

const mockLiveShelters = [
  {
    id: "s1",
    name: "EPC Khongolote",
    tier: "OFFICIAL" as const,
    capacityStatus: "AVAILABLE" as const,
    routeDescription: "Rota principal",
    quarteiraoId: "q1",
    quarteiraoName: "Quarteirão 12",
    bairroName: "Khongolote",
    fromNeighboringBairro: false,
  },
  {
    id: "s2",
    name: "Igreja Católica",
    tier: "OFFICIAL" as const,
    capacityStatus: "NEARLY_FULL" as const,
    routeDescription: "Rota secundária",
    quarteiraoId: "q1",
    quarteiraoName: "Quarteirão 12",
    bairroName: "Khongolote",
    fromNeighboringBairro: false,
  },
];

const mockLiveResponse = {
  originBairro: { id: "bairro-khongolote", name: "Khongolote" },
  results: mockLiveShelters,
};

const mockCachedShelters = {
  originBairro: { id: "bairro-khongolote", name: "Khongolote" },
  results: [
    {
      id: "s3",
      name: "Abrigo Cache",
      tier: "COMMUNITY" as const,
      capacityStatus: "AVAILABLE" as const,
      routeDescription: "Rota cache",
      quarteiraoId: "q1",
      quarteiraoName: "Quarteirão 12",
      bairroName: "Khongolote",
      fromNeighboringBairro: false,
    },
  ],
  lastSyncedAt: "2025-01-15T10:30:00.000Z",
};

const mockGetCachedShelters = vi.fn();

vi.mock("@/lib/offline/query", () => ({
  getCachedShelters: (...args: unknown[]) => mockGetCachedShelters(...args),
}));

describe("ShelterResults", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockGetCachedShelters.mockReset();
  });

  it("shows loading state initially", () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(() => {}),
    );

    render(<ShelterResults quarteiraoId="q1" />);
    expect(screen.getByText("A carregar...")).toBeInTheDocument();
  });

  it("renders shelters from live fetch when successful", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLiveResponse),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(screen.getByText("EPC Khongolote")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Abrigos disponíveis em Khongolote"),
    ).toBeInTheDocument();
    expect(screen.getByText("Igreja Católica")).toBeInTheDocument();
    expect(screen.queryByText("Sem ligação")).not.toBeInTheDocument();
  });

  it("renders from cache when live fetch fails and valid cache exists", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedShelters.mockResolvedValue(mockCachedShelters);

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(screen.getByText("Abrigo Cache")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Abrigos disponíveis em Khongolote"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sem ligação/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/última atualização/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/15\/01\/2025/),
    ).toBeInTheDocument();
  });

  it("shows staleness banner above empty state when cached data has zero shelters", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedShelters.mockResolvedValue({
      originBairro: { id: "bairro-khongolote", name: "Khongolote" },
      results: [],
      lastSyncedAt: "2025-01-15T10:30:00.000Z",
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Nenhum abrigo encontrado nesta zona. Tente outro quarteirão.",
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Sem ligação/)).toBeInTheDocument();
    expect(screen.getByText(/última atualização/)).toBeInTheDocument();
    expect(screen.getByText(/15\/01\/2025/)).toBeInTheDocument();
  });

  it("shows error message and retry button when live fetch fails and no cache exists", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedShelters.mockResolvedValue({
      originBairro: null,
      results: [],
      lastSyncedAt: null,
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar os dados"),
      ).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", {
      name: /tentar novamente/i,
    });
    expect(retryButton).toBeInTheDocument();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLiveResponse),
    });

    const user = userEvent.setup();
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("EPC Khongolote")).toBeInTheDocument();
    });
  });

  it("falls back to cache when the live fetch hangs instead of settling", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      global.fetch = vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("The operation was aborted", "AbortError")),
            );
          }),
      );
      mockGetCachedShelters.mockResolvedValue(mockCachedShelters);

      render(<ShelterResults quarteiraoId="q1" />);
      expect(screen.getByText("A carregar...")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEFAULT_FETCH_TIMEOUT_MS);
      });

      expect(screen.getByText("Abrigo Cache")).toBeInTheDocument();
      expect(screen.getByText(/Sem ligação/)).toBeInTheDocument();
      expect(screen.getByText(/última atualização/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows empty state when live fetch returns empty array", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          originBairro: { id: "bairro-khongolote", name: "Khongolote" },
          results: [],
        }),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum abrigo encontrado nesta zona. Tente outro quarteirão."),
      ).toBeInTheDocument();
    });
  });

  it("shows nearby banner when results include neighboring bairros", async () => {
    const withOverflow = [
      {
        ...mockLiveShelters[0],
        fromNeighboringBairro: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          originBairro: { id: "bairro-khongolote", name: "Khongolote" },
          results: withOverflow,
        }),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(
        screen.getByText(/abrigos de bairros vizinhos/),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Abrigos próximos a Khongolote"),
    ).toBeInTheDocument();
  });

  it("uses the selected bairro for heading and context label when results come from a neighboring bairro", async () => {
    const overflowFromNeighbor = [
      {
        ...mockLiveShelters[0],
        fromNeighboringBairro: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          originBairro: { id: "bairro-a", name: "Bairro A" },
          results: overflowFromNeighbor,
        }),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Abrigos próximos a Bairro A"),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Abrigos próximos a Khongolote"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Abrigos próximos a Bairro A/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Khongolote/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/abrigos de bairros vizinhos/),
    ).toBeInTheDocument();
  });

  it("does not show staleness banner when serving live data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLiveResponse),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(screen.getByText("EPC Khongolote")).toBeInTheDocument();
    });

    expect(screen.queryByText("Sem ligação")).not.toBeInTheDocument();
  });
});
