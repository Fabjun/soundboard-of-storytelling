/**
 * @fileoverview UndoNoticeRegion — where a screen shows the undo toast (Slice 18, ADR-0086)
 *
 * The toast of src/state/undoNotice.ts, inside a status region that stays in the page, so screen
 * readers read the toast when it appears (WCAG 4.1.3, ARIA22). A screen renders it once; the
 * toast goes when the screen is left or its `scope` changes (another board), so an UNDO never
 * acts on something the screen no longer shows.
 */

import { useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import { clearUndoNotice, undoNotice } from '../state/undoNotice';
import { UndoToast } from './UndoToast';

interface UndoNoticeRegionProps {
  /** What the toast belongs to (a board id, a screen name) — a change hides it. */
  scope: string;
  /** False hides the toast without clearing it (GAME on the board screen). */
  shown?: boolean;
}

/** Shows the undo toast of the current deletion, while `shown`, in a status region. */
export function UndoNoticeRegion({ scope, shown = true }: UndoNoticeRegionProps): JSX.Element {
  useEffect(() => () => clearUndoNotice(), [scope]);
  const notice = undoNotice.value;
  return (
    <div role="status">
      {shown && notice && (
        <UndoToast
          key={notice.id}
          message={notice.message}
          onUndo={notice.undo}
          onDismiss={() => clearUndoNotice(notice.id)}
        />
      )}
    </div>
  );
}
