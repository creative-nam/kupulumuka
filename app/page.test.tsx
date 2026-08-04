/// <reference types="vitest/globals" />
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { redirect } from "next/navigation";

import Home from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("home route", () => {
  it("redirects to /explorar", () => {
    render(<Home />);
    expect(redirect).toHaveBeenCalledWith("/explorar");
  });
});
