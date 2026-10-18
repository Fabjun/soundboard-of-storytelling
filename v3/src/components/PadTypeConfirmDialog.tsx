/**
 * @fileoverview PadTypeConfirmDialog — type-change confirmation per v23 Option C policy
 *
 * Source: design-sources/2026-05-25/v23-pad-type-change.jsx
 *
 * Shows verdict pill + KEEPS / MIGRATES / DROPS sections.
 * RESET cases get a danger-tinted SWITCH button.
 * Single tap CANCEL → type snaps back (caller handles).
 * Single tap SWITCH → onConfirm() called, caller applies applyTypeChange().
 *
 * Mobile: renders as a bottom sheet; desktop: centered popover.
 */

import { useRef } from 'preact/hooks';
import { useEscapeKey } from '../lib/escapeKey';
import { useModalDialog } from '../lib/modalDialog';
import type { JSX } from 'preact';
import type { PadType } from '../types';
import { padMigrationMatrix, type MigrationVerdict } from '../lib/padUtils';
import { narrowWindow } from '../state/windowClass';

interface PadTypeConfirmDialogProps {
  fromType: PadType;
  toType: PadType;
  onConfirm: () => void;
  onCancel: () => void;
}

const VERDICT_LABELS: Record<MigrationVerdict, string> = {
  add: 'ADDS',
  reset: 'RESET',
};

const VERDICT_COLORS: Record<MigrationVerdict, string> = {
  add: 'var(--mode-setup)',
  reset: 'var(--blood-bright)',
};

const TYPE_LABELS: Record<PadType, string> = {
  single: 'SINGLE',
  loop: 'LOOP',
  combo: 'COMBO',
};

/**
 * Asks before a pad changes type, showing which settings the change keeps, migrates and drops;
 * SWITCH confirms, CANCEL keeps the old type.
 */
export function PadTypeConfirmDialog({
  fromType,
  toType,
  onConfirm,
  onCancel,
}: PadTypeConfirmDialogProps): JSX.Element {
  const { verdict, keeps, migrates, drops } = padMigrationMatrix(fromType, toType);
  const isDangerous = verdict === 'reset';

  // A modal alert dialog (W3C APG, ADR-0074): the editor behind is inert, the focus starts on the
  // safe answer — CANCEL — and goes back to the type control that asked
  const dialog = useRef<HTMLDivElement>(null);
  useEscapeKey(onCancel);
  useModalDialog(dialog);

  const isMobile = narrowWindow.value;

  const dialogContent = (
    <div
      ref={dialog}
      class={isMobile ? 'sb-creation-sheet' : 'sb-type-confirm sb-type-confirm-centered'}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pad-type-confirm-dialog-title"
      data-testid="pad-type-confirm-dialog"
    >
      {/* Header */}
      <div class="sb-dialog-header">
        <div class="sb-dialog-title" id="pad-type-confirm-dialog-title">
          Change pad type?
        </div>
        <div class="sb-type-change-row">
          <span class="sb-type-change-from">{TYPE_LABELS[fromType]}</span>
          <span class="sb-type-change-arrow">→</span>
          <span>{TYPE_LABELS[toType]}</span>
          <span class="sb-verdict-pill" style={{ background: VERDICT_COLORS[verdict] }}>
            {VERDICT_LABELS[verdict]}
          </span>
        </div>
      </div>

      {/* Field lists */}
      {keeps.length > 0 && <FieldList label="KEEPS" items={keeps} color="var(--mode-setup)" />}
      {migrates.length > 0 && <FieldList label="MIGRATES" items={migrates} color="var(--gold)" />}
      {drops.length > 0 && <FieldList label="DROPS" items={drops} color="var(--blood-bright)" />}

      {/* Reset warning */}
      {verdict === 'reset' && (
        <div class="sb-dialog-danger-note">
          Audio source and settings will be cleared. Reconfigure the pad after switching.
        </div>
      )}

      {/* Actions */}
      <div class="sb-dialog-actions">
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost sb-dialog-action-btn"
          data-testid="pad-type-confirm-dialog-cancel-button"
          onClick={onCancel}
          data-autofocus
        >
          CANCEL
        </button>
        <button
          class={`sb-btn sb-btn-sm ${isDangerous ? 'sb-btn-danger' : 'sb-btn-primary'} sb-dialog-action-btn`}
          data-testid="pad-type-confirm-dialog-switch-button"
          onClick={onConfirm}
        >
          SWITCH
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        class={isMobile ? 'sb-creation-sheet-backdrop' : 'sb-type-confirm-backdrop'}
        onClick={onCancel}
        aria-hidden="true"
      />
      {dialogContent}
    </>
  );
}

// ── FieldList ──────────────────────────────────────────────────────────────

function FieldList({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: string;
}): JSX.Element {
  return (
    <div class="sb-dialog-section">
      <div class="sb-field-section-label" style={{ color }}>
        {label}
      </div>
      <div class="sb-row-wrap">
        {items.map((item) => (
          <span key={item} class="sb-field-chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
