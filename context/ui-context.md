# UI Context

## Design Direction

Warm, community-grounded, trustworthy — not clinical/bureaucratic, not decorative. This is a tool people reach for under stress, often outdoors, often on a slow connection. Every visual decision should serve legibility and speed before personality.

Reference: the approved shelter-search mockup (light + dark) is the canonical example every new screen should be checked against.

## Theme Switching

- **Default to system preference** (`prefers-color-scheme`), read on first load.
- **Allow manual override.** A visible toggle (settings or header) lets the user force light or dark regardless of system setting. Persist the override (cookie or `localStorage`) so it survives return visits; if no override is set, keep following the system preference live.
- Every color below has both a light and dark value — never ship a component that only defines one mode.

## Color Tokens

Defined as CSS custom properties (e.g. via `globals.css`) and surfaced to Tailwind utilities through whatever mechanism the installed Tailwind major version uses for theme configuration (`theme.extend.colors` in a `tailwind.config` file for v3, `@theme inline` directly in CSS for v4) — check `package.json` for the actual installed version before assuming which applies. Either way, raw CSS and Tailwind utilities must resolve to the same values; no hardcoded hex outside the token definitions themselves.

### Surfaces

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-page` | `#F2ECDF` | `#201A12` | App background |
| `--bg-surface` | `#FFFDF8` | `#2B2318` | Cards, elevated content |
| `--border` | `#E4DAC5` | `#4A3E2C` | Default hairline border |

### Text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--text-primary` | `#2A2118` | `#F5EEDF` | Headings, primary content |
| `--text-secondary` | `#6B5D4A` | `#B8A98C` | Supporting text, metadata, landmark descriptions |

### Brand Accent

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#A8651B` | `#DDA24C` | Primary buttons, active states, links, wordmark |
| `--on-accent` | `#FFFDF8` | `#201A12` | Text/icons placed on top of `--accent` |

### Capacity Status (functional — never repurposed for anything else)

Capacity color always means capacity. Do not reuse these hues for unrelated success/error states elsewhere in the app — that would break the at-a-glance reading this system depends on.

| Status | Light bg / text | Dark bg / text |
|---|---|---|
| `livre` (available) | `#E7F3E4` / `#256D3F` | `#1E3A2A` / `#6FCF97` |
| `quase_cheio` (nearly full) | `#FBEFDD` / `#9A5B12` | `#3D2C12` / `#E0A542` |
| `esgotado` (full) | `#F7E3E1` / `#9C2B23` | `#3B1E1B` / `#E2867E` |

### Verification Tier Badges (functional — distinct from both accent and status)

| Badge | Light bg / text | Dark bg / text |
|---|---|---|
| Tier 1 — "Oficial" | `#E1EEF4` / `#1F5C7A` | `#16344A` / `#7FB8DA` |
| Tier 2 — "Comunitário" | `#EFE7D5` / `#8A7A5E` | `#3A331F` / `#C9B989` |

## Typography

