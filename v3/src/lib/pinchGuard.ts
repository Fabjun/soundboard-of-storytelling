/**
 * @fileoverview pinchGuard — no pinch zoom on iOS (ADR-0067 amendment 2026-10-19)
 *
 * On iOS WebKit the app sets `touch-action: manipulation` (src/styles/global.css), the only value
 * besides `none` that stops its double-tap zoom — and it allows pinch zoom. Safari's own gesture
 * events (`gesturestart`, `gesturechange`, iOS only) are canceled here, which keeps the page at
 * its scale (WebKit made `preventDefault` on them stop the zoom in iOS 12.2, bug 195052). Other
 * browsers never send these events, so the guard does nothing there.
 */

/** The gesture events of iOS Safari that start and continue a pinch. */
const PINCH_EVENTS = ['gesturestart', 'gesturechange'] as const;

/** Cancels iOS pinch gestures on `doc` from now on; returns a function that stops it. */
export function blockPinchZoom(
  doc: Pick<Document, 'addEventListener' | 'removeEventListener'> = document,
): () => void {
  const cancel = (e: Event): void => e.preventDefault();
  for (const type of PINCH_EVENTS) doc.addEventListener(type, cancel, { passive: false });
  return () => {
    for (const type of PINCH_EVENTS) doc.removeEventListener(type, cancel);
  };
}
