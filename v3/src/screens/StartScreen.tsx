// ─────────────────────────────────────────────────────────────────────────────
// StartScreen — fire animation + TAP TO UNLOCK entry point
//
// Source: design-sources/2026-05-25/v2-screens.jsx StartScreen
//
// Responsibilities:
//  1. Render the app splash (animated flame, title, tagline)
//  2. On button tap: unlock the Web Audio context + navigate to board-list
//  3. Show version (clickable → changelog overlay) + audio state in footer
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { PixelIcon } from '../components/PixelIcon';
import { AnimatedFlame } from '../components/AnimatedFlame';
import { audioContextState, currentScreen } from '../state/store';
import { initAudio } from '../audio/index';
import { APP_VERSION, CHANGELOG } from '../lib/changelog';

declare const __BUILD_DATE__: string;

// ── ChangelogOverlay ──────────────────────────────────────────────────────────

function ChangelogOverlay({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div class="sb-overlay">
      {/* Header */}
      <div class="sb-overlay-header">
        <div class="sb-overlay-title">CHANGELOG</div>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          onClick={onClose}
          aria-label="Close changelog"
        >
          ×
        </button>
      </div>

      {/* Scrollable entries */}
      <div class="sb-overlay-body">
        {CHANGELOG.map((entry) => (
          <div key={entry.version}>
            {/* Version header */}
            <div class="sb-row sb-changelog-entry-header">
              <span class="sb-changelog-version">v {entry.version}</span>
              <span class="sb-caption">{entry.date}</span>
            </div>

            {/* Items */}
            <ul class="sb-changelog-items">
              {entry.items.map((item, i) => (
                <li key={i} class="sb-mono sb-changelog-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function describeAudioState(): string {
  switch (audioContextState.value) {
    case 'locked':
      return 'audio context idle · tap to activate';
    case 'running':
      return 'audio context running · ready';
    case 'suspended':
      return 'audio context suspended';
  }
}

/**
 * initAudio() MUST be the first statement — no await before it.
 * iOS Safari's user-gesture window closes on the first async tick (ADR-0043).
 * Wrapped in try-catch so navigation always succeeds even if AudioContext
 * creation fails (e.g. browser privacy settings).
 */
function handleUnlock(): void {
  try {
    initAudio();
  } catch (e) {
    console.warn('[audio] AudioContext init failed — pads will be silent:', e);
  }
  audioContextState.value = 'running';
  currentScreen.value = 'board-list';
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function StartScreen(): JSX.Element {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <div class="sb sb-scanlines sb-start-screen">
      {showChangelog && <ChangelogOverlay onClose={() => setShowChangelog(false)} />}

      {/* ── Animated flame (tap to freeze) — v13-animated-flame.jsx ── */}
      <div class="sb-flame-well">
        <AnimatedFlame size={120} />
      </div>

      {/* ── App title ── */}
      <div class="sb-display sb-start-title">
        SOUNDBOARD
        <br />
        OF STORYTELLING
      </div>

      {/* ── Tagline ── */}
      <div class="sb-mono is-italic sb-start-tagline">
        // a tool for game-masters and other creative creatures
      </div>

      {/* ── Unlock button — minimum 44px touch target per CLAUDE.md ── */}
      <button class="sb-btn sb-btn-primary sb-btn-unlock" onClick={handleUnlock}>
        <PixelIcon name="play" size={14} />
        TAP TO UNLOCK
      </button>

      {/* ── Navigation buttons ── */}
      <div class="sb-start-nav">
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          onClick={() => {
            currentScreen.value = 'board-list';
          }}
        >
          <PixelIcon name="scroll" size={12} />
          BOARD
        </button>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          onClick={() => {
            currentScreen.value = 'library';
          }}
        >
          <PixelIcon name="book" size={12} />
          LIBRARY
        </button>
      </div>

      {/* ── Footer: clickable version → changelog + audio state ── */}
      <div class="sb-start-footer">
        <button
          class="sb-version-link"
          onClick={() => setShowChangelog(true)}
          aria-label="Open changelog"
        >
          v {APP_VERSION}
        </button>
        <span>· build {__BUILD_DATE__} ·</span>
        <span>{describeAudioState()}</span>
      </div>
    </div>
  );
}
