/**
 * @fileoverview ComboStepsEditor — the steps of a combo in the PAD editor (Slice 11, minimal first version,
 * docs/product/README.md#combos--decided)
 *
 * Per step: the pads that start together, the wait until the next step, "stop everything first".
 * Controlled: the PAD editor owns the steps and saves them with the rest of the pad (one writer).
 * Only pads that do not lead back to this combo are offered (no cycles, comboModel).
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { Board, ComboStep } from '../types';
import {
  addPadToStep,
  addStep,
  canStartInCombo,
  removePadFromStep,
  removeStep,
  setStepDuration,
  setStepStopAll,
} from '../lib/comboModel';
import { poolByName } from '../lib/boardModel';

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
  /** Two-tap removal (UI rule): the first tap arms "step:i" or "pad:i:id", the second removes. */
  const [armed, setArmed] = useState<string | null>(null);
  const names = new Map(board.pads.map((p) => [p.id, p.name || '—']));
  const pool = poolByName(board);

  function confirmTwice(key: string, remove: () => void) {
    if (armed === key) {
      setArmed(null);
      remove();
    } else {
      setArmed(key);
    }
  }

  return (
    <div class="sb-inspector-section" data-testid="combo-steps-editor">
      <div class="sb-section-header-row">
        <label class="sb-field-label">STEPS</label>
        <button
          class="sb-btn sb-btn-xs sb-btn-ghost"
          data-testid="combo-steps-editor-add-button"
          onClick={() => onChange(addStep(steps))}
        >
          + STEP
        </button>
      </div>
      {steps.length === 0 && <div class="sb-hint-text">No steps yet</div>}

      {steps.map((step, i) => {
        const offered = pool.filter(
          (p) => !step.padIds.includes(p.id) && canStartInCombo(board, comboId, p.id),
        );
        return (
          <div key={i} class="sb-combo-step" data-testid={`combo-steps-editor-step-item-${i}`}>
            <div class="sb-section-header-row">
              <label class="sb-field-label">STEP {i + 1}</label>
              <button
                class="sb-btn sb-btn-xs sb-btn-ghost"
                data-testid={`combo-steps-editor-remove-button-${i}`}
                onClick={() => confirmTwice(`step:${i}`, () => onChange(removeStep(steps, i)))}
                onBlur={() => setArmed(null)}
              >
                {armed === `step:${i}` ? 'CONFIRM REMOVE' : 'REMOVE STEP'}
              </button>
            </div>

            {/* The pads this step starts together — tap twice to take one out */}
            <div class="sb-tag-list">
              {step.padIds.map((id) => (
                <button
                  key={id}
                  class="sb-btn sb-btn-sm sb-btn-ghost"
                  data-testid={`combo-steps-editor-pad-button-${i}-${id}`}
                  aria-label={`Remove ${names.get(id) ?? id} from step ${i + 1}`}
                  onClick={() =>
                    confirmTwice(`pad:${i}:${id}`, () => onChange(removePadFromStep(steps, i, id)))
                  }
                  onBlur={() => setArmed(null)}
                >
                  {names.get(id) ?? '(missing pad)'}
                  {armed === `pad:${i}:${id}` ? ' — tap again to remove' : ' ×'}
                </button>
              ))}
            </div>
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
              <input
                class="sb-text-input"
                type="number"
                min="0"
                step="0.5"
                data-testid={`combo-steps-editor-wait-input-${i}`}
                value={step.duration ?? ''}
                placeholder="0"
                onChange={(e) =>
                  onChange(setStepDuration(steps, i, parseFloat(e.currentTarget.value)))
                }
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
