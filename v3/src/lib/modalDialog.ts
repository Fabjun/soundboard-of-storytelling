/**
 * @fileoverview modalDialog — the one way a dialog opens and closes (ADR-0074)
 *
 * W3C WAI-ARIA APG, Dialog (Modal) pattern: "Windows under a modal dialog are inert", "When a
 * dialog opens, focus moves to an element inside the dialog", "When a dialog closes, focus returns
 * to the element that invoked the dialog". Every dialog of the app did this with its own copy of
 * the same layout effect; this hook is that effect once. It runs in a layout effect, before the
 * dialog is painted (the race of escapeKey.ts), and on close it lifts the inert marks before it
 * moves the focus back — an inert element cannot take the focus.
 */

import { useLayoutEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { inertOutside } from './inertOutside';

/** Where a modal dialog sits and where the focus goes. */
export interface ModalDialogOptions {
  /** Whether the dialog is open now — for a dialog that is always rendered (default: open). */
  active?: boolean;
  /** The element up to which everything outside the dialog is inert (default: the page body). */
  root?: (dialog: HTMLElement) => Element;
  /**
   * The element that takes the focus on open (default: the one marked `data-autofocus`, else the
   * dialog itself — ADR-0074: never a field that would open the phone keyboard unasked).
   */
  initialFocus?: (dialog: HTMLElement) => HTMLElement | null;
  /** The element that gets the focus back on close (default: the one focused when it opened). */
  returnFocus?: () => HTMLElement | null;
}

/**
 * Makes `dialog` modal while it is open: everything outside it is inert, the focus moves in, and
 * on close the focus goes back to the element that opened it while that is still on the page.
 */
export function useModalDialog(
  dialog: RefObject<HTMLElement | null>,
  options: ModalDialogOptions = {},
): void {
  const latest = useRef(options);
  latest.current = options;
  const active = options.active ?? true;
  useLayoutEffect(() => {
    const el = dialog.current;
    if (!active || !el) return;
    const { root, initialFocus, returnFocus } = latest.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const back = returnFocus ? returnFocus() : opener;
    const restore = inertOutside(el, root ? root(el) : document.body);
    const first = initialFocus
      ? initialFocus(el)
      : (el.querySelector<HTMLElement>('[data-autofocus]') ?? el);
    first?.focus({ preventScroll: true });
    return () => {
      restore();
      if (back?.isConnected) back.focus({ preventScroll: true });
    };
  }, [active, dialog]);
}
