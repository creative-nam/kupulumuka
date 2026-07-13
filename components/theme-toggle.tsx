"use client";

import { toggleDocumentTheme } from "@/lib/theme/apply-theme";

export function ThemeToggle() {
  return (
    <button type="button" aria-label="Alternar tema" onClick={toggleDocumentTheme}>
      Alternar tema
    </button>
  );
}
