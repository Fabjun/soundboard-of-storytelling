/**
 * @fileoverview PadLightPanel — the LIGHT tab of the PAD editor (docs/product/features/light.md
 * G3, C1, C2, C4)
 *
 * A pad's light is nothing, a preset of the lamp (1–250, made in the lamp's own app), or off — sent
 * to all lamps or one (Settings → LIGHT). TRY sends it at once and says what happened. A combo has
 * no light of its own: its steps start the light of the pads they play (C4).
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { SegmentedChoice } from './SegmentedChoice';
import { getLamps, prefsVersion } from '../state/prefs';
import { PRESET_MAX, describeResult } from '../light/wled';
import { startPadLight } from '../light/padLight';
import type { Pad, PadLight } from '../types';

type Kind = 'none' | 'preset' | 'off';

const KINDS: readonly { value: Kind; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'preset', label: 'Preset' },
  { value: 'off', label: 'Off' },
];

const kindOf = (light: PadLight | undefined): Kind =>
  !light ? 'none' : 'off' in light ? 'off' : 'preset';

/** Edits a pad's light; `onChange` gets the new light, or undefined for none. */
export function PadLightPanel({
  pad,
  light,
  onChange,
}: {
  pad: Pad;
  light: PadLight | undefined;
  onChange: (light: PadLight | undefined) => void;
}): JSX.Element {
  void prefsVersion.value; // the lamps may change in Settings
  const lamps = getLamps();
  const [tried, setTried] = useState<string | null>(null);
  const kind = kindOf(light);
  const lamp = light?.lamp ?? 'all';
  const preset = light && 'preset' in light ? light.preset : 1;

  if (pad.type === 'combo') {
    return (
      <div class="sb-inspector-section">
        <p class="sb-caption">
          A combo has no light of its own — each step starts the light of the pads it plays.
        </p>
      </div>
    );
  }

  function setKind(k: Kind) {
    setTried(null);
    if (k === 'none') onChange(undefined);
    else if (k === 'off') onChange({ lamp, off: true });
    else onChange({ lamp, preset });
  }

  async function tryIt() {
    if (!light) return;
    setTried('Sending…');
    const results = await startPadLight({ ...pad, light });
    setTried(
      results.length === 0
        ? 'No lamp to send to — add one in Settings → LIGHT.'
        : results.map(describeResult).join(' '),
    );
  }

  return (
    <div class="sb-inspector-section sb-col">
      {lamps.length === 0 && (
        <p class="sb-caption">
          No lamp is set up yet — add a WLED lamp in Settings → LIGHT; the pad keeps its light until
          then.
        </p>
      )}
      <SegmentedChoice
        legend="Light"
        caption="What the pad does to the light when it starts. The light stays when the pad stops."
        name="pad-light"
        options={KINDS}
        value={kind}
        onChange={setKind}
        testid="pad-light-kind-region"
      />
      {kind === 'preset' && (
        <label class="sb-col">
          <span class="sb-caption">Preset number, as the lamp's own app shows it</span>
          <input
            class="sb-text-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={PRESET_MAX}
            aria-label="Preset number"
            value={preset}
            onChange={(e) => {
              const n = Math.round(Number(e.currentTarget.value));
              const clamped = Math.min(PRESET_MAX, Math.max(1, Number.isFinite(n) ? n : 1));
              onChange({ lamp, preset: clamped });
            }}
          />
        </label>
      )}
      {kind !== 'none' && (
        <>
          <select
            class="sb-text-input"
            aria-label="Lamp"
            value={lamp}
            onChange={(e) => {
              const to = e.currentTarget.value;
              onChange(kind === 'off' ? { lamp: to, off: true } : { lamp: to, preset });
            }}
          >
            <option value="all">All lamps</option>
            {lamps.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button class="sb-btn sb-btn-sm sb-btn-ghost" onClick={() => void tryIt()}>
            TRY
          </button>
          {tried && (
            <p class="sb-caption" role="status">
              {tried}
            </p>
          )}
        </>
      )}
    </div>
  );
}
