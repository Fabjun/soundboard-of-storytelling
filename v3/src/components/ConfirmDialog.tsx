/**
 * @fileoverview ConfirmDialog — the one question the app asks before it does what it was told
 *
 * A modal alert dialog (W3C WAI-ARIA APG, Alert Dialog pattern; ADR-0074 through
 * src/lib/modalDialog.ts): a title that says what happens, its details, and two buttons — the safe
 * answer first, with the focus, and the action named after what it does (Apple HIG alerts; NN/g,
 * confirmation dialogs: "Delete", not "Yes"). Escape and the backdrop give the safe answer. A
 * delete that cannot be undone is asked here, never by a second tap on the same button (owner
 * decision 2026-10-20: a button in a fixed place takes an accidental double tap).
 */

import { useRef } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { useEscapeKey } from '../lib/escapeKey';
import { useModalDialog } from '../lib/modalDialog';

/** What the question says and what each answer does. */
export interface ConfirmDialogProps {
  /** The question, e.g. "Delete 'Rain' for good?" — also the dialog's accessible name. */
  title: string;
  /** The details under the title; they describe the dialog to screen readers. */
  children?: ComponentChildren;
  /** The safe answer (default CANCEL); it has the focus when the dialog opens. */
  cancelLabel?: string;
  /** The action, named after what it does (DELETE, DISCARD CHANGES, SWITCH). */
  confirmLabel: string;
  /** Whether the action destroys something — its button takes the danger look. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Shown as a sheet from the bottom (narrow windows) instead of a box in the middle. */
  sheet?: boolean;
  /** The element up to which the page is inert (default: the page body). */
  root?: () => Element;
  /** The element that gets the focus back on close (default: the one focused when it opened). */
  returnFocus?: () => HTMLElement | null;
}

/** Asks a question with a safe answer and an action; render it only while it is asked. */
export function ConfirmDialog({
  title,
  children,
  cancelLabel = 'CANCEL',
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
  sheet = false,
  root,
  returnFocus,
}: ConfirmDialogProps): JSX.Element {
  const dialog = useRef<HTMLDivElement>(null);
  useEscapeKey(onCancel);
  useModalDialog(dialog, { root, returnFocus });
  // One question at a time (it is modal), so fixed ids are unique
  const titleId = 'confirm-dialog-title';
  const textId = 'confirm-dialog-text';
  return (
    <>
      <div
        class={sheet ? 'sb-creation-sheet-backdrop' : 'sb-type-confirm-backdrop'}
        aria-hidden="true"
        onClick={onCancel}
      />
      <div
        ref={dialog}
        class={sheet ? 'sb-creation-sheet' : 'sb-type-confirm sb-type-confirm-centered'}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children === undefined ? undefined : textId}
        data-testid="confirm-dialog-region"
      >
        <div class="sb-dialog-header">
          <div class="sb-dialog-title" id={titleId}>
            {title}
          </div>
        </div>
        {children !== undefined && <div id={textId}>{children}</div>}
        <div class="sb-dialog-actions">
          <button
            class="sb-btn sb-btn-sm sb-btn-primary sb-dialog-action-btn"
            data-testid="confirm-dialog-cancel-button"
            data-autofocus
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            class={`sb-btn sb-btn-sm ${danger ? 'sb-btn-danger' : 'sb-btn-primary'} sb-dialog-action-btn`}
            data-testid="confirm-dialog-confirm-button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
