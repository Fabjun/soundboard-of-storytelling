/**
 * @fileoverview StartScreen — fire animation + TAP TO UNLOCK entry point
 *
 * Source: design-sources/2026-05-25/v2-screens.jsx StartScreen
 *
 * Responsibilities:
 *  1. Render the app splash (animated flame, title, tagline)
 *  2. On button tap: unlock the Web Audio context + navigate to board-list
 *  3. Show version (clickable → What's new) + audio state in footer
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { PixelIcon } from '../components/PixelIcon';
import { AnimatedFlame } from '../components/AnimatedFlame';
import { audioContextState, currentScreen } from '../state/store';
import { initAudio } from '../audio/index';
import { APP_VERSION } from '../lib/changelog';
import { WHATS_NEW, WHATS_NEW_GROUPS } from '../lib/whatsNew';

declare const __BUILD_DATE__: string;

// ── WhatsNewOverlay ───────────────────────────────────────────────────────────

/** The release notes for the people who use the app, newest version first (ADR-0063). */
function WhatsNewOverlay({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div class="sb-overlay" data-testid="start-screen-whats-new-region">
      <div class="sb-overlay-header">
        <div class="sb-overlay-title">WHAT'S NEW</div>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          onClick={onClose}
          aria-label="Close What's new"
        >
          ×
        </button>
      </div>

      <div class="sb-overlay-body">
        {WHATS_NEW.map((entry) => (
          <section key={entry.version} aria-label={`Version ${entry.version}`}>
            <div class="sb-row sb-whats-new-entry-header">
              <span class="sb-whats-new-version">v {entry.version}</span>
              <span class="sb-caption">{entry.date}</span>
            </div>

            {/* Only the groups this version has, in a fixed order */}
            {WHATS_NEW_GROUPS.map(([key, heading]) => {
              const sentences = entry[key];
              if (!sentences?.length) return null;
              return (
                <div key={key}>
                  <h3 class="sb-whats-new-group">{heading}</h3>
                  <ul class="sb-whats-new-items">
                    {sentences.map((text) => (
                      <li key={text} class="sb-mono sb-whats-new-item">
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
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

/**
 * Shows the start screen: TAP TO UNLOCK unlocks audio (it must run in the tap) and opens the
 * board list; the version in the footer opens What's new.
 */
export function StartScreen(): JSX.Element {
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  return (
    <div class="sb sb-scanlines sb-start-screen">
      {showWhatsNew && <WhatsNewOverlay onClose={() => setShowWhatsNew(false)} />}

      {/* ── Animated flame (tap to freeze) — v13-animated-flame.jsx ── */}
      <div class="sb-flame-well" data-testid="start-screen-flame-region">
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

      {/* ── Footer: clickable version → What's new + audio state ── */}
      <div class="sb-start-footer" data-testid="start-screen-footer-region">
        <button
          class="sb-version-link"
          onClick={() => setShowWhatsNew(true)}
          aria-label="Open What's new"
        >
          v {APP_VERSION}
        </button>
        <span>· build {__BUILD_DATE__} ·</span>
        <span>{describeAudioState()}</span>
      </div>
    </div>
  );
}
