import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AbrigosPage from "./page";

vi.mock("@/components/shelter-results", () => ({
  ShelterResults: vi.fn(({ quarteiraoId }: { quarteiraoId: string }) => (
    <div data-testid="shelter-results" data-quarteirao-id={quarteiraoId}>
      ShelterResults
    </div>
  )),
}));

describe("AbrigosPage", () => {
  it("shows invitation to select a zone when no quarteiraoId is provided", async () => {
    const jsx = await AbrigosPage({
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(
      screen.getByText("Selecione uma zona para ver os abrigos disponíveis."),
    ).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: /explorar abrigos/i });
    expect(backLink).toHaveAttribute("href", "/explorar");

    expect(screen.queryByTestId("shelter-results")).not.toBeInTheDocument();
  });

  it("delegates to ShelterResults when quarteiraoId is provided", async () => {
    const jsx = await AbrigosPage({
      searchParams: Promise.resolve({ quarteiraoId: "q1" }),
    });
    render(jsx);

    expect(screen.getByTestId("shelter-results")).toBeInTheDocument();
    expect(screen.getByTestId("shelter-results")).toHaveAttribute(
      "data-quarteirao-id",
      "q1",
    );

    expect(
      screen.queryByText("Selecione uma zona para ver os abrigos disponíveis."),
    ).not.toBeInTheDocument();
  });
});
