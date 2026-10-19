/**
 * @fileoverview UndoToast — temporary notification with timed UNDO action
 *
 * Renders above the StatusBar (fixed bottom). Auto-dismisses after durationMs, counted from when
 * it appears. Caller is responsible for handling onUndo (src/state/undoNotice.ts).
 */

import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

interface UndoToastProps {
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

/**
 * Shows `message` with an UNDO button and closes itself after `durationMs`; the action it offers
 * to undo is already saved, so closing loses nothing.
 */
export function UndoToast({
  message,
  durationMs = 6000,
  onUndo,
  onDismiss,
}: UndoToastProps): JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest onDismiss, read when the time is up: callers pass a new function on every render,
  // and a timer that restarted with each one kept the toast as long as the screen re-rendered
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss.current(), durationMs);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [durationMs]);

  function handleUndo() {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    onUndo();
    onDismiss();
  }

  return (
    <div
      class="sb-toast"
      data-testid="undo-toast"
      style={{ '--toast-duration': `${durationMs}ms` } as Record<string, string>}
    >
      <span class="sb-toast-message">{message}</span>
      <button
        class="sb-btn sb-btn-sm sb-btn-primary sb-toast-btn"
        data-testid="undo-toast-undo-button"
        onClick={handleUndo}
      >
        UNDO
      </button>
      <div class="sb-toast-progress" />
    </div>
  );
}
