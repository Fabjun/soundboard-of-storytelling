/**
 * @fileoverview BackupImportPanel — import a V1 or V3 backup file (Slice 10, D2 / D5, ADR-0061)
 *
 * Reading → summary for confirmation (import rules) → import with progress → result.
 * Minimal first version on the board list; look and place follow with the layout (Slice 13).
 */

import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { planImport, runImport, type ImportPlan, type ImportResult } from '../lib/backupImport';
import { BackupError, type BackupErrorKind } from '../lib/backupReader';

type Step =
  | { kind: 'reading' }
  | { kind: 'confirm'; plan: ImportPlan }
  | { kind: 'importing'; plan: ImportPlan; done: number }
  | { kind: 'done'; result: ImportResult }
  | { kind: 'error'; message: string };

const ERROR_TEXT: Record<BackupErrorKind, string> = {
  damaged:
    'This file is damaged or not a complete backup. Import the backup file exactly as it was saved.',
  'not-a-backup':
    'This file is not a Soundboard backup. Choose a file saved by EXPORT or by the old app (V1).',
  'unsupported-zip':
    'This ZIP file was changed after the export — packed again, encrypted or split. Import the file exactly as EXPORT saved it.',
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The words for a failed import — plain, with a next step (Nielsen 9); the cause to the console. */
function errorText(e: unknown): string {
  if (e instanceof BackupError) return ERROR_TEXT[e.kind];
  console.error('Import failed:', e);
  return 'The import stopped with an unexpected error. Reload the app and look at the board list; if the board is missing, import the same file again.';
}

/** What the import dropped or could not resolve, one line each (empty when nothing). */
function noteLines(r: ImportResult): string[] {
  const n = r.notes;
  return [
    n.missingFiles && `${plural(n.missingFiles, 'pad file')} not found — left out of their pads.`,
    n.comboPadOptions &&
      `${plural(n.comboPadOptions, 'combo step')} had per-pad volume or fade — not imported yet.`,
    n.missingStepPads && `${plural(n.missingStepPads, 'combo reference')} pointed at no pad.`,
    n.unknownModes && `${plural(n.unknownModes, 'pad')} had an unknown type — imported as Single.`,
    n.cycleRefs &&
      `${plural(n.cycleRefs, 'combo step reference')} removed — the combo would have started itself.`,
    n.customIcons &&
      `${plural(n.customIcons, 'uploaded pad icon')} not imported — the app has no own icons yet.`,
    n.unknownIcons &&
      `${plural(n.unknownIcons, 'pad icon')} not in the icon collection — left out; choose another in the pad editor.`,
    r.boardsSkipped && `${plural(r.boardsSkipped, 'board')} could not be read.`,
    ...r.audioFailed,
  ].filter((l): l is string => typeof l === 'string');
}

/**
 * Imports the chosen backup `file`: reads it for a summary, imports on confirmation with
 * progress, then lists what was added and what could not be taken over.
 */
export function BackupImportPanel({
  file,
  onClose,
}: {
  file: File;
  onClose: () => void;
}): JSX.Element {
  const [step, setStep] = useState<Step>({ kind: 'reading' });

  // Pass 1 whenever a new file is chosen
  useEffect(() => {
    let canceled = false;
    setStep({ kind: 'reading' });
    planImport(file)
      .then((plan) => !canceled && setStep({ kind: 'confirm', plan }))
      .catch((e: unknown) => !canceled && setStep({ kind: 'error', message: errorText(e) }));
    return () => {
      canceled = true;
    };
  }, [file]);

  async function startImport(plan: ImportPlan) {
    setStep({ kind: 'importing', plan, done: 0 });
    try {
      const result = await runImport(file, plan, (done) =>
        setStep({ kind: 'importing', plan, done }),
      );
      setStep({ kind: 'done', result });
    } catch (e) {
      setStep({ kind: 'error', message: errorText(e) });
    }
  }

  return (
    <div class="sb-card" data-testid="backup-import-panel">
      {step.kind === 'reading' && (
        <div class="sb-caption" data-testid="backup-import-panel-status-text">
          Reading {file.name}…
        </div>
      )}

      {step.kind === 'confirm' && (
        <>
          <div class="sb-caption" data-testid="backup-import-panel-summary-text">
            {step.plan.kind === 'v1' ? 'Backup from the old app (V1). ' : ''}
            {plural(step.plan.boards.length, 'board')}, {plural(step.plan.pads, 'pad')},{' '}
            {plural(step.plan.audio, 'audio file')} — {step.plan.audioPresent} already in the
            library. Nothing you have is changed; boards are added as new boards.
            {step.plan.otherEntries > 0 &&
              ` ${plural(step.plan.otherEntries, 'other entry')} (pad templates, images) not imported.`}
            {step.plan.kind === 'v1' && ' Settings of the old app are not imported.'}
          </div>
          <div class="sb-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-primary"
              data-testid="backup-import-panel-confirm-button"
              onClick={() => void startImport(step.plan)}
            >
              IMPORT
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              data-testid="backup-import-panel-cancel-button"
              onClick={onClose}
            >
              CANCEL
            </button>
          </div>
        </>
      )}

      {step.kind === 'importing' && (
        <div class="sb-caption" data-testid="backup-import-panel-status-text">
          Importing audio {step.done} of {step.plan.audio}… Keep the app open.
        </div>
      )}

      {step.kind === 'done' && (
        <>
          <div class="sb-caption" data-testid="backup-import-panel-result-text">
            Done: {plural(step.result.audioAdded, 'audio file')} added, {step.result.audioSkipped}{' '}
            already there, {plural(step.result.boardsAdded, 'board')} added.
          </div>
          {noteLines(step.result).map((line) => (
            <div key={line} class="sb-caption">
              {line}
            </div>
          ))}
          <button
            class="sb-btn sb-btn-sm sb-btn-primary"
            data-testid="backup-import-panel-close-button"
            onClick={onClose}
          >
            OK
          </button>
        </>
      )}

      {step.kind === 'error' && (
        <>
          <div class="sb-caption" data-testid="backup-import-panel-error-text">
            {step.message}
          </div>
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost"
            data-testid="backup-import-panel-close-button"
            onClick={onClose}
          >
            CLOSE
          </button>
        </>
      )}
    </div>
  );
}
