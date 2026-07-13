import type { ThemeMode } from "@/lib/theme/tokens";
import { THEME_COOKIE_NAME } from "@/lib/theme/tokens";

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function getDocumentTheme(): ThemeMode {
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "dark" ? "dark" : "light";
}

export function toggleDocumentTheme(): ThemeMode {
  const nextTheme: ThemeMode =
    getDocumentTheme() === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  return nextTheme;
}
