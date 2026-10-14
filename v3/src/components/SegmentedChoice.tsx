/**
 * @fileoverview SegmentedChoice — one setting with a few fixed values: the one segmented choice of
 * the app
 *
 * docs/product/features/settings.md S13: a few fixed values are a segmented choice, applied at
 * once. A fieldset whose legend names the setting, with a row of radio buttons drawn as joined
 * buttons (the radios themselves are visually hidden, so the browser's own keyboard and screen
 * reader handling of a radio group stays — WAI-ARIA APG "Radio Group").
 */

import type { JSX } from 'preact';

/** Shows a named setting with its values as a row of radio buttons; `onChange` gets the pick. */
export function SegmentedChoice<T extends string | number>({
  legend,
  caption,
  name,
  options,
  value,
  onChange,
  testid,
}: {
  legend: string;
  caption?: string;
  /** The radio group's name — unique on the screen. */
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  testid?: string;
}): JSX.Element {
  return (
    <fieldset class="sb-settings-row">
      <legend class="sb-settings-label">{legend}</legend>
      {caption && <div class="sb-caption">{caption}</div>}
      <div class="sb-segmented" data-testid={testid}>
        {options.map((o) => (
          <label
            key={String(o.value)}
            class={`sb-segmented-option${o.value === value ? ' is-active' : ''}`}
          >
            <input
              type="radio"
              name={name}
              class="sb-visually-hidden"
              value={String(o.value)}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
