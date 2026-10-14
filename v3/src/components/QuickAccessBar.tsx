/**
 * @fileoverview QuickAccessBar — the board's quick-access pads, above the grid in every view
 * (Slice 13d)
 *
 * docs/product/README.md#board-decks--quick-access (owner decisions 2026-09-28): board-wide, the
 * same in every deck, freely filled with pads of the pool (e.g. DAY, NIGHT). As V1's strip: above
 * the grid, up to five pads in the order they were added, pinned in the PAD editor (★). In GAME a
 * tap plays or stops the pad, as in the grid; in SETUP it opens the pad in the PAD editor. Shown
 * only while it holds a pad. Each pad may have a board-wide key (K13), set in the PAD editor and
 * shown on the pad; keyControl plays it in every view.
 */

import type { JSX } from 'preact';
import type { AppMode, Board, Pad } from '../types';
import { padTypeColor } from '../lib/padUtils';
import { keyLabel } from '../lib/padKeys';
import { play, stop, isPlaying } from '../audio/index';
import { playingPads } from '../state/store';
import { UiIcon } from './UiIcon';

interface QuickAccessBarProps {
  board: Board;
  mode: AppMode;
  /** SETUP: opens the pad in the PAD editor. */
  onPadSelect: (pad: Pad) => void;
}

/** Shows the quick-access pads; nothing while the bar is empty. */
export function QuickAccessBar({
  board,
  mode,
  onPadSelect,
}: QuickAccessBarProps): JSX.Element | null {
  const pool = new Map(board.pads.map((p) => [p.id, p]));
  const pads = board.quickAccess.flatMap((q) => {
    const pad = pool.get(q.padId);
    return pad ? [{ pad, hotkey: q.hotkey }] : [];
  });
  if (pads.length === 0) return null;
  const isSetup = mode === 'edit';

  return (
    <div
      class="sb-quick-access"
      id="quick-access-bar"
      role="group"
      aria-label="Quick access"
      data-testid="quick-access-bar"
    >
      <span class="sb-quick-access-label" aria-hidden="true">
        <UiIcon name="quickAccess" />
      </span>
      {pads.map(({ pad, hotkey }) => {
        const hot = playingPads.value.has(pad.id);
        return (
          <button
            key={pad.id}
            type="button"
            class={'sb-quick-access-pad' + (hot ? ' is-hot' : '')}
            style={{ '--pad-color': padTypeColor(pad.type) } as Record<string, string>}
            aria-pressed={isSetup ? undefined : hot}
            data-testid={`quick-access-bar-pad-button-${pad.id}`}
            onClick={() => {
              if (isSetup) onPadSelect(pad);
              else if (isPlaying(pad.id)) stop(pad.id);
              else void play(pad.id, pad);
            }}
          >
            <span class="sb-flex-trunc">{pad.name || '—'}</span>
            {/* Its board-wide key, short (K10, K13) */}
            {hotkey && <span class="sb-quick-access-key">{keyLabel(hotkey)}</span>}
          </button>
        );
      })}
    </div>
  );
}
