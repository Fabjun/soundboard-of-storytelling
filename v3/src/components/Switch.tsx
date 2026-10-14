/**
 * @fileoverview Switch — one on / off setting: the one switch of the app
 *
 * docs/product/features/settings.md S13: on / off is a switch, applied at once. Built on the
 * WAI-ARIA APG "Switch" pattern: a button with `role="switch"` and `aria-checked`, named by its
 * visible label (the state is not part of the name); Space and Enter toggle it as on any button.
 * The explanation is tied to it with `aria-describedby`. The whole row is the 44px touch target.
 */

import { useId } from 'preact/hooks';
import type { JSX } from 'preact';

/** Shows a named on / off setting; `onChange` gets the new state. */
export function Switch({
  label,
  caption,
  checked,
  onChange,
  disabled = false,
  testid,
}: {
  label: string;
  caption?: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  /** The setting cannot change now — the caption says why. */
  disabled?: boolean;
  testid?: string;
}): JSX.Element {
  const captionId = useId();
  return (
    <div class="sb-settings-row">
      <button
        type="button"
        role="switch"
        class="sb-switch"
        aria-checked={checked}
        aria-describedby={caption ? captionId : undefined}
        disabled={disabled}
        data-testid={testid}
        onClick={() => onChange(!checked)}
      >
        <span class="sb-settings-label">{label}</span>
        <span class="sb-switch-track" aria-hidden="true">
          <span class="sb-switch-thumb" />
        </span>
      </button>
      {caption && (
        <div class="sb-caption" id={captionId}>
          {caption}
        </div>
      )}
    </div>
  );
}
