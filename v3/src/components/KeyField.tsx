/**
 * @fileoverview KeyField — tap, then press the key a pad or a live control gets (K1, K12); one
 * field for a deck key, a quick-access key (Slice 13d) and the keys of STOP ALL and PAUSE (14d)
 *
 * docs/product/README.md#input-keyboard--numpad: a key is assigned by focusing the field and
 * pressing it. A reserved key (the caller's `reserved`) is refused with what it does; a key another pad holds is either
 * offered to move over (MOVE KEY HERE, K1 — within one deck, or within the quick-access bar) or
 * refused with its reason (K2: a deck key and a quick-access key must never be the same). What
 * applies is the caller's `check`. Escape cancels without closing the editor; Tab moves on (no
 * keyboard trap, WCAG 2.1.2); a modifier alone waits for the real key.
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { UiIcon } from './UiIcon';
import { isModifierKey, keyLabel } from '../lib/padKeys';

/** What a pressed key means for the pad: free, held by a pad it can move from, or refused. */
export type KeyCheck =
  { kind: 'free' } | { kind: 'move'; holder: string } | { kind: 'refused'; reason: string };

interface KeyFieldProps {
  /** The id of the field button, for its label. */
  id: string;
  /** The visible label above the field. */
  label: string;
  /** The key it has now, if any. */
  hotkey?: string;
  /** Keys it cannot take, each with what the key does instead (`reservedKeys`). */
  reserved: Readonly<Record<string, string>>;
  /** What gets the key, in the field's spoken prompt — "this pad" unless said. */
  subject?: string;
  /** Whether the key can be removed (a pad's can; a live control always has one). */
  clearable?: boolean;
  /** Tells what a pressed (not reserved) key means here. */
  check: (code: string) => KeyCheck;
  /** Gives the pad the key — another holder in the same place loses it — or clears it. */
  onAssign: (code: string | undefined) => void;
}

/** Shows the key field: the key now, its clear button, and a conflict or a refusal in words. */
export function KeyField({
  id,
  label,
  hotkey,
  reserved,
  subject = 'this pad',
  clearable = true,
  check,
  onAssign,
}: KeyFieldProps): JSX.Element {
  const [armed, setArmed] = useState(false);
  const [toMove, setToMove] = useState<{ code: string; holder: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const assign = (code: string | undefined) => {
    onAssign(code);
    setToMove(null);
    setNote(null);
  };

  function capture(e: KeyboardEvent) {
    if (!armed || e.code === 'Tab' || !e.code) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === 'Escape') {
      setArmed(false);
      return;
    }
    if (isModifierKey(e.code)) return;
    setArmed(false);
    if (e.code in reserved) {
      setToMove(null);
      setNote(`${keyLabel(e.code)} ${reserved[e.code]} — pick another key`);
      return;
    }
    const result = check(e.code);
    if (result.kind === 'refused') {
      setToMove(null);
      setNote(result.reason);
    } else if (result.kind === 'move') {
      setNote(null);
      setToMove({ code: e.code, holder: result.holder });
    } else {
      assign(e.code);
    }
  }

  return (
    <div class="sb-inspector-section" data-testid="key-field">
      <label class="sb-field-label" for={id}>
        {label}
      </label>
      <div class="sb-row">
        <button
          id={id}
          type="button"
          class="sb-btn sb-btn-sm sb-flex-1"
          data-testid="key-field-button"
          aria-label={
            armed
              ? `Press a key for ${subject}`
              : hotkey
                ? `Key ${keyLabel(hotkey)}, tap to change`
                : 'No key, tap and press a key'
          }
          onClick={(e) => {
            // Safari does not focus a tapped button; the key must reach this one
            e.currentTarget.focus();
            setArmed(true);
            setToMove(null);
            setNote(null);
          }}
          onKeyDown={capture}
          onBlur={() => setArmed(false)}
        >
          <UiIcon name="key" size={11} color="var(--text-mute)" />
          {armed ? 'PRESS A KEY…' : hotkey ? keyLabel(hotkey) : '— not assigned —'}
        </button>
        {clearable && hotkey && !armed && (
          <button
            type="button"
            class="sb-btn sb-btn-icon-sm"
            data-testid="key-field-clear-button"
            aria-label="Remove the key"
            onClick={() => assign(undefined)}
          >
            <UiIcon name="delete" />
          </button>
        )}
      </div>
      {toMove && (
        <div class="sb-row" role="status">
          <span class="sb-hint-text sb-flex-1" data-testid="key-field-conflict-text">
            Key {keyLabel(toMove.code)} is on {toMove.holder}
          </span>
          <button
            type="button"
            class="sb-btn sb-btn-xs sb-btn-primary"
            data-testid="key-field-move-button"
            onClick={() => assign(toMove.code)}
          >
            MOVE KEY HERE
          </button>
        </div>
      )}
      {note && (
        <div class="sb-hint-text" role="status" data-testid="key-field-note-text">
          {note}
        </div>
      )}
    </div>
  );
}
