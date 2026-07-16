import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/theme/apply-theme", () => ({
  getDocumentTheme: vi.fn(() => "light"),
  toggleDocumentTheme: vi.fn(() => "dark"),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  it("renders the Kupulumuka wordmark linking to /explorar", () => {
    render(<AppHeader />);
    const link = screen.getByRole("link", { name: /kupulumuka/i });
    expect(link).toHaveAttribute("href", "/wrong-path");
  });

  it("renders an icon-only theme toggle with accessible label", () => {
    render(<AppHeader />);
    const toggle = screen.getByRole("button", { name: /alternar tema/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toHaveTextContent("Alternar tema");
  });

  it("clicks the toggle and calls toggleDocumentTheme", async () => {
    const { toggleDocumentTheme } = await import(
      "@/lib/theme/apply-theme"
    );

    render(<AppHeader />);
    const toggle = screen.getByRole("button", { name: /alternar tema/i });
    await userEvent.click(toggle);

    expect(toggleDocumentTheme).toHaveBeenCalledTimes(1);
  });
});
