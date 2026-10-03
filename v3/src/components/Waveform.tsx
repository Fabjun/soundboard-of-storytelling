/**
 * @fileoverview Waveform — compact peak-bar renderer
 *
 * Renders stored peak values (30 numbers in [0,1]) as a row of vertical bars.
 * Never decodes audio; only uses pre-computed data stored at upload time.
 */

interface WaveformProps {
  /** 30 peak values in [0, 1], from LibraryItemMeta.peaks */
  peaks: number[];
  /** Playback progress [0, 1] — bars before this position are highlighted */
  progress?: number;
  /** Container height in px */
  height?: number;
  /** Reduce opacity for non-selected rows */
  dim?: boolean;
}

/** Draws an audio file's stored peaks as bars; bars before `progress` are highlighted. */
export function Waveform({ peaks, progress = 0, height = 28, dim = false }: WaveformProps) {
  const n = peaks.length;

  return (
    <div class="sb-waveform" style={{ height: `${height}px`, opacity: dim ? 0.45 : 1 }}>
      {peaks.map((peak, i) => {
        const barHeight = Math.max(2, Math.round(peak * height));
        const played = n > 0 && i / n < progress;
        return (
          <div
            key={i}
            class="sb-waveform-bar"
            style={{
              height: `${barHeight}px`,
              background: played ? 'var(--gold)' : 'var(--text-mute)',
            }}
          />
        );
      })}
    </div>
  );
}
