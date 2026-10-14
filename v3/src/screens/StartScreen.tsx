/**
 * @fileoverview StartScreen — the flame and one action: TAP TO START
 *
 * Source: design-sources/2026-05-25/v2-screens.jsx StartScreen
 *
 * docs/product/features/settings.md S15 (owner decision 2026-10-11): the start screen shows the
 * flame, the title and TAP TO START only. The tap unlocks the Web Audio context — browsers allow
 * sound only after a user gesture, so every way into the app passes it — and opens the main menu
 * (src/screens/MainMenuScreen.tsx), which holds BOARD, LIBRARY, SETTINGS, UPDATE and What's new.
 */

import type { JSX } from 'preact';
import { PixelIcon } from '../components/PixelIcon';
import { AnimatedFlame } from '../components/AnimatedFlame';
import { audioContextState, currentScreen } from '../state/store';
import { initAudio } from '../audio/index';

/**
 * initAudio() MUST be the first statement — no await before it.
 * iOS Safari's user-gesture window closes on the first async tick (ADR-0043).
 * Wrapped in try-catch so navigation always succeeds even if AudioContext
 * creation fails (e.g. browser privacy settings).
 */
function handleStart(): void {
  try {
    initAudio();
  } catch (e) {
    console.warn('[audio] AudioContext init failed — pads will be silent:', e);
  }
  audioContextState.value = 'running';
  currentScreen.value = 'menu';
}

/** Shows the start screen: the flame, the title and TAP TO START, which unlocks audio and opens the main menu. */
export function StartScreen(): JSX.Element {
  return (
    <div class="sb sb-scanlines sb-start-screen">
      {/* ── Animated flame (tap to freeze) — v13-animated-flame.jsx ── */}
      <div class="sb-flame-well" data-testid="start-screen-flame-region">
        <AnimatedFlame size={120} />
      </div>

      <h1 class="sb-display sb-start-title">
        SOUNDBOARD
        <br />
        OF STORYTELLING
      </h1>

      <div class="sb-mono is-italic sb-start-tagline">
        // a tool for game-masters and other creative creatures
      </div>

      {/* The one action — minimum 44px touch target per CLAUDE.md; the flame's auto margins keep
          it centered */}
      <button class="sb-btn sb-btn-primary sb-btn-unlock sb-start-action" onClick={handleStart}>
        <PixelIcon name="play" size={14} />
        TAP TO START
      </button>
    </div>
  );
}
