/**
 * @fileoverview LightPanel — choosing a light: the LIGHT tab of the PAD editor and the board's
 * base light in the deck list (docs/product/features/light.md G3, C1, C2)
 *
 * A light is nothing, a preset of the lamp (1–250, made in the lamp's own app), an effect set here
 * (C1 B: the effect, one color, speed, intensity and brightness), or off — sent to all lamps or one
 * (Settings → LIGHT). The effects are read from the lamp, as their ids differ between WLED
 * versions; without a lamp in reach the effect's number can be typed. TRY sends the light at once
 * and says what happened. One component for both places (CLAUDE.md, one function per UI element);
 * `name` keeps their radio groups apart when both are on the page.
 */

import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { SegmentedChoice } from './SegmentedChoice';
import { SliderRow } from './SliderRow';
import { getLamps, prefsVersion } from '../state/prefs';
import {
  EFFECT_DEFAULT,
  PRESET_MAX,
  describeResult,
  listEffects,
  type LampEffect,
} from '../light/wled';
import { startLight } from '../light/padLight';
import type { LightEffect, PadLight } from '../types';

type Kind = 'none' | 'preset' | 'effect' | 'off';

const KINDS: readonly { value: Kind; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'preset', label: 'Preset' },
  { value: 'effect', label: 'Effect' },
  { value: 'off', label: 'Off' },
];

const kindOf = (light: PadLight | undefined): Kind =>
  !light ? 'none' : 'off' in light ? 'off' : 'effect' in light ? 'effect' : 'preset';

/** The effects of the lamp as last read: not yet, being read, read, or why not. */
type EffectList = null | 'reading' | LampEffect[] | string;

/**
 * Edits a light — a pad's or the board's; `onChange` gets the new light, or undefined for none.
 * `legend` and `caption` say whose light it is and when it is sent; `name` is the radio group's
 * name and the end of its test id ("pad" / "board").
 */
export function LightPanel({
  light,
  onChange,
  legend,
  caption,
  name,
}: {
  light: PadLight | undefined;
  onChange: (light: PadLight | undefined) => void;
  legend: string;
  caption: string;
  name: string;
}): JSX.Element {
  void prefsVersion.value; // the lamps may change in Settings
  const lamps = getLamps();
  const [tried, setTried] = useState<string | null>(null);
  const [effects, setEffects] = useState<EffectList>(null);
  const kind = kindOf(light);
  const lamp = light?.lamp ?? 'all';
  const preset = light && 'preset' in light ? light.preset : 1;
  const effect = light && 'effect' in light ? light.effect : EFFECT_DEFAULT;
  // The lamp the effects are read from: the chosen one, or the first for "All lamps"
  const source = lamps.find((l) => l.id === lamp) ?? lamps[0];
  const sourceAddress = source?.address;

  useEffect(() => {
    if (kind !== 'effect' || effects !== null || !sourceAddress) return;
    setEffects('reading');
    void listEffects(sourceAddress).then((r) =>
      setEffects(r.kind === 'effects' ? r.effects : describeResult(r)),
    );
  }, [kind, effects, sourceAddress]);

  /** The light of `k` for `to`, keeping what was set for that kind. */
  function lightOf(k: Exclude<Kind, 'none'>, to: string): PadLight {
    if (k === 'off') return { lamp: to, off: true };
    if (k === 'effect') return { lamp: to, effect };
    return { lamp: to, preset };
  }

  function setKind(k: Kind) {
    setTried(null);
    onChange(k === 'none' ? undefined : lightOf(k, lamp));
  }

  function setEffect(change: Partial<LightEffect>) {
    onChange({ lamp, effect: { ...effect, ...change } });
  }

  async function tryIt() {
    if (!light) return;
    setTried('Sending…');
    const results = await startLight(light);
    setTried(
      results.length === 0
        ? 'No lamp to send to — add one in Settings → LIGHT.'
        : results.map(describeResult).join(' '),
    );
  }

  const byNumber = typeof effects === 'string' ? `${effects} ` : '';

  // One section per group, each slider its own — as the SOUND tab lays out volume and fades; a
  // plain block outside, so no section is squeezed in a scrolling column (layout-reach)
  return (
    <div>
      <div class="sb-inspector-section sb-col">
        {lamps.length === 0 && (
          <p class="sb-caption">
            No lamp is set up yet — add a WLED lamp in Settings → LIGHT; the light is kept until
            then.
          </p>
        )}
        <SegmentedChoice
          legend={legend}
          caption={caption}
          name={`${name}-light`}
          options={KINDS}
          value={kind}
          onChange={setKind}
          testid={`light-panel-kind-region-${name}`}
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
      </div>
      {kind === 'effect' && (
        <>
          <div class="sb-inspector-section sb-col">
            {Array.isArray(effects) ? (
              <select
                class="sb-text-input"
                aria-label="Effect"
                value={effect.fx}
                onChange={(e) => {
                  const fx = Number(e.currentTarget.value);
                  setEffect({ fx, name: effects.find((x) => x.id === fx)?.name ?? '' });
                }}
              >
                {/* The chosen effect stays listed when this lamp has no effect of that id */}
                {!effects.some((x) => x.id === effect.fx) && (
                  <option value={effect.fx}>{effect.name || `Effect ${effect.fx}`}</option>
                )}
                {effects.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            ) : (
              <label class="sb-col">
                <span class="sb-caption">
                  {effects === 'reading'
                    ? 'Reading the effects from the lamp…'
                    : `${byNumber}The effect's number, as the lamp's own app lists it — Solid is 0.`}
                </span>
                <input
                  class="sb-text-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={255}
                  aria-label="Effect number"
                  value={effect.fx}
                  onChange={(e) => {
                    const n = Math.round(Number(e.currentTarget.value));
                    setEffect({
                      fx: Math.min(255, Math.max(0, Number.isFinite(n) ? n : 0)),
                      name: '',
                    });
                  }}
                />
              </label>
            )}
            <label class="sb-row">
              <span class="sb-field-label sb-flex-1">COLOR</span>
              <input
                class="sb-color-input"
                type="color"
                aria-label="Color"
                value={effect.color}
                onChange={(e) => setEffect({ color: e.currentTarget.value })}
              />
            </label>
          </div>
          <div class="sb-inspector-section">
            <SliderRow
              label="SPEED"
              value={effect.speed}
              min={0}
              max={255}
              step={1}
              format={(v) => String(v)}
              onChange={(v) => setEffect({ speed: v })}
            />
          </div>
          <div class="sb-inspector-section">
            <SliderRow
              label="INTENSITY"
              value={effect.intensity}
              min={0}
              max={255}
              step={1}
              format={(v) => String(v)}
              onChange={(v) => setEffect({ intensity: v })}
            />
          </div>
          <div class="sb-inspector-section">
            <SliderRow
              label="BRIGHTNESS"
              value={effect.brightness}
              min={1}
              max={255}
              step={1}
              format={(v) => String(v)}
              onChange={(v) => setEffect({ brightness: v })}
            />
          </div>
        </>
      )}
      {kind !== 'none' && (
        <div class="sb-inspector-section sb-col">
          <select
            class="sb-text-input"
            aria-label="Lamp"
            value={lamp}
            onChange={(e) => {
              setEffects(null); // another lamp may have other effects
              onChange(lightOf(kind, e.currentTarget.value));
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
        </div>
      )}
    </div>
  );
}
