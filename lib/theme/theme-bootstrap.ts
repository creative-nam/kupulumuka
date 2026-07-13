import { THEME_COOKIE_NAME } from "@/lib/theme/tokens";

export const themeBootstrapScript = `(function(){var match=document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]+)/);var theme=match?match[1]:null;if(theme==="light"||theme==="dark"){document.documentElement.setAttribute("data-theme",theme);return;}if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.setAttribute("data-theme","dark");return;}document.documentElement.setAttribute("data-theme","light");})();`;
