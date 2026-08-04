"use client";

import * as React from "react";

async function shareOrClipboard(
  shelterName: string,
  routeDescription: string,
): Promise<"shared" | "copied" | "failed"> {
  const shareText = `Abrigo: ${shelterName}\n${routeDescription}\n\n— Kupulumuka`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: shelterName,
        text: shareText,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "failed";
      }
    }
  }

  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    return "failed";
  }

  try {
    await navigator.clipboard.writeText(shareText);
    return "copied";
  } catch {
    return "failed";
  }
}

export function ShareButton({
  shelterName,
  routeDescription,
}: {
  shelterName: string;
  routeDescription: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = React.useCallback(async () => {
    const outcome = await shareOrClipboard(shelterName, routeDescription);

    if (outcome === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shelterName, routeDescription]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1 text-[11px] text-secondary-text transition-colors hover:text-primary-text"
      aria-label={copied ? "Link copiado" : `Partilhar ${shelterName}`}
    >
      {copied ? (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Link copiado</span>
        </>
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Partilhar</span>
        </>
      )}
    </button>
  );
}
