import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { GeographicPicker } from "./geographic-picker";
import { DEFAULT_FETCH_TIMEOUT_MS } from "@/lib/offline/fetch-with-timeout";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/explorar",
}));

const mockGetCachedGeoSnapshot = vi.fn();
const mockGetLastSyncedAt = vi.fn();

vi.mock("@/lib/offline/query", () => ({
  getCachedGeoSnapshot: (...args: unknown[]) =>
    mockGetCachedGeoSnapshot(...args),
  getLastSyncedAt: (...args: unknown[]) => mockGetLastSyncedAt(...args),
}));

const mockSnapshot = {
  provincias: [
    {
      id: "p1",
      name: "Província A",
      distritos: [
        {
          id: "d1",
          name: "Distrito A1",
          bairros: [
            {
              id: "b1",
              name: "Bairro A1-1",
              quarteiroes: [
                { id: "q1", name: "Quarteirão A1-1-1" },
                { id: "q2", name: "Quarteirão A1-1-2" },
              ],
            },
            {
              id: "b2",
              name: "Bairro A1-2",
              quarteiroes: [{ id: "q3", name: "Quarteirão A1-2-1" }],
            },
          ],
        },
        {
          id: "d2",
          name: "Distrito A2",
          bairros: [
            {
              id: "b3",
              name: "Bairro A2-1",
              quarteiroes: [{ id: "q4", name: "Quarteirão A2-1-1" }],
            },
          ],
        },
      ],
    },
    {
      id: "p2",
      name: "Província B",
      distritos: [
        {
          id: "d3",
          name: "Distrito B1",
          bairros: [
            {
              id: "b4",
              name: "Bairro B1-1",
              quarteiroes: [{ id: "q5", name: "Quarteirão B1-1-1" }],
            },
          ],
        },
      ],
    },
  ],
};

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  optionName: string,
) {
  const trigger = screen.getByLabelText(label);
  await user.click(trigger);
  const option = await screen.findByRole("option", { name: optionName });
  await user.click(option);
}

