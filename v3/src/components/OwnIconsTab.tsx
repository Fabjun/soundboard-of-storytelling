/**
 * @fileoverview OwnIconsTab — the library's ICONS tab: the user's own SVG pad icons (Slice 16e,
 * docs/product/features/library.md L7, ADR-0092)
 *
 * ADD ICONS takes SVG files; each is checked (src/lib/svgCheck.ts) and drawn only as an image. The
 * tab says in plain words what came in and why a file was refused (Nielsen heuristic 9). Each icon
 * shows its picture, name and size; delete in one tap with UNDO in the toast, as library files.
 * The icons are chosen for a pad in the PAD editor's icon picker.
 */

import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { UiIcon } from './UiIcon';
import { OwnIconImage } from './PadIcons';
import { formatBytes } from '../lib/upload';
import {
  addIconsText,
  addOwnIconFiles,
  deleteOwnIcon,
  ownIcons,
  restoreOwnIcon,
} from '../state/ownIcons';
import { announceUndo } from '../state/undoNotice';
import type { OwnIconMeta } from '../types';

function IconRow({ icon }: { icon: OwnIconMeta }): JSX.Element {
  async function remove() {
    const gone = await deleteOwnIcon(icon.id);
    if (gone) announceUndo(`Deleted icon '${gone.name}'`, () => void restoreOwnIcon(gone));
  }

  return (
    <div class="sb-audio-row is-narrow">
      <div class="sb-row sb-flex-min">
        <span class="sb-own-icon-thumb">
          <OwnIconImage id={icon.id} />
        </span>
        <span class="sb-flex-min sb-col">
          <span class="sb-audio-row-name">{icon.name}</span>
          <span class="sb-hint-text">{formatBytes(icon.size)}</span>
        </span>
      </div>
      <span />
      <button
        class="sb-audio-row-delete-btn"
        title="Delete"
        aria-label={`Delete icon ${icon.name}`}
        onClick={() => void remove()}
      >
        <UiIcon name="delete" size={12} />
      </button>
    </div>
  );
}

/** Lists the own icons; ADD ICONS adds SVG files. */
export function OwnIconsTab(): JSX.Element {
  const icons = ownIcons.value;
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  async function add(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const files = Array.from(el.files ?? []);
    el.value = ''; // the same file can be chosen again
    if (files.length === 0) return;
    setNote(addIconsText(await addOwnIconFiles(files)));
  }

  return (
    <div class="sb-col sb-flex-1">
      <input
        ref={input}
        type="file"
        multiple
        accept=".svg,image/svg+xml"
        class="sb-hidden"
        data-testid="own-icons-tab-file-input"
        onChange={(e) => void add(e)}
      />
      <div class="sb-list-bar">
        <span class="sb-caption">
          Your own icons, from SVG files up to 100 KB; choose them for a pad in the PAD editor. They
          are shown as pictures only, so nothing inside a file runs.
        </span>
        <button class="sb-btn sb-btn-sm" onClick={() => input.current?.click()}>
          ADD ICONS
        </button>
      </div>
      {note && (
        <div class="sb-list-bar" role="status">
          <span class="sb-caption">{note}</span>
        </div>
      )}
      <div class="sb-item-list">
        {icons.length === 0 ? (
          <div class="sb-screen-empty">
            <UiIcon name="library" size={32} color="var(--border)" />
            No own icons yet.
          </div>
        ) : (
          icons.map((i) => <IconRow key={i.id} icon={i} />)
        )}
      </div>
    </div>
  );
}
