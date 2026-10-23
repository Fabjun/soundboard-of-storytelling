/**
 * @fileoverview LightSettings — the LIGHT group of the settings: the lamps (docs/product/features/
 * light.md C2, C5, C6; ADR-0091)
 *
 * Each lamp shows its name and address, TEST asks it who it is (`/json/info`) and says the answer
 * in plain words — connected, no answer, or that this browser does not let the app reach it.
 * REMOVE asks first (ConfirmDialog): pads that name the lamp would lose their light without a
 * word. ADD takes a name and the address as typed.
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { ConfirmDialog } from './ConfirmDialog';
import { getLamps, prefsVersion, type Lamp } from '../state/prefs';
import { addLamp, describeProblem, LAMP_NAME_MAX, removeLamp } from '../state/lights';
import { describeResult, testLamp } from '../light/wled';

/** Shows the lamps with TEST and REMOVE, and a form that adds one. */
export function LightSettings(): JSX.Element {
  void prefsVersion.value; // re-render when the lamps change
  const lamps = getLamps();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<Lamp | null>(null);

  function add() {
    const r = addLamp(name, address);
    if (typeof r === 'string') {
      setProblem(describeProblem(r));
      return;
    }
    setProblem(null);
    setName('');
    setAddress('');
  }

  async function test(lamp: Lamp) {
    setResults((all) => ({ ...all, [lamp.id]: 'Testing…' }));
    const text = describeResult(await testLamp(lamp.address));
    setResults((all) => ({ ...all, [lamp.id]: text }));
  }

  return (
    <div class="sb-col">
      <p class="sb-caption">
        A pad can start a preset on a WLED lamp in this network. The lamp's own app makes the
        presets; here the app learns where the lamp is.
      </p>
      {lamps.map((lamp) => (
        <div key={lamp.id} class="sb-settings-row">
          <div class="sb-flex-min sb-col">
            <span class="sb-audio-row-name">{lamp.name}</span>
            <span class="sb-hint-text">{lamp.address}</span>
            {results[lamp.id] && (
              <span class="sb-caption" role="status">
                {results[lamp.id]}
              </span>
            )}
          </div>
          <div class="sb-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              aria-label={`Test ${lamp.name}`}
              onClick={() => void test(lamp)}
            >
              TEST
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              aria-label={`Remove ${lamp.name}`}
              onClick={() => setRemoving(lamp)}
            >
              REMOVE
            </button>
          </div>
        </div>
      ))}
      <div class="sb-row-wrap">
        <input
          class="sb-text-input"
          aria-label="Lamp name"
          placeholder="Name, e.g. Floor lamp"
          maxLength={LAMP_NAME_MAX}
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
        />
        <input
          class="sb-text-input"
          aria-label="Lamp address"
          placeholder="Address, e.g. 192.168.1.50"
          inputMode="url"
          value={address}
          onInput={(e) => setAddress(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
        />
        <button class="sb-btn sb-btn-sm sb-btn-primary" onClick={add}>
          ADD LAMP
        </button>
      </div>
      {problem && (
        <p class="sb-caption" role="alert">
          {problem}
        </p>
      )}
      {removing && (
        <ConfirmDialog
          title={`Remove the lamp '${removing.name}'?`}
          confirmLabel="REMOVE"
          danger
          onConfirm={() => {
            removeLamp(removing.id);
            setRemoving(null);
          }}
          onCancel={() => setRemoving(null)}
        >
          <div class="sb-dialog-section">Pads that start light on it send it nothing any more.</div>
        </ConfirmDialog>
      )}
    </div>
  );
}
