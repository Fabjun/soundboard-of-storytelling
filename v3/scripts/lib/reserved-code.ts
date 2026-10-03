/**
 * @fileoverview Reserved code — one definition of the `@reserved` tag for the guard and the register
 *
 * Code kept for a later implementation carries a `@reserved` block tag in its doc comment
 * (docs/architecture/0064-code-comments.md#4-code-kept-for-a-later-implementation-is-marked-never-deleted).
 * codeGuards checks its form and slice; sync-exceptions lists it. Both find the
 * tags through this module, so a mention of the tag in prose or a regular expression is not
 * taken for one (it was, on 2026-10-03, while the guard had its own pattern).
 */

/** A `@reserved` tag: at the start of a doc comment line; group 1 is its text. */
export const RESERVED_TAG = /^\s*\*\s*@reserved\s+(.+?)\s*(?:\*\/)?$/;

/** One reservation: its 1-based line, its text, and the exported symbol it belongs to. */
export interface Reservation {
  line: number;
  text: string;
  symbol: string | null;
}

/** Returns the reservations in a file's lines, each with the next exported declaration. */
export function findReservations(lines: readonly string[]): Reservation[] {
  const found: Reservation[] = [];
  lines.forEach((line, i) => {
    const m = RESERVED_TAG.exec(line);
    if (!m) return;
    const symbol =
      lines
        .slice(i + 1, i + 12)
        .map((l) => /^export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/.exec(l)?.[1])
        .find((s) => s !== undefined) ?? null;
    found.push({ line: i + 1, text: m[1], symbol });
  });
  return found;
}
