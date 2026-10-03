/**
 * @fileoverview debouncedSave — write the latest value once the edits pause, never drop it
 *
 * Auto-save waits until the edits pause (one write per pause, not per keystroke). A pending
 * value is written, not discarded, when its context ends: the editor switches to another pad,
 * closes, or the page is hidden — "persist any unsaved application state" on hidden
 * (developer.chrome.com/docs/web-platform/page-lifecycle-api). Dropping it lost a typed pad
 * name when the next pad was edited within the delay (2026-10-02).
 *
 * A value that waits counts as a running save (`pendingSaves`) from the moment it is scheduled —
 * not only once it is written — so whatever waits for the saves (RELOAD in the update prompt, the
 * `data-saving` marker E2E tests wait for) also waits for it. A reload half a second after an edit
 * cut the last save off (ubuntu-26.04 probe, 2026-10-04; BACKLOG "Reload right after an edit").
 */

import { pendingSaves } from '../state/store';

/** A delayed write that can be flushed: the handle `debouncedSave` returns. */
export interface DebouncedSave<T> {
  /** Remember the value and (re)start the delay; only the latest value is written. */
  schedule(value: T): void;
  /** Write the pending value now, if there is one, and stop the delay. */
  flush(): void;
}

/**
 * Returns a delayed write: `schedule` calls `write` with the latest value once `delayMs` pass
 * without a new value; `flush` writes a pending value at once. Callers flush when the editing
 * context ends (the editor closes or switches pad, the page is hidden).
 */
export function debouncedSave<T>(write: (value: T) => void, delayMs: number): DebouncedSave<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  function flush(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending === null) return;
    const { value } = pending;
    pending = null;
    try {
      write(value); // a write that saves counts itself from here on …
    } finally {
      pendingSaves.value--; // … so the count never drops to 0 in between, nor stays up on a throw
    }
  }

  return {
    schedule(value) {
      if (pending === null) pendingSaves.value++;
      pending = { value };
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    flush,
  };
}
