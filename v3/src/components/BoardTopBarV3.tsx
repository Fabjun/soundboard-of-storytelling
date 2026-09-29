// ─────────────────────────────────────────────────────────────────────────────
// BoardTopBarV3 — 3-column header for Board screen
//
// Source: SoS_DESIGN_25052026/v24-mode-toggle.jsx BoardTopBarV3
//
// Layout: 1fr (left: flame + breadcrumb) | auto (center: ModeToggle) | 1fr (right: actions)
// ─────────────────────────────────────────────────────────────────────────────

import type { JSX } from 'preact';
import { PixelIcon } from './PixelIcon';
import { ModeToggle } from './ModeToggle';
import type { AppMode } from '../types';

interface BoardTopBarV3Props {
  boardName: string;
  deckName?: string;
  mode: AppMode;
  onModeSwitch: (newMode: AppMode) => void;
  /** Toggle state of the library panel (right slot) */
  libraryOpen: boolean;
  onLibraryToggle: () => void;
  onBack: () => void;
}

export function BoardTopBarV3({
  boardName,
  deckName,
  mode,
  onModeSwitch,
  libraryOpen,
  onLibraryToggle,
  onBack,
}: BoardTopBarV3Props): JSX.Element {
  // Detect compact (mobile) viewport
  const compact = typeof window !== 'undefined' && window.innerWidth < 480;

  return (
    <div class="sb-board-topbar">
      {/* Left: back button + breadcrumb */}
      <div class="sb-board-topbar-left">
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost sb-topbar-icon-btn"
          data-testid="board-back-button"
          onClick={onBack}
          title="Back to board list"
        >
          <PixelIcon name="flame" size={14} color="var(--flame)" />
        </button>
        <div class="sb-topbar-bc-col">
          <span
            class="sb-display-vt sb-topbar-title is-board"
            style={{ maxWidth: compact ? 80 : 140 }}
          >
            {boardName}
          </span>
          {deckName && <span class="sb-topbar-secondary">· {deckName}</span>}
        </div>
      </div>

      {/* Center: Mode toggle */}
      <ModeToggle mode={mode} onSwitch={onModeSwitch} compact={compact} />

      {/* Right: library toggle + secondary actions */}
      <div class="sb-board-topbar-right">
        <button
          class={`sb-btn sb-btn-sm ${libraryOpen ? 'sb-btn-primary' : 'sb-btn-ghost'} sb-topbar-icon-btn`}
          onClick={onLibraryToggle}
          title={libraryOpen ? 'Close library panel' : 'Open library panel'}
        >
          <PixelIcon name="book" size={12} />
          {!compact && 'LIB'}
        </button>
      </div>
    </div>
  );
}
