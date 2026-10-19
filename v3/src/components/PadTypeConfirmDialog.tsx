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
 * The question itself is the app's ConfirmDialog; on a narrow window it is a sheet from the bottom.
 */

import type { JSX } from 'preact';
import type { PadType } from '../types';
import { padMigrationMatrix, type MigrationVerdict } from '../lib/padUtils';
import { narrowWindow } from '../state/windowClass';
import { ConfirmDialog } from './ConfirmDialog';

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
  return (
    <ConfirmDialog
      title="Change pad type?"
      confirmLabel="SWITCH"
      danger={verdict === 'reset'}
      onConfirm={onConfirm}
      onCancel={onCancel}
      sheet={narrowWindow.value}
    >
      <div class="sb-dialog-section sb-type-change-row">
        <span class="sb-type-change-from">{TYPE_LABELS[fromType]}</span>
        <span class="sb-type-change-arrow">→</span>
        <span>{TYPE_LABELS[toType]}</span>
        <span class="sb-verdict-pill" style={{ background: VERDICT_COLORS[verdict] }}>
          {VERDICT_LABELS[verdict]}
        </span>
      </div>

      {keeps.length > 0 && <FieldList label="KEEPS" items={keeps} color="var(--mode-setup)" />}
      {migrates.length > 0 && <FieldList label="MIGRATES" items={migrates} color="var(--gold)" />}
      {drops.length > 0 && <FieldList label="DROPS" items={drops} color="var(--blood-bright)" />}

      {verdict === 'reset' && (
        <div class="sb-dialog-danger-note">
          Audio source and settings will be cleared. Reconfigure the pad after switching.
        </div>
      )}
    </ConfirmDialog>
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
