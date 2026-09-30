// ─────────────────────────────────────────────────────────────────────────────
// UndoToast — temporary notification with timed UNDO action
//
// Renders above the StatusBar (fixed bottom). Auto-dismisses after durationMs.
// Caller is responsible for handling onUndo (restore data snapshot + IDB).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

interface UndoToastProps {
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({
  message,
  durationMs = 6000,
  onUndo,
  onDismiss,
}: UndoToastProps): JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [durationMs, onDismiss]);

  function handleUndo() {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    onUndo();
    onDismiss();
  }

  return (
    <div
      class="sb-undo-toast"
      data-testid="undo-toast"
      style={{ '--undo-duration': `${durationMs}ms` } as Record<string, string>}
    >
      <span class="sb-undo-message">{message}</span>
      <button
        class="sb-btn sb-btn-sm sb-btn-primary sb-undo-btn"
        data-testid="undo-toast-undo-button"
        onClick={handleUndo}
      >
        UNDO
      </button>
      <div class="sb-undo-toast-progress" />
    </div>
  );
}
