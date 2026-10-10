/**
 * @fileoverview BoardTopBar — 3-column header for Board screen
 *
 * Source: design-sources/2026-05-25/v24-mode-toggle.jsx BoardTopBarV3
 *
 * Layout: 1fr (left: flame + breadcrumb) | auto (center: ModeToggle) | 1fr (right: actions)
 *
 * In the narrow frame PAUSED and STOP ALL move to the dock at the bottom (LiveControls,
 * docs/product/features/adaptive-layout.md L2); the top bar keeps back, the mode toggle and the Lock.
 */

import type { JSX } from 'preact';
import { PixelIcon } from './PixelIcon';
import { ModeToggle } from './ModeToggle';
import { LiveControls } from './LiveControls';
import { toggleModeLock } from '../state/modeControl';
import { modeLocked } from '../state/store';
import { narrowWindow } from '../state/windowClass';
import type { AppMode } from '../types';

interface BoardTopBarProps {
  boardName: string;
  deckName?: string;
  mode: AppMode;
  onModeSwitch: (newMode: AppMode) => void;
  /** Toggle state of the library panel (right slot) */
  libraryOpen: boolean;
  onLibraryToggle: () => void;
  onBack: () => void;
}

/**
 * Shows the board screen's header: back button and board / deck name, the mode toggle, and the
 * library button.
 */
export function BoardTopBar({
  boardName,
  deckName,
  mode,
  onModeSwitch,
  libraryOpen,
  onLibraryToggle,
  onBack,
}: BoardTopBarProps): JSX.Element {
  const compact = narrowWindow.value;

  return (
    <div class="sb-board-topbar" data-testid="board-top-bar">
      {/* Left: back button + breadcrumb */}
      <div class="sb-board-topbar-left">
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost sb-topbar-icon-btn"
          data-testid="board-top-bar-back-button"
          onClick={onBack}
          title="Back to board list"
          aria-label="Back to the board list"
        >
          <PixelIcon name="flame" size={14} color="var(--flame)" />
        </button>
        <div class="sb-topbar-bc-col">
          <span
            class="sb-display-vt sb-topbar-title is-board"
            style={{ maxWidth: compact ? '80px' : '140px' }}
          >
            {boardName}
          </span>
          {deckName && <span class="sb-topbar-secondary">· {deckName}</span>}
        </div>
      </div>

      {/* Center: Mode toggle, and in GAME the Lock right next to the toggle it locks (Slice 12c) */}
      <div class="sb-row">
        <ModeToggle
          mode={mode}
          onSwitch={onModeSwitch}
          compact={compact}
          locked={modeLocked.value}
        />
        {mode === 'play' && (
          <button
            type="button"
            class={`sb-btn sb-btn-sm ${modeLocked.value ? 'sb-btn-primary' : 'sb-btn-ghost'} sb-topbar-icon-btn`}
            data-testid="board-top-bar-lock-button"
            aria-pressed={modeLocked.value}
            aria-label={modeLocked.value ? 'Unlock the mode switch' : 'Lock the mode switch'}
            title={modeLocked.value ? 'Unlock the mode switch' : 'Lock the mode switch in GAME'}
            onClick={toggleModeLock}
          >
            <PixelIcon name="lock" size={12} />
          </button>
        )}
      </div>

      {/* Right: PAUSED and STOP ALL (GAME, wide frame), library toggle */}
      <div class="sb-board-topbar-right">
        {mode === 'play' && !compact && <LiveControls place="top-bar" />}
        <button
          class={`sb-btn sb-btn-sm ${libraryOpen ? 'sb-btn-primary' : 'sb-btn-ghost'} sb-topbar-icon-btn`}
          onClick={onLibraryToggle}
          title={libraryOpen ? 'Close library panel' : 'Open library panel'}
          aria-label={libraryOpen ? 'Close the library' : 'Open the library'}
          aria-pressed={libraryOpen}
        >
          <PixelIcon name="book" size={12} />
          {!compact && 'LIB'}
        </button>
      </div>
    </div>
  );
}
