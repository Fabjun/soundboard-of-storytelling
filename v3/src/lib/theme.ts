/**
 * @fileoverview theme — the app's color themes (docs/product/features/settings.md S5, Slice 14b)
 *
 * One theme for the whole app, set in Settings → APPEARANCE, as V1 did (its theme was a class on
 * `body`, set in Settings). Hearth is the base palette on `:root`; every other theme is a
 * `.sb-theme-<id>` block in `src/styles/tokens.css` that re-declares the color tokens, put on the
 * root element so overlays and the whole page follow it.
 */

/** The themes, in the order Settings offers them; the first is the default. */
export const THEMES = ['hearth', 'verdant', 'neon', 'crimson'] as const;

/** One of the app's themes. */
export type ThemeId = (typeof THEMES)[number];

/** The theme the app starts with — the base palette. */
export const DEFAULT_THEME: ThemeId = 'hearth';

/** Tells whether a stored value names a theme. */
export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t === v);
}

/** Puts the theme's class on `root` and takes any other theme class off; Hearth needs none. */
export function applyTheme(root: Element, theme: ThemeId): void {
  for (const t of THEMES)
    root.classList.toggle(`sb-theme-${t}`, t === theme && t !== DEFAULT_THEME);
}
