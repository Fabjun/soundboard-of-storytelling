/**
 * @fileoverview ComboStepsEditor — the steps of a combo in the PAD editor (Slice 11, minimal first version,
 * docs/product/README.md#combos--decided)
 *
 * Per step: the pads that start together, the wait until the next step, "stop everything first".
 * Controlled: the PAD editor owns the steps and saves them with the rest of the pad (one writer).
 * Only pads that do not lead back to this combo are offered (no cycles, comboModel). A step or a
 * pad of a step is removed with one tap — the editor's undo takes it back (CLAUDE.md UI rules).
 * A Loop set to ∞ is marked BG: it plays in the background and stops when the combo ends (V1 showed
 * the same mark; owner decision 2026-11-22).
 */

import type { JSX } from 'preact';
import { useId } from 'preact/hooks';
import type { Board, ComboStep } from '../types';
import {
  addPadToStep,
  addStep,
  canStartInCombo,
  playsInBackground,
  removePadFromStep,
  removeStep,
  setStepDuration,
  setStepStopAll,
} from '../lib/comboModel';
import { poolByName } from '../lib/boardModel';
import { UiIcon } from './UiIcon';
import { NumberField } from './NumberField';

/**
 * Edits the steps of the combo `comboId`: each step's pads, wait and "stop everything first".
 * Controlled — every change goes to `onChange`; only pads that cannot start this combo are
 * offered.
 */
export function ComboStepsEditor({
  comboId,
  steps,
  board,
  onChange,
}: {
  comboId: string;
  steps: ComboStep[];
  /** The latest board — names of the pads and the cycle check. */
  board: Board;
  onChange: (steps: ComboStep[]) => void;
}): JSX.Element {
  const names = new Map(board.pads.map((p) => [p.id, p.name || '—']));
  const background = new Set(board.pads.filter(playsInBackground).map((p) => p.id));
  const pool = poolByName(board);
  // Each step is a group named by its STEP N caption (WCAG ARIA17): its wait and its "stop
  // everything first" are told apart from those of the other steps
  const stepLabelId = `${useId()}-step`;

  return (
    <div class="sb-inspector-section" data-testid="combo-steps-editor">
      <div class="sb-section-header-row">
        <span class="sb-field-label">STEPS</span>
        <button
          class="sb-btn sb-btn-xs sb-btn-ghost"
          data-testid="combo-steps-editor-add-button"
          onClick={() => onChange(addStep(steps))}
        >
          + STEP
        </button>
      </div>
      {steps.length === 0 && <div class="sb-hint-text">No steps yet — + STEP adds one.</div>}

      {steps.map((step, i) => {
        const offered = pool.filter(
          (p) => !step.padIds.includes(p.id) && canStartInCombo(board, comboId, p.id),
        );
        const bgHintId = `${stepLabelId}-${i}-bg`;
        const hasBackground = step.padIds.some((id) => background.has(id));
        return (
          <div
            key={i}
            class="sb-combo-step"
            role="group"
            aria-labelledby={`${stepLabelId}-${i}`}
            data-testid={`combo-steps-editor-step-item-${i}`}
          >
            <div class="sb-section-header-row">
              <span class="sb-field-label" id={`${stepLabelId}-${i}`}>
                STEP {i + 1}
              </span>
              <button
                class="sb-btn sb-btn-xs sb-btn-ghost"
                data-testid={`combo-steps-editor-remove-button-${i}`}
                onClick={() => onChange(removeStep(steps, i))}
              >
                REMOVE STEP
              </button>
            </div>

            {/* The pads this step starts together — a tap takes one out */}
            <div class="sb-tag-list">
              {step.padIds.map((id) => (
                <button
                  key={id}
                  class="sb-btn sb-btn-sm sb-btn-ghost"
                  data-testid={`combo-steps-editor-pad-button-${i}-${id}`}
                  aria-label={`Remove ${names.get(id) ?? id} from step ${i + 1}`}
                  aria-describedby={background.has(id) ? bgHintId : undefined}
                  onClick={() => onChange(removePadFromStep(steps, i, id))}
                >
                  {names.get(id) ?? '(missing pad)'}
                  {background.has(id) && (
                    <span class="sb-chip-note" aria-hidden="true">
                      BG
                    </span>
                  )}
                  <UiIcon name="delete" />
                </button>
              ))}
            </div>
            {hasBackground && (
              <div class="sb-hint-text is-wrap" id={bgHintId}>
                BG — a Loop set to ∞ plays in the background and stops when the combo ends; a REPEAT
                count plays it through.
              </div>
            )}
            <select
              class="sb-text-input"
              data-testid={`combo-steps-editor-pad-input-${i}`}
              aria-label={`Add a pad to step ${i + 1}`}
              value=""
              onChange={(e) => {
                const id = e.currentTarget.value;
                if (id) onChange(addPadToStep(steps, i, id));
              }}
            >
              <option value="">+ pad…</option>
              {offered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || '—'}
                </option>
              ))}
            </select>

            {/* Wait until the next step */}
            <label class="sb-check-row">
              Wait (s)
              <NumberField
                min={0}
                step={0.5}
                testid={`combo-steps-editor-wait-input-${i}`}
                value={step.duration}
                placeholder="0"
                onCommit={(typed) => onChange(setStepDuration(steps, i, parseFloat(typed)))}
              />
            </label>

            <label class="sb-check-row">
              <input
                type="checkbox"
                data-testid={`combo-steps-editor-stop-all-input-${i}`}
                checked={step.stopAll === true}
                onChange={(e) => onChange(setStepStopAll(steps, i, e.currentTarget.checked))}
              />
              Stop everything first
            </label>
            {step.fadeOutAll !== undefined && (
              <div class="sb-hint-text">Fades out everything over {step.fadeOutAll} s</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
