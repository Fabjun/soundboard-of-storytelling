/**
 * @fileoverview Test quarantine markers — one definition for the guard and the exception register
 *
 * testGuards checks that every quarantine marker (skip / fixme / todo / fails) in a test file has
 * a BACKLOG reference; sync-exceptions lists the markers in docs/development/exceptions.md. Both
 * read the markers through this module, so they cannot disagree about what a marker is: when the
 * file overviews became `/** … *\/` blocks (ADR-0064), a marker named in a comment was counted
 * by both until each had its own fix (2026-10-03).
 */

/** A quarantine marker: `test` / `it` / `describe` with `.skip`, `.fixme`, `.todo` or `.fails`. */
export const QUARANTINE_MARKER =
  /\b(?:test|it|describe)(?:\.describe)?\.(skip|fixme|todo|fails)\s*\(/;

/** A reference to a backlog entry: `BACKLOG "<part of a heading>"`; group 1 is the text. */
export const BACKLOG_REF = /BACKLOG "([^"]+)"/;

/** How many lines above a marker its BACKLOG reference may stand. */
export const BACKLOG_LOOKBACK = 8;

/**
 * Tells whether a line is a comment line — a `//` line or a line of a block comment. A marker
 * named there is mentioned, not used.
 */
export function isCommentLine(line: string): boolean {
  return /^(\/\/|\/\*|\*)/.test(line.trim());
}

/** One marker in a file: its 1-based line, its kind, and the BACKLOG reference above it. */
export interface QuarantineMarker {
  line: number;
  kind: string;
  ref: string | null;
}

/** Returns the quarantine markers of a test file's lines, skipping comment lines. */
export function findQuarantineMarkers(lines: readonly string[]): QuarantineMarker[] {
  const found: QuarantineMarker[] = [];
  lines.forEach((line, i) => {
    if (isCommentLine(line)) return;
    const m = QUARANTINE_MARKER.exec(line);
    if (!m) return;
    const context = lines.slice(Math.max(0, i - BACKLOG_LOOKBACK), i + 1).join('\n');
    found.push({ line: i + 1, kind: m[1], ref: BACKLOG_REF.exec(context)?.[1] ?? null });
  });
  return found;
}
