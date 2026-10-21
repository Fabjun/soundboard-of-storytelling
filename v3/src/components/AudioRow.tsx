/**
 * @fileoverview AudioRow — single row in the Library audio list
 *
 * Shows: type icon | name (renameable) + "in N pads" and the original name of a renamed file (else
 * the hash start) | waveform | duration | size | delete; on a phone (narrow frame) name, duration
 * and delete. In the trash ("Recently deleted", ADR-0087) the same row shows the days left,
 * RESTORE instead of the size, and a delete that asks before it removes the file for good. In select
 * mode (L3) name and hint are the label of a checkbox, and the row has no delete of its own.
 */

import { useRef, useState, useEffect } from 'preact/hooks';
import { UiIcon } from './UiIcon';
import { Waveform } from './Waveform';
import { formatBytes, formatDuration } from '../lib/upload';
import { narrowWindow } from '../state/windowClass';
import type { LibraryItemMeta } from '../types';

/** The row of a file in the trash: what it shows and does instead (Slice 16a). */
interface TrashRowOptions {
  daysLeft: number;
  onRestore: () => void;
  /** Asks before it deletes for good (the caller shows the ConfirmDialog). */
  onDeleteForGood: () => void;
}

interface AudioRowProps {
  meta: LibraryItemMeta;
  selected: boolean;
  onSelect: () => void;
  /** How many pads play the file (src/lib/fileUses.ts). */
  uses?: number;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
  /** Shows the row of a file in the trash. */
  trash?: TrashRowOptions;
  /** The preview of the file (library.md L8): whether it plays now, and ▶ / ■. */
  preview?: { playing: boolean; onToggle: () => void };
  /** Select mode (library.md L3): the row is a checkbox — no preview, rename or delete. */
  choose?: { chosen: boolean; onToggle: () => void };
}

// ── RenameField — inline <input> toggle (no contentEditable — iOS Safari issues) ───

interface RenameFieldProps {
  name: string;
  /** The short line under the name: how many pads use it, and the original name or hash start. */
  hint: string;
  onCommit: (newName: string) => void;
  /** Selects the row — on focus and on click of the name (Tab access, owner rule 2026-10-02). */
  onSelect: () => void;
}

function RenameField({ name, hint, onCommit, onSelect }: RenameFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft if name changes externally (e.g. from another session's signal update)
  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  // Auto-focus on edit entry
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onCommit(trimmed);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div class="sb-flex-min">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          class="sb-audio-row-rename"
          aria-label="File name"
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
        />
        <div class="sb-hint-text">{hint}</div>
      </div>
    );
  }

  // A real button — reached with Tab; focusing it selects the row, a click renames
  return (
    <button
      type="button"
      class="sb-row-button"
      title="Click to rename"
      aria-label={`Rename ${name}`}
      onFocus={onSelect}
      onClick={() => {
        onSelect();
        setEditing(true);
      }}
    >
      <span class="sb-flex-min sb-col">
        <span class="sb-audio-row-name">{name}</span>
        <span class="sb-hint-text">{hint}</span>
      </span>
    </button>
  );
}

// ── AudioRow ─────────────────────────────────────────────────────────────────

/**
 * Shows one audio file of the library: name (tap to rename), how many pads play it, waveform,
 * duration, size and a delete button — one tap, the file goes to the trash and the toast offers
 * UNDO (ADR-0087). With `trash` it is the row of a deleted file: days left, RESTORE, delete for good.
 */
export function AudioRow({
  meta,
  selected,
  onSelect,
  uses = 0,
  onDelete,
  onRename,
  trash,
  preview,
  choose,
}: AudioRowProps) {
  const usedIn = uses === 0 ? '' : uses === 1 ? 'in 1 pad · ' : `in ${uses} pads · `;
  // A renamed file shows the name it came with (V1: "← original.mp3"); otherwise the hash start
  const renamed = meta.originalName !== undefined && meta.originalName !== meta.name;
  const origin = renamed ? `← ${meta.originalName}` : `${meta.id.slice(0, 8)}…`;
  // A phone has room for name, duration and delete (Material 3 list item: headline with supporting
  // text, one trailing element); the waveform and the size stay in the wide frame (ADR-0082)
  const narrow = narrowWindow.value;

  return (
    <div
      class={'sb-audio-row' + (narrow ? ' is-narrow' : '')}
      style={{
        background: selected ? 'var(--top)' : 'var(--raised)',
        borderLeft: selected ? '2px solid var(--gold)' : '2px solid transparent',
      }}
    >
      {/* Col 1: ▶ / ■ (the preview) or the type icon, name + a hint — the name is the row's
          button (select, rename); in select mode the whole cell is the checkbox's label */}
      {choose ? (
        <label class="sb-check-row sb-flex-min">
          <input type="checkbox" checked={choose.chosen} onChange={choose.onToggle} />
          <span class="sb-flex-min sb-col">
            <span class="sb-audio-row-name">{meta.name}</span>
            <span class="sb-hint-text">{`${usedIn}${origin}`}</span>
          </span>
        </label>
      ) : (
        <div class="sb-row">
          {preview ? (
            <button
              class="sb-btn sb-btn-ghost sb-btn-icon"
              aria-label={preview.playing ? `Stop ${meta.name}` : `Play ${meta.name}`}
              onClick={(e) => {
                e.stopPropagation();
                preview.onToggle();
              }}
            >
              <UiIcon name={preview.playing ? 'stop' : 'play'} size={14} color="var(--gold)" />
            </button>
          ) : (
            <UiIcon name="play" size={14} color="var(--gold)" />
          )}
          {trash ? (
            <span class="sb-flex-min sb-col">
              <span class="sb-audio-row-name">{meta.name}</span>
              <span class="sb-hint-text">
                {trash.daysLeft === 1 ? '1 day left' : `${trash.daysLeft} days left`}
              </span>
            </span>
          ) : (
            <RenameField
              name={meta.name}
              hint={`${usedIn}${origin}`}
              onCommit={(name) => onRename?.(name)}
              onSelect={onSelect}
            />
          )}
        </div>
      )}

      {/* Col 2: waveform thumbnail (wide frame only) */}
      {!narrow && <Waveform peaks={meta.peaks} height={28} dim={!selected} />}

      {/* Col 3: duration — on a phone a file in the trash shows RESTORE here instead */}
      {!(narrow && trash) && (
        <span class="sb-audio-col-duration">{formatDuration(meta.duration)}</span>
      )}

      {/* Col 4: file size (wide frame only) — in the trash, RESTORE */}
      {trash ? (
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          aria-label={`Restore ${meta.name}`}
          onClick={trash.onRestore}
        >
          RESTORE
        </button>
      ) : (
        !narrow && <span class="sb-audio-col-size">{formatBytes(meta.size)}</span>
      )}

      {/* Col 5: delete — to the trash in one tap; in the trash, for good after the question; in
          select mode the selection bar deletes, the cell stays empty so the columns keep their place */}
      {choose ? (
        <span />
      ) : (
        <button
          class="sb-audio-row-delete-btn"
          title={trash ? 'Delete for good' : 'Delete'}
          aria-label={trash ? `Delete ${meta.name} for good` : `Delete ${meta.name}`}
          onClick={(e) => {
            e.stopPropagation();
            if (trash) trash.onDeleteForGood();
            else onDelete?.();
          }}
        >
          <UiIcon name="delete" size={12} />
        </button>
      )}
    </div>
  );
}
