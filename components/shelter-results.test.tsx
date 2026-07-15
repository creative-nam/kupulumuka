import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ShelterResults } from "./shelter-results";

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

const mockCachedShelters = {
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
      json: () => Promise.resolve(mockLiveShelters),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(screen.getByText("EPC Khongolote")).toBeInTheDocument();
    });

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
      screen.getByText(/Sem ligação/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/última atualização/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/15\/01\/2025/),
    ).toBeInTheDocument();
  });

  it("shows error message and retry button when live fetch fails and no cache exists", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedShelters.mockResolvedValue({
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
      json: () => Promise.resolve(mockLiveShelters),
    });

    const user = userEvent.setup();
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("EPC Khongolote")).toBeInTheDocument();
    });
  });

  it("shows empty state when live fetch returns empty array", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
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
      json: () => Promise.resolve(withOverflow),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(
        screen.getByText(/abrigos de bairros vizinhos/),
      ).toBeInTheDocument();
    });
  });

  it("does not show staleness banner when serving live data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLiveShelters),
    });

    render(<ShelterResults quarteiraoId="q1" />);

    await waitFor(() => {
      expect(screen.getByText("EPC Khongolote")).toBeInTheDocument();
    });

    expect(screen.queryByText("Sem ligação")).not.toBeInTheDocument();
  });
});
