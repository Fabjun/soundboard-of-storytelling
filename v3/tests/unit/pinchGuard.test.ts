// @vitest-environment jsdom
/**
 * @fileoverview pinchGuard — iOS pinch gestures are canceled (ADR-0067 amendment 2026-10-19)
 */

import { blockPinchZoom } from '../../src/lib/pinchGuard';

/** A cancelable event of `type`, dispatched on the document; returns whether it was canceled. */
const dispatch = (type: string) => {
  const e = new Event(type, { cancelable: true });
  document.dispatchEvent(e);
  return e.defaultPrevented;
};

describe('blockPinchZoom', () => {
  it('cancels gesturestart and gesturechange, and nothing else', () => {
    const stop = blockPinchZoom();
    expect(dispatch('gesturestart')).toBe(true);
    expect(dispatch('gesturechange')).toBe(true);
    expect(dispatch('touchstart')).toBe(false);
    stop();
  });

  it('stops canceling once its stop function ran', () => {
    blockPinchZoom()();
    expect(dispatch('gesturestart')).toBe(false);
  });
});
