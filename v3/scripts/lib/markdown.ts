/**
 * markdown.ts — shared Markdown helpers for the doc generators and `format:md`.
 *
 * Prettier can change what a Markdown file says when the source is ambiguous: a bare `*` in
 * prose becomes `_`, a `|` inside a table cell splits the row, an indented continuation line
 * turns into a code block (structure audit 2026-09-30, A3). `formatMarkdown` therefore formats
 * and then compares the GitHub-flavoured syntax tree before and after — content and structure
 * must be identical, only layout may change. On a difference it throws with the line number,
 * so the source gets fixed instead of silently damaged.
 */

import type { Nodes } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { format, resolveConfig } from 'prettier';

/** A GFM table cell: an unescaped `|` would split the row (GitHub drops extra cells). */
export function escapeCell(text: string): string {
  return text.replace(/(?<!\\)\|/g, '\\|').trim();
}

/** One GFM table row with every cell escaped. */
export function tableRow(cells: readonly string[]): string {
  return `| ${cells.map(escapeCell).join(' | ')} |`;
}

interface Token {
  key: string;
  line: number | undefined;
}

/** Node types plus literal values, whitespace-collapsed: equal for layout-only changes. */
function canonical(md: string): Token[] {
  const out: Token[] = [];
  const walk = (node: Nodes): void => {
    const raw = 'value' in node ? String(node.value) : '';
    const value = node.type === 'html' ? raw.replace(/\s+/g, '') : raw.replace(/\s+/g, ' ').trim();
    const ordered = 'ordered' in node && node.ordered !== undefined ? `:${node.ordered}` : '';
    const depth = 'depth' in node ? `:${node.depth}` : '';
    const url = 'url' in node ? `@${node.url}` : '';
    out.push({
      key: `${node.type}${ordered}${depth}${value ? `=${value}` : ''}${url}`,
      line: node.position?.start.line,
    });
    if ('children' in node) for (const child of node.children) walk(child);
  };
  walk(fromMarkdown(md, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }));
  return out;
}

/** Formats Markdown with the project's Prettier config; throws if the content would change. */
export async function formatMarkdown(file: string, text: string): Promise<string> {
  const options = (await resolveConfig(file)) ?? {};
  const formatted = await format(text, { ...options, filepath: file });
  const before = canonical(text);
  const after = canonical(formatted);
  const i = before.findIndex((t, n) => t.key !== after[n]?.key);
  if (i !== -1 || before.length !== after.length) {
    const at = i === -1 ? before.length - 1 : i;
    throw new Error(
      `${file}:${before[at]?.line ?? '?'}: formatting would change the content — fix the source ` +
        `(escape a bare * or _, a | in a table cell, or an indented continuation line).\n` +
        `  before: ${before[at]?.key.slice(0, 160) ?? '(end)'}\n  after:  ${after[at]?.key.slice(0, 160) ?? '(end)'}`,
    );
  }
  return formatted;
}
