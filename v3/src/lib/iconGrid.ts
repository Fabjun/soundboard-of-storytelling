/**
 * @fileoverview iconGrid — rows, columns and arrow keys of the icon picker's grids (ADR-0070)
 *
 * The picker draws only the visible rows of a grid (virtualized, `@tanstack/virtual-core`), so the
 * grid's shape is computed, not read from the drawn buttons: the column count comes from the CSS
 * layout (the computed `grid-template-columns` of an auto-fill grid lists one size per column),
 * the rows from the number of icons. The arrow keys follow the W3C APG grid pattern.
 */

/** The number of columns of a CSS grid, from its computed `grid-template-columns` ("44px 44px …"). */
export function trackCount(gridTemplateColumns: string): number {
  return Math.max(
    1,
    gridTemplateColumns
      .trim()
      .split(/\s+/)
      .filter((t) => t !== 'none').length,
  );
}

/** The number of rows `count` icons take in `cols` columns. */
export function rowCount(count: number, cols: number): number {
  return Math.ceil(count / Math.max(1, cols));
}

/** The icons of row `row`: the slice of `keys` it shows. */
export function rowKeys<T>(keys: readonly T[], row: number, cols: number): T[] {
  return keys.slice(row * cols, (row + 1) * cols);
}

/**
 * The index the focus moves to from `index` on `key`, or null for any other key — the APG layout
 * grid (https://www.w3.org/WAI/ARIA/apg/patterns/grid/): left and right move by one icon (on to
 * the next or previous row at a row's end), up and down by one row, Home and End to the start and
 * end of the row. Where no icon is, the focus stays.
 */
export function moveIndex(index: number, key: string, cols: number, count: number): number | null {
  const rowStart = index - (index % cols);
  const target: Record<string, number> = {
    ArrowRight: index + 1,
    ArrowLeft: index - 1,
    ArrowDown: index + cols,
    ArrowUp: index - cols,
    Home: rowStart,
    End: Math.min(count - 1, rowStart + cols - 1),
  };
  if (!(key in target)) return null;
  const next = target[key];
  return next < 0 || next >= count ? index : next;
}
