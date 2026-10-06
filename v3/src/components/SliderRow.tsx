/**
 * @fileoverview SliderRow — a labeled slider with its value: the one slider of the app
 *
 * Used by the PAD editor (volume, fades) and the deck rail (PAD SIZE, ADR-0075). The label also
 * names the slider for screen readers (WCAG 4.1.2); `onChange` follows every move (live), the
 * optional `onCommit` gets the value once the move ends (pointer up, a key step) — for a write
 * that should happen once, not on every move.
 */

import type { JSX } from 'preact';

/** Shows a labeled slider with its formatted value. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onCommit,
  testid,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  testid?: string;
}): JSX.Element {
  return (
    <div>
      <div class="sb-section-header-row">
        <label class="sb-field-label">{label}</label>
        <span class="sb-value-text">{format(value)}</span>
      </div>
      <input
        class="sb-range-input"
        type="range"
        aria-label={label}
        data-testid={testid}
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onChange(parseFloat((e.target as HTMLInputElement).value))}
        onChange={onCommit && ((e) => onCommit(parseFloat((e.target as HTMLInputElement).value)))}
      />
    </div>
  );
}
