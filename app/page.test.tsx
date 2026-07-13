import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("home route", () => {
  it("renders the Kupulumuka wordmark", () => {
    render(<Home />);
    expect(screen.getByText("Kupulumuka")).toBeInTheDocument();
  });
});
