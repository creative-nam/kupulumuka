export const THEME_COOKIE_NAME = "theme";

export const themeTokens = {
  light: {
    bgPage: "#F2ECDF",
  },
  dark: {
    bgPage: "#201A12",
  },
} as const;

export type ThemeMode = keyof typeof themeTokens;
