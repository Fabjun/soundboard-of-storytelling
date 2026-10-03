/**
 * @fileoverview AudioRow — single row in the Library audio list
 *
 * Shows: type icon | name (renameable) + filename | waveform | duration | size | delete
 */

import { useRef, useState, useEffect } from 'preact/hooks';
import { PixelIcon } from './PixelIcon';
import { Waveform } from './Waveform';
import { formatBytes, formatDuration } from '../lib/upload';
import type { LibraryItemMeta } from '../types';

interface AudioRowProps {
  meta: LibraryItemMeta;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

// ---------------------------------------------------------------------------
// RenameField — inline <input> toggle (no contentEditable — iOS Safari issues)
// ---------------------------------------------------------------------------

interface RenameFieldProps {
  name: string;
  onCommit: (newName: string) => void;
}

function RenameField({ name, onCommit }: RenameFieldProps) {
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
      <input
        ref={inputRef}
        type="text"
        value={draft}
        class="sb-audio-row-rename"
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
    );
  }

  return (
    <span
      title="Click to rename"
      class="sb-audio-row-name"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AudioRow
// ---------------------------------------------------------------------------

/**
 * Shows one audio file of the library: name (tap to rename), waveform, duration, size and a
 * delete button that needs two taps.
 */
export function AudioRow({ meta, selected, onSelect, onDelete, onRename }: AudioRowProps) {
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');

  function handleDeleteClick(e: MouseEvent) {
    e.stopPropagation();
    if (deleteStep === 'idle') {
      setDeleteStep('confirm');
    } else {
      onDelete();
    }
  }

  function resetDelete() {
    setDeleteStep('idle');
  }

  return (
    <div
      class="sb-audio-row"
      onClick={onSelect}
      onMouseLeave={resetDelete}
      style={{
        background: selected ? 'var(--top)' : 'var(--raised)',
        borderLeft: selected ? '2px solid var(--gold)' : '2px solid transparent',
      }}
    >
      {/* Col 1: type icon + name + filename */}
      <div class="sb-row">
        <PixelIcon name="play" size={14} color="var(--gold)" />
        <div class="sb-flex-min">
          <RenameField name={meta.name} onCommit={onRename} />
          <div class="sb-hint-text">{meta.id.slice(0, 8)}…</div>
        </div>
      </div>

      {/* Col 2: waveform thumbnail */}
      <Waveform peaks={meta.peaks} height={28} dim={!selected} />

      {/* Col 3: duration */}
      <span class="sb-audio-col-duration">{formatDuration(meta.duration)}</span>

      {/* Col 4: file size */}
      <span class="sb-audio-col-size">{formatBytes(meta.size)}</span>

      {/* Col 5: delete (2-tap confirm) */}
      <button
        class="sb-audio-row-delete-btn"
        title={deleteStep === 'idle' ? 'Delete' : 'Confirm delete'}
        onClick={handleDeleteClick}
        onBlur={resetDelete}
        style={{
          border: deleteStep === 'confirm' ? '1px solid var(--blood)' : 'none',
          color: deleteStep === 'confirm' ? 'var(--blood-bright)' : 'var(--text-mute)',
        }}
      >
        <PixelIcon name="skull" size={12} />
      </button>
    </div>
  );
}
