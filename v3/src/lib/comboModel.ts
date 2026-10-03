// ─────────────────────────────────────────────────────────────────────────────
// Combo model — steps of a combo and protection against cycles (Slice 11,
// docs/product/README.md#combos--decided)
//
// Pure functions. Combos are building blocks: a step may start pads and other combos from any
// deck of the board. A combo must never reach itself through its steps — the engine would start
// it again and again (unbounded recursion).
// ─────────────────────────────────────────────────────────────────────────────

import type { Board, ComboStep } from '../types';

/** Every pad id a combo starts, directly or through nested combos (not including itself). */
export function comboReach(board: Board, comboId: string): Set<string> {
  const byId = new Map(board.pads.map((p) => [p.id, p]));
  const reached = new Set<string>();
  const stack = [comboId];
  while (stack.length > 0) {
    const pad = byId.get(stack.pop()!);
    if (pad?.type !== 'combo') continue;
    for (const step of pad.steps) {
      for (const id of step.padIds) {
        if (reached.has(id)) continue;
        reached.add(id);
        stack.push(id);
      }
    }
  }
  return reached;
}

/** Whether a step of `comboId` may start `padId` — false when that would close a cycle. */
export function canStartInCombo(board: Board, comboId: string, padId: string): boolean {
  return padId !== comboId && !comboReach(board, padId).has(comboId);
}

/** Combos that reach themselves through their steps (a broken board — e.g. from a file). */
export function combosInCycles(board: Board): string[] {
  return board.pads
    .filter((p) => p.type === 'combo' && comboReach(board, p.id).has(p.id))
    .map((p) => p.id);
}

// ── Step operations (return new arrays; nothing is mutated) ─────────────────

export const addStep = (steps: ComboStep[]): ComboStep[] => [...steps, { padIds: [] }];

export const removeStep = (steps: ComboStep[], index: number): ComboStep[] =>
  steps.filter((_, i) => i !== index);

const withStep = (steps: ComboStep[], index: number, change: (s: ComboStep) => ComboStep) =>
  steps.map((s, i) => (i === index ? change(s) : s));

/** Adds a pad to a step (once — a pad starts at most once per step). */
export const addPadToStep = (steps: ComboStep[], index: number, padId: string): ComboStep[] =>
  withStep(steps, index, (s) =>
    s.padIds.includes(padId) ? s : { ...s, padIds: [...s.padIds, padId] },
  );

export const removePadFromStep = (steps: ComboStep[], index: number, padId: string) =>
  withStep(steps, index, (s) => ({ ...s, padIds: s.padIds.filter((id) => id !== padId) }));

/** The wait until the next step, in seconds; 0 or less (or not a number) removes it. */
export function setStepDuration(steps: ComboStep[], index: number, seconds: number): ComboStep[] {
  return withStep(steps, index, (s) => {
    const { duration: _old, ...rest } = s;
    return Number.isFinite(seconds) && seconds > 0 ? { ...rest, duration: seconds } : rest;
  });
}

/** "Stop everything first" for a step. */
export function setStepStopAll(steps: ComboStep[], index: number, on: boolean): ComboStep[] {
  return withStep(steps, index, (s) => {
    const { stopAll: _old, ...rest } = s;
    return on ? { ...rest, stopAll: true } : rest;
  });
}

/**
 * The board with every step reference that closes a cycle removed (for boards from a file — the
 * editor never creates one). Combos are checked in order, each against the board after the
 * removals in the combos before it; a reference goes when the pad it starts leads back to the
 * combo. Not minimal — within one combo every such reference goes — but the result never has a
 * cycle. Returns how many references were removed.
 */
export function breakCycles(board: Board): { board: Board; removed: number } {
  let current = board;
  let removed = 0;
  for (const { id: comboId } of board.pads) {
    const combo = current.pads.find((p) => p.id === comboId);
    if (combo?.type !== 'combo') continue;
    const steps = combo.steps.map((step) => ({
      ...step,
      padIds: step.padIds.filter((id) => {
        const keep = canStartInCombo(current, comboId, id);
        if (!keep) removed++;
        return keep;
      }),
    }));
    current = {
      ...current,
      pads: current.pads.map((p) => (p.id === comboId ? { ...combo, steps } : p)),
    };
  }
  return { board: current, removed };
}
