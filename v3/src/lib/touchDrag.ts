/**
 * @fileoverview touchDrag — a finger drag starts only after a short press, so a swipe scrolls
 *
 * Elements that can be dragged (pads in SETUP, library rows) used `touch-action: none`, which took
 * every touch away from the browser: a swipe that started on them never scrolled (owner report
 * 2026-10-11). They keep the browser's panning now, and a touch drag waits for a press of
 * `LONG_PRESS_MS` without moving — the pattern of touch sensors in drag & drop libraries (a delay
 * with a tolerance; a move before it is a scroll) and of the iOS home screen. Once the drag starts,
 * the page stops scrolling until the finger lifts (a non-passive `touchmove` that prevents the
 * default — the browser has not started to pan, as the finger rested). A mouse or a pen drags at
 * once, as before.
 */

/** How long a finger rests before it drags (ms). */
export const LONG_PRESS_MS = 250;

/**
 * Calls `onStart` when the press `e` becomes a drag: at once for a mouse or a pen; for a finger
 * once it has rested `LONG_PRESS_MS` without moving more than `tolerance` px — a move before that
 * is a scroll, and nothing starts. After the start, scrolling is blocked until the finger lifts.
 */
export function pressToDrag(e: PointerEvent, tolerance: number, onStart: () => void): void {
  if (e.pointerType !== 'touch') {
    onStart();
    return;
  }
  const { pointerId, clientX: x0, clientY: y0 } = e;
  let active = false;

  const blockScroll = (te: TouchEvent) => {
    if (active && te.cancelable) te.preventDefault();
  };
  const end = () => {
    clearTimeout(timer);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('pointercancel', onEnd);
    document.removeEventListener('touchmove', blockScroll);
    document.removeEventListener('touchend', end);
    document.removeEventListener('touchcancel', end);
  };
  const onMove = (me: PointerEvent) => {
    if (me.pointerId !== pointerId || active) return;
    if (Math.abs(me.clientX - x0) > tolerance || Math.abs(me.clientY - y0) > tolerance) end();
  };
  const onEnd = (pe: PointerEvent) => {
    if (pe.pointerId === pointerId && !active) end();
  };
  const timer = setTimeout(() => {
    active = true;
    document.removeEventListener('pointermove', onMove);
    onStart();
  }, LONG_PRESS_MS);

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onEnd);
  document.addEventListener('pointercancel', onEnd);
  document.addEventListener('touchmove', blockScroll, { passive: false });
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
}