describe("GeographicPicker", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockGetCachedGeoSnapshot.mockReset();
    mockGetLastSyncedAt.mockReset();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSnapshot),
    });
  });

  it("shows a loading indicator while fetching the snapshot", () => {
    render(<GeographicPicker />);
    expect(screen.getByText("A carregar...")).toBeInTheDocument();
  });

  it("renders all four selects after loading", async () => {
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Distrito")).toBeInTheDocument();
    expect(screen.getByLabelText("Bairro")).toBeInTheDocument();
    expect(screen.getByLabelText("Quarteirão")).toBeInTheDocument();
  });

  it("disables distrito, bairro, and quarteirão until a província is selected", async () => {
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Distrito")).toBeDisabled();
    expect(screen.getByLabelText("Bairro")).toBeDisabled();
    expect(screen.getByLabelText("Quarteirão")).toBeDisabled();
  });

  it("populates distrito options when a província is selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await selectOption(user, "Província", "Província A");

    // Trigger must show the selected name, not the raw id value
    expect(screen.getByLabelText("Província")).toHaveTextContent("Província A");

    expect(screen.getByLabelText("Distrito")).not.toBeDisabled();

    await user.click(screen.getByLabelText("Distrito"));
    const options = await screen.findAllByRole("option");
    const names = options.map((o) => o.textContent);
    expect(names).toContain("Distrito A1");
    expect(names).toContain("Distrito A2");
  });

  it("populates bairro options when a distrito is selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await selectOption(user, "Província", "Província A");
    await selectOption(user, "Distrito", "Distrito A1");

    await user.click(screen.getByLabelText("Bairro"));
    const options = await screen.findAllByRole("option");
    const names = options.map((o) => o.textContent);
    expect(names).toContain("Bairro A1-1");
    expect(names).toContain("Bairro A1-2");
    expect(names).not.toContain("Bairro A2-1");
  });

  it("populates quarteirão options when a bairro is selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await selectOption(user, "Província", "Província A");
    await selectOption(user, "Distrito", "Distrito A1");
    await selectOption(user, "Bairro", "Bairro A1-1");

    await user.click(screen.getByLabelText("Quarteirão"));
    const options = await screen.findAllByRole("option");
    const names = options.map((o) => o.textContent);
    expect(names).toContain("Quarteirão A1-1-1");
    expect(names).toContain("Quarteirão A1-1-2");
    expect(names).not.toContain("Quarteirão A1-2-1");
  });

  it("resets lower levels when a parent selection changes", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await selectOption(user, "Província", "Província A");
    expect(screen.getByLabelText("Província")).toHaveTextContent("Província A");

    await selectOption(user, "Distrito", "Distrito A1");
    expect(screen.getByLabelText("Distrito")).toHaveTextContent("Distrito A1");

    await selectOption(user, "Bairro", "Bairro A1-1");
    expect(screen.getByLabelText("Bairro")).toHaveTextContent("Bairro A1-1");

    await waitFor(() => {
      expect(screen.getByLabelText("Quarteirão")).not.toBeDisabled();
    });

    // Changing distrito resets bairro selection and disables quarteirão,
    // but bairro select stays enabled (distrito is still selected)
    await selectOption(user, "Distrito", "Distrito A2");

    expect(screen.getByLabelText("Bairro")).not.toBeDisabled();
    expect(screen.getByLabelText("Quarteirão")).toBeDisabled();

    // Changing província clears distrito selection, disabling bairro + quarteirão
    await selectOption(user, "Província", "Província B");

    expect(screen.getByLabelText("Distrito")).not.toBeDisabled();

    await user.click(screen.getByLabelText("Distrito"));
    const distritoOptions = await screen.findAllByRole("option");
    const distritoNames = distritoOptions.map((o) => o.textContent);
    expect(distritoNames).toContain("Distrito B1");

    expect(screen.getByLabelText("Bairro")).toBeDisabled();
    expect(screen.getByLabelText("Quarteirão")).toBeDisabled();
  });

  it("shows an error message when the snapshot fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedGeoSnapshot.mockResolvedValue(null);

    render(<GeographicPicker />);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar os dados"),
      ).toBeInTheDocument();
    });
  });

  it("shows a retry button when the fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedGeoSnapshot.mockResolvedValue(null);

    render(<GeographicPicker />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /tentar novamente/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows the error UI when fetch resolves with a non-2xx response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
    mockGetCachedGeoSnapshot.mockResolvedValue(null);

    render(<GeographicPicker />);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar os dados"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it("re-fetches the snapshot when retry is clicked and recovers", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSnapshot),
      });
    global.fetch = fetchMock;
    mockGetCachedGeoSnapshot.mockResolvedValue(null);

    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /tentar novamente/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });
  });

  it("disables the Ver abrigos button with 0–3 levels selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /ver abrigos/i });
    expect(button).toBeDisabled();

    await selectOption(user, "Província", "Província A");
    expect(button).toBeDisabled();

    await selectOption(user, "Distrito", "Distrito A1");
    expect(button).toBeDisabled();

    await selectOption(user, "Bairro", "Bairro A1-1");
    expect(button).toBeDisabled();
  });

  it("enables the Ver abrigos button only when all four levels are selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await selectOption(user, "Província", "Província A");
    expect(screen.getByLabelText("Província")).toHaveTextContent("Província A");

    await selectOption(user, "Distrito", "Distrito A1");
    expect(screen.getByLabelText("Distrito")).toHaveTextContent("Distrito A1");

    await selectOption(user, "Bairro", "Bairro A1-1");
    expect(screen.getByLabelText("Bairro")).toHaveTextContent("Bairro A1-1");

    await selectOption(user, "Quarteirão", "Quarteirão A1-1-1");
    expect(screen.getByLabelText("Quarteirão")).toHaveTextContent(
      "Quarteirão A1-1-1",
    );

    expect(
      screen.getByRole("button", { name: /ver abrigos/i }),
    ).not.toBeDisabled();
  });

  it("navigates to /abrigos with the selected quarteiraoId when Ver abrigos is clicked", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await selectOption(user, "Província", "Província A");
    await selectOption(user, "Distrito", "Distrito A1");
    await selectOption(user, "Bairro", "Bairro A1-1");
    await selectOption(user, "Quarteirão", "Quarteirão A1-1-1");

    await user.click(screen.getByRole("button", { name: /ver abrigos/i }));

    expect(mockPush).toHaveBeenCalledWith("/abrigos?quarteiraoId=q1");
  });

  it("falls back to Dexie cache when fetch fails and valid cache exists", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedGeoSnapshot.mockResolvedValue(mockSnapshot);
    mockGetLastSyncedAt.mockResolvedValue("2025-01-15T10:30:00.000Z");

    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    expect(screen.getByText(/Sem ligação/)).toBeInTheDocument();
    expect(screen.getByText(/última atualização/)).toBeInTheDocument();
    expect(
      screen.getByText(/15\/01\/2025/),
    ).toBeInTheDocument();

    // Should still work normally with cached data
    const user = userEvent.setup();
    await selectOption(user, "Província", "Província A");

    expect(screen.getByLabelText("Distrito")).not.toBeDisabled();
  });

  it("falls back to cached snapshot when the snapshot fetch hangs instead of settling", async () => {
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
      mockGetCachedGeoSnapshot.mockResolvedValue(mockSnapshot);
      mockGetLastSyncedAt.mockResolvedValue("2025-01-15T10:30:00.000Z");

      render(<GeographicPicker />);
      expect(screen.getByText("A carregar...")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEFAULT_FETCH_TIMEOUT_MS);
      });

      expect(screen.getByLabelText("Província")).toBeInTheDocument();
      expect(screen.getByText(/Sem ligação/)).toBeInTheDocument();
      expect(screen.getByText(/última atualização/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows error state when both fetch and cache fail", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    mockGetCachedGeoSnapshot.mockResolvedValue(null);

    render(<GeographicPicker />);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar os dados"),
      ).toBeInTheDocument();
    });
  });

  it("supports keyboard navigation to select an option", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    const provinciaTrigger = screen.getByLabelText("Província");
    provinciaTrigger.focus();

    // Open dropdown with Enter and select the already-highlighted first option
    await user.keyboard("{Enter}");
    await user.keyboard("{Enter}");

    // After selecting a província, distrito should be enabled
    await waitFor(() => {
      expect(screen.getByLabelText("Distrito")).not.toBeDisabled();
    });

    // The trigger must show the option name, not the raw id value
    expect(screen.getByLabelText("Província")).toHaveTextContent("Província A");
  });
});
