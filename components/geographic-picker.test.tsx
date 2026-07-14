import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { GeographicPicker } from "./geographic-picker";

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

describe("GeographicPicker", () => {
  beforeEach(() => {
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

    await user.selectOptions(screen.getByLabelText("Província"), "p1");

    const distritoSelect = screen.getByLabelText<HTMLSelectElement>("Distrito");
    expect(distritoSelect).not.toBeDisabled();
    expect(
      distritoSelect.options[distritoSelect.selectedIndex]?.text,
    ).toBe("Selecionar distrito");

    const optionValues = Array.from(distritoSelect.options).map((o) => o.value);
    expect(optionValues).toContain("d1");
    expect(optionValues).toContain("d2");
  });

  it("populates bairro options when a distrito is selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Província"), "p1");
    await user.selectOptions(screen.getByLabelText("Distrito"), "d1");

    const bairroSelect = screen.getByLabelText<HTMLSelectElement>("Bairro");
    expect(bairroSelect).not.toBeDisabled();

    const optionValues = Array.from(bairroSelect.options).map((o) => o.value);
    expect(optionValues).toContain("b1");
    expect(optionValues).toContain("b2");
    expect(optionValues).not.toContain("b3");
  });

  it("populates quarteirão options when a bairro is selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Província"), "p1");
    await user.selectOptions(screen.getByLabelText("Distrito"), "d1");
    await user.selectOptions(screen.getByLabelText("Bairro"), "b1");

    const quarteiraoSelect =
      screen.getByLabelText<HTMLSelectElement>("Quarteirão");
    expect(quarteiraoSelect).not.toBeDisabled();

    const optionValues = Array.from(quarteiraoSelect.options).map(
      (o) => o.value,
    );
    expect(optionValues).toContain("q1");
    expect(optionValues).toContain("q2");
    expect(optionValues).not.toContain("q3");
  });

  it("resets lower levels when a parent selection changes", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Província"), "p1");
    await user.selectOptions(screen.getByLabelText("Distrito"), "d1");
    await user.selectOptions(screen.getByLabelText("Bairro"), "b1");

    expect(screen.getByLabelText("Quarteirão")).not.toBeDisabled();

    // Changing distrito resets bairro selection and disables quarteirão,
    // but bairro select stays enabled (distrito is still selected)
    await user.selectOptions(screen.getByLabelText("Distrito"), "d2");

    const bairroSelect = screen.getByLabelText<HTMLSelectElement>("Bairro");
    expect(bairroSelect).not.toBeDisabled();
    expect(bairroSelect.value).toBe("");
    expect(screen.getByLabelText("Quarteirão")).toBeDisabled();

    // Changing província clears distrito selection, disabling bairro + quarteirão
    await user.selectOptions(screen.getByLabelText("Província"), "p2");

    const distritoSelect = screen.getByLabelText<HTMLSelectElement>("Distrito");
    expect(distritoSelect).not.toBeDisabled();
    expect(distritoSelect.value).toBe("");
    const distritoOptions = Array.from(distritoSelect.options).map(
      (o) => o.value,
    );
    expect(distritoOptions).toContain("d3");

    expect(screen.getByLabelText("Bairro")).toBeDisabled();
    expect(screen.getByLabelText("Quarteirão")).toBeDisabled();
  });

  it("shows an error message when the snapshot fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar os dados"),
      ).toBeInTheDocument();
    });
  });

  it("shows a retry button when the fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
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

    await user.selectOptions(screen.getByLabelText("Província"), "p1");
    expect(button).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Distrito"), "d1");
    expect(button).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Bairro"), "b1");
    expect(button).toBeDisabled();
  });

  it("enables the Ver abrigos button only when all four levels are selected", async () => {
    const user = userEvent.setup();
    render(<GeographicPicker />);

    await waitFor(() => {
      expect(screen.getByLabelText("Província")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Província"), "p1");
    await user.selectOptions(screen.getByLabelText("Distrito"), "d1");
    await user.selectOptions(screen.getByLabelText("Bairro"), "b1");
    await user.selectOptions(screen.getByLabelText("Quarteirão"), "q1");

    expect(
      screen.getByRole("button", { name: /ver abrigos/i }),
    ).not.toBeDisabled();
  });
});
