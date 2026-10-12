/**
 * @fileoverview escapeKey — the one way a dialog listens to the keyboard: Escape closes it
 * (ADR-0074), other keys through `useKeydown` (the PAD editor's undo and redo, ADR-0084)
 *
 * Two races were found in CI on 2026-10-05, both from a document listener added or removed in a
 * passive effect (`useEffect`), which Preact runs only after the browser has painted: a key
 * pressed right after a dialog appeared reached the dialog below (the PAD editor closed with the
 * icon list), or no dialog at all (the icon list stayed open). These hooks add the listener in a
 * layout effect — before the dialog is painted, so before it can be seen — and read the handler
 * and whether it is active from refs set on every render, so the answer is the one of the moment
 * the key is pressed.
 */

import { useLayoutEffect, useRef } from 'preact/hooks';

/**
 * Calls `onKey` for every key pressed on the page while `active` is true — from the first paint
 * of the component on, with the newest handler. For keyboard shortcuts of a dialog; Escape goes
 * through `useEscapeKey`.
 */
export function useKeydown(onKey: (e: KeyboardEvent) => void, active = true): void {
  const latest = useRef({ onKey, active });
  latest.current = { onKey, active };
  useLayoutEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (latest.current.active) latest.current.onKey(e);
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);
}

/**
 * Calls `onEscape` when Escape is pressed while `active` is true — from the first paint of the
 * component on. A dialog below another passes `active: false` while the one on top is open, so
 * only the top one closes.
 */
export function useEscapeKey(onEscape: () => void, active = true): void {
  useKeydown((e) => {
    // One Escape closes one dialog: a press another dialog handled is left alone — the editor's
    // Escape opens its "Discard changes?", which must not take the same press (2026-10-12)
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    onEscape();
  }, active);
}
