/**
 * @fileoverview LiveControls — PAUSED and STOP ALL, in the top bar or in the dock (Slice 13a)
 *
 * One component for the live controls, placed by the frame (docs/product/features/adaptive-layout.md
 * L2): in the wide frame in the board's top bar, in the narrow frame in the dock at the bottom —
 * the thumb zone. There STOP ALL is large: the one control that must never be missed in the dark,
 * mid-performance (BACKLOG "STOP ALL: dedicated, oversized, high-contrast real estate"). GAME only.
 */

import type { JSX } from 'preact';
import { pressStopAll, stopAllFading } from '../state/stopControl';
import { togglePause } from '../state/pauseControl';
import { audioPaused } from '../state/store';

interface LiveControlsProps {
  /** Where they sit: the top bar (small buttons) or the dock (a large STOP ALL). */
  place: 'top-bar' | 'dock';
}

/**
 * Shows PAUSED while every sound is paused (a tap resumes — K8) and STOP ALL, which fades every
 * sound out and, pressed again while they fade, stops them at once (K9, K16).
 */
export function LiveControls({ place }: LiveControlsProps): JSX.Element {
  const size = place === 'dock' ? 'sb-btn-lg' : 'sb-btn-sm sb-topbar-icon-btn';
  return (
    <div class="sb-row" data-testid="live-controls">
      {audioPaused.value && (
        <button
          type="button"
          class={`sb-btn sb-btn-primary ${size}`}
          data-testid="live-controls-paused-button"
          onClick={() => togglePause()}
          title="Every sound is paused — tap or press Space to resume"
        >
          PAUSED
        </button>
      )}
      {/* Always enabled — an emergency stop is never greyed out */}
      <button
        type="button"
        class={`sb-btn sb-btn-danger ${size}`}
        data-testid="live-controls-stop-all-button"
        onClick={() => pressStopAll()}
        title={
          stopAllFading.value ? 'Stop every sound now' : 'Fade every sound out; again to stop now'
        }
      >
        {stopAllFading.value ? 'STOP NOW' : 'STOP ALL'}
      </button>
    </div>
  );
}
