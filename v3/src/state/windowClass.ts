/**
 * @fileoverview windowClass — whether the window is narrow or wide, asked in one place (Slice 13a)
 *
 * docs/product/features/adaptive-layout.md L1 (owner decision 2026-10-10): below WIDE_MIN_WIDTH CSS
 * px the Board screen uses the narrow frame — the dock at the bottom —, from it the wide frame. The
 * value is the boundary of Material 3's compact and medium window size classes, a start value
 * calibrated on the devices (ADR-0045, ADR-0082).
 *
 * Components read `narrowWindow`, never `window.innerWidth` or a media query of their own
 * (codeGuards): three of them each read the width once while rendering, at 480 or 600 px, and did
 * not follow a rotation (found 2026-10-10). The signal follows the MediaQueryList change event
 * (MDN, Testing media queries programmatically), so a resize or a rotation switches the frame.
 */

import { signal } from '@preact/signals';

/** Window width in CSS px from which the wide frame applies. */
export const WIDE_MIN_WIDTH = 600;

/**
 * The media query of the narrow frame. `max-width` with .02 px below the boundary, as Bootstrap
 * writes its breakpoints (getbootstrap.com, Breakpoints: fractional viewport widths on high-dpi
 * devices); the range syntax `(width < 600px)` needs iOS 16.4, the app supports 15.
 */
export const NARROW_QUERY = `(max-width: ${WIDE_MIN_WIDTH - 0.02}px)`;

/** True while the window is narrower than WIDE_MIN_WIDTH. */
export const narrowWindow = signal(false);

/**
 * Starts following the window width and sets `narrowWindow` at once, so the first render already
 * has the right frame. Call once at app start; returns a function that stops it.
 */
export function startWindowClass(win: Pick<Window, 'matchMedia'> = window): () => void {
  const query = win.matchMedia(NARROW_QUERY);
  const update = () => {
    narrowWindow.value = query.matches;
  };
  update();
  query.addEventListener('change', update);
  return () => query.removeEventListener('change', update);
}
