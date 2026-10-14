/**
 * @fileoverview debugLog — the app's console messages, kept for the developer view
 * (docs/product/features/settings.md S8, Slice 14e)
 *
 * V1's DEBUG LOG: while switched on (Settings → DEVELOPER, off by default), every console.log /
 * info / warn / error is also kept — the last 200, oldest dropped first — so a problem met at the
 * table can be read and copied without browser developer tools (there are none on an iPhone).
 * Switched off, the console is left exactly as it was: nothing is wrapped, nothing kept.
 */

import { signal } from '@preact/signals';

/** How many messages are kept (V1: 200). */
export const DEBUG_LOG_MAX = 200;

/** The console methods that are kept. */
const LEVELS = ['log', 'info', 'warn', 'error'] as const;

/** One kept console message. */
export interface LogEntry {
  /** When it was written, ms since epoch. */
  ts: number;
  level: (typeof LEVELS)[number];
  text: string;
}

const entries: LogEntry[] = [];
let restore: (() => void) | null = null;

/** Counts changes to the kept messages — read it in a component to re-render when one comes. */
export const debugLogVersion = signal(0);

/** Turns console arguments into one line: strings as they are, errors with their stack, the rest as JSON. */
export function formatArgs(args: readonly unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.stack ?? `${a.name}: ${a.message}`;
      try {
        return JSON.stringify(a) ?? String(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

/** Starts keeping what `target` (the console) writes; nothing happens when it keeps already. */
export function startDebugLog(target: Console = console): void {
  if (restore) return;
  const originals = LEVELS.map((level) => [level, target[level]] as const);
  for (const [level, original] of originals) {
    target[level] = (...args: unknown[]) => {
      original.apply(target, args);
      entries.push({ ts: Date.now(), level, text: formatArgs(args) });
      if (entries.length > DEBUG_LOG_MAX) entries.shift();
      debugLogVersion.value++;
    };
  }
  restore = () => {
    for (const [level, original] of originals) target[level] = original;
  };
}

/** Stops keeping messages and gives the console back its own methods; the kept ones stay. */
export function stopDebugLog(): void {
  restore?.();
  restore = null;
}

/** The kept messages, oldest first. */
export function debugLogEntries(): readonly LogEntry[] {
  return entries;
}

/** Forgets every kept message. */
export function clearDebugLog(): void {
  entries.length = 0;
  debugLogVersion.value++;
}

/** The kept messages as text to copy: one line each — time, level, message. */
export function debugLogText(): string {
  return entries
    .map((e) => `${new Date(e.ts).toISOString()} ${e.level.toUpperCase()} ${e.text}`)
    .join('\n');
}
