import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ShareButton } from "./share-button";

describe("ShareButton", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockResolvedValue(undefined),
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the share button with Partilhar label", () => {
    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    expect(
      screen.getByRole("button", { name: /partilhar epc khongolote/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Partilhar")).toBeInTheDocument();
  });

  it("calls navigator.share when available", async () => {
    const user = userEvent.setup();
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share: shareMock,
      clipboard: { writeText: vi.fn() },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(shareMock).toHaveBeenCalledWith({
      title: "EPC Khongolote",
      text: expect.stringContaining("EPC Khongolote"),
    });
  });

  it("falls back to clipboard when navigator.share is not available", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share: undefined,
      clipboard: { writeText: writeTextMock },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("EPC Khongolote"),
    );
  });

  it("shows 'Link copiado' after clipboard fallback", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      share: undefined,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Link copiado")).toBeInTheDocument();
    });
  });

  it("does not fall back to clipboard when navigator.share throws AbortError", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn();
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
      clipboard: { writeText: writeTextMock },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(writeTextMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Link copiado")).not.toBeInTheDocument();
  });

  it("falls back to clipboard when navigator.share throws a non-AbortError", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(
        new DOMException("NotAllowedError", "NotAllowedError"),
      ),
      clipboard: { writeText: writeTextMock },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("EPC Khongolote"),
    );
  });

  it("shows 'Link copiado' after clipboard fallback from non-AbortError share failure", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(
        new DOMException("NotAllowedError", "NotAllowedError"),
      ),
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Link copiado")).toBeInTheDocument();
    });
  });

  it("does not show 'Link copiado' when clipboard writeText fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      share: undefined,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Clipboard denied")) },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.queryByText("Link copiado")).not.toBeInTheDocument();
  });

  it("does not show 'Link copiado' when navigator.clipboard is undefined", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      share: undefined,
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.queryByText("Link copiado")).not.toBeInTheDocument();
  });

  it("does not show 'Link copiado' after successful share", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      share: vi.fn().mockResolvedValue(undefined),
      clipboard: { writeText: vi.fn() },
    });

    render(
      <ShareButton
        shelterName="EPC Khongolote"
        routeDescription="Av. da Liberdade, perto do campo de futebol."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.queryByText("Link copiado")).not.toBeInTheDocument();
  });
});
