/**
 * @fileoverview contentWidth — how wide the screens get on a large window
 * (docs/product/features/settings.md S3, Slice 14b)
 *
 * V1's Settings → APPEARANCE → CONTENT WIDTH: COMPACT 900 px, MEDIUM 1100 px, WIDE 1400 px, or AUTO
 * — the whole window ("recommended on mobile"), the default. A class on the root element sets the
 * token `--content-max`, which `.sb-screen` takes as its largest width, centered.
 */

/** The choices, in the order Settings offers them; the first is the default. */
export const CONTENT_WIDTHS = ['auto', 'compact', 'medium', 'wide'] as const;

/** One of CONTENT_WIDTHS. */
export type ContentWidth = (typeof CONTENT_WIDTHS)[number];

/** The width the app starts with — the whole window. */
export const DEFAULT_CONTENT_WIDTH: ContentWidth = 'auto';

/** Tells whether a stored value names a content width. */
export function isContentWidth(v: unknown): v is ContentWidth {
  return CONTENT_WIDTHS.some((w) => w === v);
}

/** Puts the width's class on `root` and takes any other off; AUTO needs none. */
export function applyContentWidth(root: Element, width: ContentWidth): void {
  for (const w of CONTENT_WIDTHS)
    root.classList.toggle(`sb-width-${w}`, w === width && w !== DEFAULT_CONTENT_WIDTH);
}
