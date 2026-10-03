/**
 * @fileoverview WaveformEditor — the PAD editor's waveform with trim and fade handles (Slice 15a)
 *
 * Shows the file's stored peaks at full resolution (ADR-0065), dims what the trim cuts off, marks
 * the fade zones. Four handles move the trim start / end (lower lane) and the fade-in end /
 * fade-out start (upper lane) — two lanes, so a fade of 0 never hides a trim handle. Each handle
 * is a WAI-ARIA slider: it drags with Pointer Events (never HTML5 drag-and-drop —
 * CLAUDE.md#supported-platforms-minimum) and moves with the arrow, Page and Home / End keys.
 * The playback position is a seek slider after the WAI-ARIA APG Media Seek Slider example: the
 * playhead while the preview plays, else where the next preview starts; it moves with the same
 * keys within the trimmed region, and tapping the waveform outside a handle sets it. The rules
 * live in src/lib/trimRange.ts; this component only reports where a handle or the position
 * should go.
 */

import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import { Waveform } from './Waveform';
import {
  handlePosition,
  handleRange,
  keyTarget,
  stepTarget,
  type Handle,
  type TrimValues,
} from '../lib/trimRange';

interface WaveformEditorProps {
  /** Stored peaks of the file, in [0, 1]. */
  peaks: number[];
  /** Length of the file, in seconds. */
  duration: number;
  values: TrimValues;
  /** A handle should move to `position` seconds; the caller applies the rules. */
  onMove: (handle: Handle, position: number) => void;
  /** Preview playhead in seconds, or null while the preview does not play. */
  playhead: number | null;
  /** Where the next preview starts, in seconds. */
  cursor: number;
  /** The playback position should go to `position` seconds (tap or key). */
  onSeek: (position: number) => void;
}

/** The handles: accessible name, test ID part (kebab-case, ADR-0054) and lane. */
const HANDLES = [
  { handle: 'fadeIn', label: 'Fade-in end', id: 'fade-in', lane: 'is-fade' },
  { handle: 'fadeOut', label: 'Fade-out start', id: 'fade-out', lane: 'is-fade' },
  { handle: 'trimStart', label: 'Trim start', id: 'trim-start', lane: 'is-trim' },
  { handle: 'trimEnd', label: 'Trim end', id: 'trim-end', lane: 'is-trim' },
] as const satisfies readonly { handle: Handle; label: string; id: string; lane: string }[];

/** Formats seconds for the handles' spoken value. */
const spoken = (s: number): string => `${s.toFixed(2)} seconds`;

/** Draws the waveform of one file with its trim, fades and playhead, and lets each be moved. */
export function WaveformEditor({
  peaks,
  duration,
  values,
  onMove,
  playhead,
  cursor,
  onSeek,
}: WaveformEditorProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = (s: number): string => `${(s / duration) * 100}%`;
  /** The playback position slider's value, in hundredths of a second. */
  const position = Math.round((playhead ?? cursor) * 100) / 100;

  /** Seconds of the file under a pointer's x position. */
  function secondsAt(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return ((clientX - rect.left) / rect.width) * duration;
  }

  /** A handle takes the pointer, so the drag goes on outside it and does not seek. */
  function handlePointerDown(e: PointerEvent) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(handle: Handle, e: PointerEvent) {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
    onMove(handle, secondsAt(e.clientX));
  }

  function handleKeyDown(handle: Handle, e: KeyboardEvent) {
    const target = keyTarget(values, handle, e.key, duration);
    if (target === null) return;
    e.preventDefault();
    onMove(handle, target);
  }

  return (
    <div
      class="sb-wave-editor"
      data-testid="waveform-editor"
      ref={trackRef}
      onPointerDown={(e) => onSeek(secondsAt(e.clientX))}
    >
      <div class="sb-wave-editor-track">
        <Waveform peaks={peaks} bars={peaks.length} height={40} />
      </div>

      {/* What the trim cuts off */}
      <div class="sb-wave-editor-dim is-start" style={{ width: pct(values.trimStart) }} />
      <div class="sb-wave-editor-dim is-end" style={{ width: pct(duration - values.trimEnd) }} />

      {/* Fade zones */}
      <div
        class="sb-wave-editor-fade"
        style={{ left: pct(values.trimStart), width: pct(values.fadeIn) }}
      />
      <div
        class="sb-wave-editor-fade"
        style={{ left: pct(values.trimEnd - values.fadeOut), width: pct(values.fadeOut) }}
      />

      {/* Playback position (APG Media Seek Slider): the playhead while the preview plays, else
          where the next preview starts */}
      <div
        class="sb-wave-editor-playhead"
        role="slider"
        tabIndex={0}
        aria-label="Playback position"
        aria-valuemin={values.trimStart}
        aria-valuemax={values.trimEnd}
        aria-valuenow={position}
        aria-valuetext={spoken(position)}
        style={{ left: pct(position) }}
        onKeyDown={(e) => {
          const target = stepTarget(position, values.trimStart, values.trimEnd, e.key);
          if (target === null) return;
          e.preventDefault();
          onSeek(target);
        }}
      />

      {HANDLES.map(({ handle, label, id, lane }) => {
        const at = handlePosition(values, handle);
        const [lo, hi] = handleRange(values, handle, duration);
        return (
          <div
            key={handle}
            class={`sb-wave-editor-handle ${lane}`}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={lo}
            aria-valuemax={hi}
            aria-valuenow={at}
            aria-valuetext={spoken(at)}
            data-testid={`waveform-editor-${id}-slider`}
            style={{ left: pct(at) }}
            onPointerDown={handlePointerDown}
            onPointerMove={(e) => handlePointerMove(handle, e)}
            onKeyDown={(e) => handleKeyDown(handle, e)}
          />
        );
      })}
    </div>
  );
}
