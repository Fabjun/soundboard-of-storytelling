/**
 * @fileoverview PadTemplatesTab — the library's PADS tab: saved pad templates (Slice 16d,
 * docs/product/features/library.md L6, ADR-0090)
 *
 * Each template shows its name, type, number of files and when it was saved, and says when files it
 * needs are no longer in the library. ADD TO BOARD asks where (TemplateAddDialog); a tap on the name
 * renames it in place; delete in one tap with UNDO in the toast (a template holds no audio).
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { UiIcon } from './UiIcon';
import { TemplateAddDialog } from './TemplateAddDialog';
import { boards } from '../state/store';
import {
  addTemplateToBoard,
  deleteTemplate,
  missingFiles,
  padTemplates,
  renameTemplate,
  restoreTemplate,
} from '../state/padTemplates';
import { announceUndo } from '../state/undoNotice';
import type { PadTemplate } from '../types';

const TYPE_LABEL = { single: 'SINGLE', loop: 'LOOP' } as const;

/** "1 file", "3 files". */
const filesText = (n: number) => (n === 1 ? '1 file' : `${n} files`);

function TemplateRow({
  template,
  onAdd,
}: {
  template: PadTemplate;
  onAdd: () => void;
}): JSX.Element {
  const [renaming, setRenaming] = useState<string | null>(null);
  const missing = missingFiles(template);

  function commit() {
    if (renaming !== null) void renameTemplate(template.id, renaming);
    setRenaming(null);
  }

  async function remove() {
    const gone = await deleteTemplate(template.id);
    if (gone) announceUndo(`Deleted template '${gone.name}'`, () => void restoreTemplate(gone));
  }

  return (
    <div class="sb-audio-row is-narrow">
      <div class="sb-flex-min sb-col">
        {renaming === null ? (
          <button
            type="button"
            class="sb-row-button"
            title="Click to rename"
            aria-label={`Rename template ${template.name}`}
            onClick={() => setRenaming(template.name)}
          >
            <span class="sb-audio-row-name">{template.name}</span>
          </button>
        ) : (
          <input
            class="sb-audio-row-rename"
            aria-label="Template name"
            value={renaming}
            ref={(el) => el?.focus()}
            onInput={(e) => setRenaming(e.currentTarget.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setRenaming(null);
            }}
          />
        )}
        <span class="sb-hint-text">
          {TYPE_LABEL[template.pad.type]} · {filesText(template.pad.files.length)}
          {missing > 0 && ` · ${filesText(missing)} no longer in the library`}
        </span>
      </div>
      <button
        class="sb-btn sb-btn-sm sb-btn-ghost"
        aria-label={`Add ${template.name} to a board`}
        onClick={onAdd}
      >
        ADD
      </button>
      <button
        class="sb-audio-row-delete-btn"
        title="Delete"
        aria-label={`Delete template ${template.name}`}
        onClick={() => void remove()}
      >
        <UiIcon name="delete" size={12} />
      </button>
    </div>
  );
}

/** Lists the saved pad templates; ADD puts a new pad from one on a board. */
export function PadTemplatesTab(): JSX.Element {
  const templates = padTemplates.value;
  const [adding, setAdding] = useState<PadTemplate | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function add(boardId: string, deckId: string | null) {
    const template = adding;
    setAdding(null);
    if (!template) return;
    const id = await addTemplateToBoard(template.id, boardId, deckId);
    const board = boards.value.find((b) => b.id === boardId);
    setNote(
      id
        ? `Added '${template.name}' to ${board?.name ?? 'the board'}.`
        : `'${template.name}' could not be added — try again.`,
    );
  }

  return (
    <div class="sb-col sb-flex-1">
      <div class="sb-list-bar">
        <span class="sb-caption">
          A template keeps a pad's settings and which files it plays; make one with SAVE AS TEMPLATE
          in the PAD editor. The files stay in the library.
        </span>
      </div>
      {note && (
        <div class="sb-list-bar" role="status">
          <span class="sb-caption">{note}</span>
        </div>
      )}
      <div class="sb-item-list">
        {templates.length === 0 ? (
          <div class="sb-screen-empty">
            <UiIcon name="board" size={32} color="var(--border)" />
            No templates yet.
          </div>
        ) : (
          templates.map((t) => <TemplateRow key={t.id} template={t} onAdd={() => setAdding(t)} />)
        )}
      </div>
      {adding && (
        <TemplateAddDialog
          name={adding.name}
          boards={boards.value}
          onAdd={(boardId, deckId) => void add(boardId, deckId)}
          onCancel={() => setAdding(null)}
        />
      )}
    </div>
  );
}
