/**
 * @fileoverview padFit — the side of a board pad so that the whole grid fits its panel
 *
 * Owner decision 2026-10-05: pads are squares of a standard size, but they shrink to be seen
 * whole on every display. The width always wins (no pad is cut off at the right edge); the
 * height wins only down to the touch target, below that the grid scrolls (WCAG 2.2 SC 1.4.10).
 */

/** The smallest side the height alone shrinks a pad to — the iOS touch target, in px. */
export const MIN_PAD_FIT = 44;

/** The size of the grid's content box and its layout. */
export interface PadFitInput {
  /** Width of the grid's content box (padding taken off), in px. */
  width: number;
  /** Height of the grid's content box (padding taken off), in px. */
  height: number;
  /** Columns of the grid. */
  cols: number;
  /** Rows of the grid; 0 when there are no cells yet. */
  rows: number;
  /** Gap between cells, in px. */
  gap: number;
}

/**
 * Returns the largest pad side, in px, at which all columns fit the width and — as long as that
 * stays at least `MIN_PAD_FIT` — all rows fit the height. Returns null while the size is not
 * known (a panel that is hidden or has no width yet), so the caller keeps the standard size.
 */
export function padFit({ width, height, cols, rows, gap }: PadFitInput): number | null {
  if (![width, height, cols, rows, gap].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0 || cols < 1 || gap < 0) return null;
  const byWidth = (width - gap * (cols - 1)) / cols;
  if (rows < 1) return Math.max(0, byWidth);
  const byHeight = (height - gap * (rows - 1)) / rows;
  return Math.max(0, Math.min(byWidth, Math.max(MIN_PAD_FIT, byHeight)));
}
