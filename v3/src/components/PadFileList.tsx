/**
 * @fileoverview PadFileList — the files of a Single / Loop pad in the PAD editor (Slice 15b)
 *
 * One row per file: its name (tap = select it for the waveform editor and the preview), ▲ / ▼ to
 * move it one place (WCAG 2.2 SC 2.5.7: "adjacent controls for moving the element up or down"
 * instead of dragging) and ✕ to remove it with a second tap to confirm (CLAUDE.md: every delete
 * is two taps). With several files, "in order" / "shuffled" says how they play. The list logic
 * lives in src/lib/padFiles.ts; this component only reports what was tapped.
 */

import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import type { FileOrder, PadFile } from '../types';

interface PadFileListProps {
  files: readonly PadFile[];
  /** The library name of a file, or undefined when it is not in the library. */
  names: (hash: string) => string | undefined;
  /** Index of the selected file. */
  selected: number;
  order: FileOrder;
  onSelect: (index: number) => void;
  onMove: (index: number, step: -1 | 1) => void;
  onRemove: (index: number) => void;
  onOrderChange: (order: FileOrder) => void;
}

const ORDERS: { order: FileOrder; label: string }[] = [
  { order: 'sequential', label: 'IN ORDER' },
  { order: 'shuffle', label: 'SHUFFLED' },
];

/** Lists a pad's files with select, move and remove, and the order of several files. */
export function PadFileList({
  files,
  names,
  selected,
  order,
  onSelect,
  onMove,
  onRemove,
  onOrderChange,
}: PadFileListProps): JSX.Element {
  /** The file whose ✕ was tapped once and waits for the confirming second tap. */
  const [confirming, setConfirming] = useState<number | null>(null);

  if (files.length === 0) {
    return (
      <div class="sb-lib-browser-empty" data-testid="pad-file-list">
        No files yet — BROWSE adds them.
      </div>
    );
  }

  return (
    <div class="sb-col" data-testid="pad-file-list">
      {files.map((file, i) => {
        const name = names(file.hash) ?? 'Missing file';
        return (
          <div key={file.hash} class="sb-row-sm" data-testid={`pad-file-list-file-row-${i}`}>
            <button
              class={`sb-btn sb-flex-1 ${i === selected ? 'sb-btn-primary' : 'sb-btn-ghost'}`}
              aria-pressed={i === selected}
              data-testid={`pad-file-list-select-button-${i}`}
              onClick={() => onSelect(i)}
            >
              <span class="sb-flex-trunc">{name}</span>
            </button>
            <button
              class="sb-btn sb-btn-ghost"
              aria-label={`Move ${name} up`}
              disabled={i === 0}
              data-testid={`pad-file-list-up-button-${i}`}
              onClick={() => onMove(i, -1)}
            >
              ▲
            </button>
            <button
              class="sb-btn sb-btn-ghost"
              aria-label={`Move ${name} down`}
              disabled={i === files.length - 1}
              data-testid={`pad-file-list-down-button-${i}`}
              onClick={() => onMove(i, 1)}
            >
              ▼
            </button>
            <button
              class="sb-btn sb-btn-danger"
              aria-label={confirming === i ? `Confirm: remove ${name}` : `Remove ${name}`}
              data-testid={`pad-file-list-remove-button-${i}`}
              onClick={() => {
                if (confirming === i) {
                  setConfirming(null);
                  onRemove(i);
                } else setConfirming(i);
              }}
              onBlur={() => setConfirming(null)}
            >
              {confirming === i ? 'CONFIRM' : '✕'}
            </button>
          </div>
        );
      })}

      {files.length > 1 && (
        <div class="sb-row-sm" role="group" aria-label="How several files play">
          {ORDERS.map(({ order: o, label }) => (
            <button
              key={o}
              class={`sb-btn sb-btn-xs ${order === o ? 'sb-btn-primary' : 'sb-btn-ghost'}`}
              aria-pressed={order === o}
              data-testid={`pad-file-list-order-button-${o}`}
              onClick={() => onOrderChange(o)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