- **Display font: Fraunces** (variable serif, warm and slightly characterful without tipping into decorative) for screen titles, section headers, and the app wordmark only. **Body text stays system font stack** — the two together keep most of the app's actual text (body copy, descriptions, labels) at zero font-loading cost, while spending a small, deliberate budget on the handful of short headline strings per screen where personality actually registers.
- **Load via `next/font/google` (Fraunces), never a `<link>` to Google's CDN directly.** Next.js's built-in font optimization downloads and self-hosts the font at build time, so it ships from the same origin as the rest of the app — cacheable by the service worker as part of the app shell, and with no separate runtime request to an external font host that may be unreliable on a slow or congested connection. This matters more here than in most apps: a request to `fonts.googleapis.com` failing or stalling on a bad connection is exactly the failure mode this product needs to avoid.
- **Subset to `latin` + Portuguese diacritics** (ã, õ, ç, á, é, í, ó, ú, â, ê) — don't ship the full glyph set. Load only the weights actually used (500 for body headings, 600 for the wordmark/hero moments) — not the full variable-font weight range.
- **`font-display: swap`** — system font renders immediately, Fraunces swaps in once loaded. Never block first paint on the display font.
- **System font stack** (body text, UI labels, buttons):
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  ```
- **Weights:** body/UI stays at 400 (regular) and 500 (medium) only, as before. Fraunces adds 500 for headings and 600 reserved for the wordmark and rare hero moments — don't spread 600 across ordinary screen titles, or the "calm, legible" quality of the two-weight system erodes.
- **Type scale:**
  | Role | Size | Font | Weight |
  |---|---|---|---|
  | Screen title | 15px | Fraunces | 500 |
  | Card title | 14px | System | 500 |
  | Body / description | 12–13px | System | 400 |
  | Badge / pill label | 11px | System | 500 |
  | Eyebrow / context label | 11px | System | 400 |
  | Wordmark / hero moment | 20px+ | Fraunces | 600 |

## Spacing & Shape

- **Card radius:** 12px
- **Button radius:** 10px
- **Pill/badge radius:** full (20px+, or `border-radius: 9999px`)
- **Card padding:** 12px
- **Gap between list cards:** 10px
- **Screen horizontal padding:** 12–16px

## Iconography

Tabler Icons, **outline style only** (matches the mockup: `ti-arrow-left`, `ti-map-pin`, `ti-share-2`, `ti-bell`, `ti-check`, `ti-users`). Consistent outline weight throughout — never mix outline and filled icon styles in the same view. Icons are 11–18px depending on context (badge-inline vs. standalone action icon), always inheriting color from their surrounding text/button, never hardcoded independently.

## Component Conventions

- **Shelter card:** `--bg-surface` background, 1px `--border`, 12px radius, 12px padding. Title + tier badge on one row, landmark description below in `--text-secondary`, status pill + share icon on the bottom row. This structure is fixed — don't reorder per-screen; consistency here is what lets someone scan a list fast under stress.
- **Status pill:** always paired text label ("Livre" / "Quase cheio" / "Esgotado"), never color alone — colorblind users and low-quality screens in direct sun both need the text.
- **Tier badge:** icon + label, never icon alone (`ti-check` + "Oficial", `ti-users` + "Comunitário").
- **Primary action button** (e.g. "Subscrever alertas"): full-width in mobile contexts, `--accent` background, `--on-accent` text, 10px radius, icon + verb-first label, sentence case, no terminal punctuation (see Copy Conventions below).
- **Back navigation:** icon-only (`ti-arrow-left`) paired with a two-line header (small `--text-secondary` context label above, `--text-primary` title below) — as in the mockup, not a separate breadcrumb component.
- **Select / dropdown (geographic picker and any future selection field):** use shadcn/ui's `Select` (Radix-based), not a native `<select>`. Unit 1.1 originally used native selects for zero-JS simplicity, but the OS-rendered dropdown list broke visual cohesion badly enough on real devices to be worth the small JS cost of a themed component instead — this supersedes that earlier choice. Style to match the rest of the design system, not Radix's defaults: closed-state field uses the same `--bg-surface`/`--border`/12px-radius treatment already validated in the picker; open dropdown panel uses `--bg-surface` background and `--border` outline (not a plain white/system panel); selected/highlighted option uses a subtle `--accent`-tinted background, never `--accent` at full opacity as a fill (reserve full-opacity `--accent` for primary buttons only, per the Brand Accent tokens above); option text in `--text-primary`, disabled/placeholder text in `--text-secondary`. Preserve full keyboard and screen-reader accessibility — this is a real requirement Radix supports natively, not something being traded away for the visual upgrade.

- **App header (persistent, lives in the root layout, every screen gets it):** a fixed/sticky top bar, `--bg-surface` background with a 1px `--border` bottom hairline separating it from page content. Left: the "Kupulumuka" wordmark in Fraunces 600, sized smaller than a hero moment (~16–18px, not the large placeholder-era size) — acts as the app's persistent brand anchor and links to `/explorar` (the app's actual entry point). Right: the theme toggle, icon-only — a sun/moon icon (e.g. Tabler `ti-sun`/`ti-moon`, swapping based on current theme), no visible text label (icon convention is well understood for this control), with an accessible label (`aria-label="Alternar tema"`) for screen readers, and a minimum 44×44px tap target even though the icon itself is smaller. Header height ~52–56px. Page content (headings, forms, cards) sits below this bar with its own normal screen padding — the header is not part of a page's content flow, and no page should need to build its own branding/toggle treatment individually.

## Layout

- **Screen horizontal padding is a hard requirement, not a suggestion:** 12–16px on every screen, applied consistently — see Spacing & Shape above. Content (headings, cards, form fields) must never sit flush against the viewport edge. If this is missing from a rendered screen, treat it as a bug against this spec, not a style nicety to defer.

## Copy Conventions

- **Portuguese, sentence case, no exclamation points.** This is an emergency tool, not a consumer app trying to sound excited.
- **Verb-first buttons:** "Subscrever alertas", "Reportar abrigo", "Actualizar capacidade" — not "Submeter" or "OK".
- **Status labels are nouns/short states, not sentences:** "Livre", "Quase cheio", "Esgotado" — never "Este abrigo está cheio."
- **Empty states are an invitation, not an apology:** e.g. no shelters found nearby should say what to do next (report one, expand search radius), not just "Nenhum resultado."
- **Never blame the user or the network for failures.** "Sem ligação — a mostrar dados guardados" (offline, showing cached data), not "Erro: falha de rede."