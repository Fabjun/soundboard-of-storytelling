/**
 * @fileoverview FolderMoveDialog — where MOVE takes the chosen library files (Slice 16c, L2 / L3)
 *
 * The question of the one dialog the app asks (ConfirmDialog, ADR-0074): a choice of the existing
 * folders, a new folder with its name, or no folder — radio buttons, as a choice of one among a few
 * (WAI-ARIA APG, Radio Group). A new folder is the choice when there is none yet. A new name that
 * matches a folder except for case joins it (ADR-0088).
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { ConfirmDialog } from './ConfirmDialog';
import { cleanFolderName, FOLDER_NAME_MAX } from '../state/libraryFolders';

/** The radio value of "a new folder"; folder names are never empty, so it cannot clash. */
const NEW = '';

/** Asks where `count` files go; `onMove` gets the folder, or null for no folder. */
export function FolderMoveDialog({
  count,
  folders,
  onMove,
  onCancel,
}: {
  count: number;
  /** The existing folders, in the order shown. */
  folders: readonly string[];
  onMove: (folder: string | null) => void;
  onCancel: () => void;
}): JSX.Element {
  const [target, setTarget] = useState<string | null>(folders[0] ?? NEW);
  const [name, setName] = useState('');
  const newName = cleanFolderName(name, folders);
  const what = count === 1 ? '1 file' : `${count} files`;

  function move() {
    if (target !== NEW) onMove(target);
    else if (newName) onMove(newName);
  }

  return (
    <ConfirmDialog
      title={`Move ${what} to which folder?`}
      confirmLabel="MOVE"
      onConfirm={move}
      onCancel={onCancel}
    >
      <div class="sb-dialog-section sb-col" role="radiogroup" aria-label="Folder">
        {folders.map((f) => (
          <label key={f} class="sb-check-row">
            <input
              type="radio"
              name="move-target"
              checked={target === f}
              onChange={() => setTarget(f)}
            />
            <span class="sb-flex-trunc">{f}</span>
          </label>
        ))}
        <label class="sb-check-row">
          <input
            type="radio"
            name="move-target"
            checked={target === NEW}
            onChange={() => setTarget(NEW)}
          />
          <span>New folder</span>
        </label>
        {target === NEW && (
          <>
            <input
              class="sb-text-input"
              aria-label="Name of the new folder"
              maxLength={FOLDER_NAME_MAX}
              value={name}
              onInput={(e) => setName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') move();
              }}
            />
            {!newName && <span class="sb-caption">Type a name for the new folder.</span>}
          </>
        )}
        <label class="sb-check-row">
          <input
            type="radio"
            name="move-target"
            checked={target === null}
            onChange={() => setTarget(null)}
          />
          <span>No folder</span>
        </label>
      </div>
    </ConfirmDialog>
  );
}
