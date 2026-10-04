/**
 * @fileoverview BackupExportPanel — save everything into one backup file (Slice 10, D1 / D3, ADR-0061)
 *
 * Two steps: building the file takes a while, and the share sheet needs a fresh tap (iOS), so the
 * file is built first and handed over on a second tap (SAVE). Minimal first version on the board
 * list; look and place follow with the layout (Slice 13).
 */

import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { backupFileName, buildBackup, saveBackupFile } from '../lib/backupExport';
import { formatBytes } from '../lib/upload';
import { setLastBackup } from '../state/prefs';

type Step =
  | { kind: 'building'; done: number; total: number }
  | { kind: 'ready'; blob: Blob; name: string }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

/**
 * Builds the backup file when it opens, then hands it over on SAVE (share sheet or download) and
 * records the time of the backup.
 */
export function BackupExportPanel({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  /** Called after the file was handed over — the last-backup time is updated (D3). */
  onSaved: () => void;
}): JSX.Element {
  const [step, setStep] = useState<Step>({ kind: 'building', done: 0, total: 0 });

  useEffect(() => {
    let canceled = false;
    buildBackup((done, total) => !canceled && setStep({ kind: 'building', done, total }))
      .then(
        (blob) => !canceled && setStep({ kind: 'ready', blob, name: backupFileName(new Date()) }),
      )
      .catch(
        (e: unknown) =>
          !canceled && setStep({ kind: 'error', message: `Backup failed: ${String(e)}` }),
      );
    return () => {
      canceled = true;
    };
  }, []);

  async function save(blob: Blob, name: string) {
    if (await saveBackupFile(blob, name)) {
      setLastBackup(Date.now());
      onSaved();
      setStep({ kind: 'saved' });
    }
  }

  return (
    <div class="sb-card" data-testid="backup-export-panel">
      {step.kind === 'building' && (
        <div class="sb-caption" data-testid="backup-export-panel-status-text">
          Preparing backup… {step.total > 0 && `${step.done} of ${step.total} audio files`}
        </div>
      )}

      {step.kind === 'ready' && (
        <>
          <div class="sb-caption" data-testid="backup-export-panel-ready-text">
            Backup ready: {step.name} ({formatBytes(step.blob.size)}). Save it somewhere outside
            this browser — e.g. Files on the iPhone.
          </div>
          <div class="sb-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-primary"
              data-testid="backup-export-panel-save-button"
              onClick={() => void save(step.blob, step.name)}
            >
              SAVE
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              data-testid="backup-export-panel-cancel-button"
              onClick={onClose}
            >
              CANCEL
            </button>
          </div>
        </>
      )}

      {step.kind === 'saved' && (
        <>
          <div class="sb-caption" data-testid="backup-export-panel-saved-text">
            Backup saved.
          </div>
          <button
            class="sb-btn sb-btn-sm sb-btn-primary"
            data-testid="backup-export-panel-close-button"
            onClick={onClose}
          >
            OK
          </button>
        </>
      )}

      {step.kind === 'error' && (
        <>
          <div class="sb-caption" data-testid="backup-export-panel-error-text">
            {step.message}
          </div>
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost"
            data-testid="backup-export-panel-close-button"
            onClick={onClose}
          >
            CLOSE
          </button>
        </>
      )}
    </div>
  );
}
