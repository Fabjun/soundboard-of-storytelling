/**
 * @fileoverview StatusBar — fixed bottom bar showing mode, board, and info
 *
 * Source: design-sources/2026-05-25/v2-screens.jsx StatusBarV2
 */

import type { ComponentChildren, JSX } from 'preact';
import type { AppMode } from '../types';
import { saveState, screenKeptOn } from '../state/store';
import { lightTrouble } from '../light/padLight';
import { UiIcon } from './UiIcon';

/** The words for each save state (Slice 12e). */
const SAVE_LABELS = { saving: 'SAVING…', failed: 'NOT SAVED', saved: 'SAVED' } as const;

/** What a lamp that did not answer means, and what to do (light.md C6, Nielsen 9). */
const LIGHT_TROUBLE = 'A lamp did not answer. Settings → LIGHT → TEST says why.';

interface StatusBarProps {
  mode: AppMode;
  boardName?: string;
  infoText?: string;
  right?: ComponentChildren;
  /** Which sounds play now (`nowPlayingText`, Slice 13f) — announced politely when it changes. */
  playing?: string;
  /**
   * The narrow frame's dock (Slice 13a, docs/product/features/adaptive-layout.md L2): taller, so
   * the controls in the right slot get their touch size — one bar at the bottom instead of two.
   */
  dock?: boolean;
}

/**
 * Shows the mode (LIVE in GAME, EDIT in SETUP), whether changes are saved (SAVING… / SAVED /
 * NOT SAVED, Slice 12e), LIGHT ✕ while a lamp did not answer (light.md C6), SCREEN ON while the
 * screen is kept on, the board name, an info text,
 * which sounds play now (`playing`) and a right slot; as the dock (`dock`) it is taller.
 */
export function StatusBar({
  mode,
  boardName,
  infoText,
  right,
  playing,
  dock = false,
}: StatusBarProps): JSX.Element {
  const modeColor = mode === 'play' ? 'var(--gold)' : 'var(--mode-setup)';
  const modeLabel = mode === 'play' ? 'LIVE' : 'EDIT';
  const save = saveState.value;

  return (
    <div
      class={dock ? 'sb-status-bar sb-status-bar-dock' : 'sb-status-bar'}
      data-testid="status-bar"
    >
      <span class="sb-status-section" style={{ color: modeColor }}>
        {modeLabel}
      </span>
      {/* A failed save is announced (role alert) and says what happened in plain words
          (Nielsen 9); saving / saved stay quiet — they change with every edit */}
      <span
        class={save === 'failed' ? 'sb-status-section sb-error-label' : 'sb-status-section'}
        data-testid="status-bar-save-text"
        role={save === 'failed' ? 'alert' : undefined}
        title={
          save === 'failed'
            ? 'The last change could not be stored; the board shows what is stored. Free up storage space, then make the change again.'
            : undefined
        }
      >
        {SAVE_LABELS[save]}
      </span>
      {/* A live region is read out only when it was in the page before its text changed (WAI-ARIA
          live regions): it stays, empty and not drawn while every lamp answers; the next pad
          that reaches every lamp clears it (light.md C6) */}
      <span
        class={lightTrouble.value ? 'sb-status-section sb-error-label' : 'sb-visually-hidden'}
        data-testid="status-bar-light-text"
        role="status"
        title={lightTrouble.value ? LIGHT_TROUBLE : undefined}
      >
        {lightTrouble.value && (
          <>
            <span aria-hidden="true">LIGHT</span>
            <UiIcon name="close" size={12} />
            <span class="sb-visually-hidden">{LIGHT_TROUBLE}</span>
          </>
        )}
      </span>
      {screenKeptOn.value && (
        <span class="sb-status-section" data-testid="status-bar-screen-on-text">
          SCREEN ON
        </span>
      )}
      {boardName && <span class="sb-status-section">{boardName}</span>}
      {infoText && <span class="sb-status-section">{infoText}</span>}
      {/* role status: a screen reader says the new line when it is idle, without moving focus
          (WAI-ARIA status role); on a phone a long line ends in … (the whole text stays readable
          to assistive technology) */}
      {playing !== undefined && (
        <span
          class="sb-status-section sb-status-playing"
          data-testid="status-bar-playing-text"
          role="status"
        >
          {playing}
        </span>
      )}
      {right && <span class="sb-status-right">{right}</span>}
    </div>
  );
}
