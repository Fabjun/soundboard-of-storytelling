/**
 * @fileoverview NumberField — the one number field of the app (owner decision 2026-11-18, BACKLOG
 * "Number fields drop typed text on a redraw")
 *
 * A number is taken when it is complete — on Enter or when the field is left (`change`), so a
 * value typed in steps ("1", "12", "120") is clamped once, not at every key. Until then the typed
 * text is the field's own state: a field that showed only the stored value lost what was typed
 * whenever its screen drew again before the Enter (Preact sets `value` on every render) — the
 * LIGHT tab when the lamp's effects arrived, the PAD editor while the preview's playhead moves.
 * Once taken, the field shows the stored value again, as the caller has clamped it. Every
 * `type="number"` of the app is this component (`codeGuards`, "one number field").
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';

/** Shows `value` (empty for undefined) and hands the typed text to `onCommit` once it is taken. */
export function NumberField({
  value,
  onCommit,
  label,
  min,
  max,
  step,
  placeholder,
  testid,
}: {
  value: number | undefined;
  /** Takes the typed text — the caller parses and clamps it and stores the result. */
  onCommit: (typed: string) => void;
  /** The field's accessible name, when no visible label wraps it. */
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  testid?: string;
}): JSX.Element {
  const [draft, setDraft] = useState<string | null>(null);
  const whole = step === undefined || Number.isInteger(step);
  return (
    <input
      class="sb-text-input"
      type="number"
      inputMode={whole ? 'numeric' : 'decimal'}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      aria-label={label}
      data-testid={testid}
      value={draft ?? (value === undefined ? '' : String(value))}
      onInput={(e) => setDraft(e.currentTarget.value)}
      onChange={(e) => {
        const typed = e.currentTarget.value;
        setDraft(null);
        onCommit(typed);
      }}
    />
  );
}
