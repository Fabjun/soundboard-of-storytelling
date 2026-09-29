// dist/quick-access.js — Quick Access strip renderer + minimal logic.
// Vanilla JS · returns an HTML STRING ready for innerHTML.
// Pair with dist/quick-access.css + dist/icons.js.
//
// USAGE:
//
//   const html = renderQuickAccessStrip({
//     pinned: [
//       { id: 'p1', type: 'single',   name: 'Dice Roll', hotkey: 'Cmd+1' },
//       { id: 'p2', type: 'loop',     name: 'Heartbeat', hotkey: 'Cmd+5', hot: true },
//       { id: 'p3', type: 'combo',    name: 'Stinger',   hotkey: 'Cmd+6' },
//     ],
//     capacity: 8,   // total slots (empty ones rendered as dashed placeholders)
//   });
//   container.innerHTML = html;
//
//   // Click handling:
//   container.addEventListener('click', (e) => {
//     const item = e.target.closest('.qa-item[data-pad-id]');
//     if (!item) return;
//     const id = item.dataset.padId;
//     yourTriggerPad(id);
//   });

(function (root) {
  'use strict';

  const TYPE_ICON = {
    single:   'play',
    loop:     'loop',
    playlist: 'scroll',
    combo:    'rune',
  };

  function renderQuickAccessStrip(opts) {
    opts = opts || {};
    const pinned   = opts.pinned || [];
    const capacity = opts.capacity || 8;
    const label    = opts.label || 'QUICK ACCESS';

    const items = [];
    for (let i = 0; i < pinned.length; i++) {
      items.push(renderQuickAccessItem(pinned[i]));
    }
    // Empty slots — rendered as dashed placeholders so the user sees room to pin more
    for (let i = pinned.length; i < Math.min(capacity, pinned.length + 1); i++) {
      items.push(renderEmptySlot());
    }

    const pinIcon = root.pixelIcon ? root.pixelIcon('pin', 12, 'currentColor') : '';

    return `<div class="qa-strip" role="toolbar" aria-label="Quick access pinned pads">
      <div class="qa-strip__head">${pinIcon}<span>${escapeHtml(label)}</span></div>
      <div class="qa-strip__items">${items.join('')}</div>
      <span class="qa-strip__count">${pinned.length} / ${capacity} pinned</span>
    </div>`;
  }

  function renderQuickAccessItem(p) {
    const type   = p.type || 'single';
    const cls    = [
      'qa-item',
      'qa-item--' + type,
      p.hot ? 'qa-item--hot' : '',
    ].filter(Boolean).join(' ');

    const iconId  = TYPE_ICON[type] || 'play';
    const iconSvg = root.pixelIcon ? root.pixelIcon(iconId, 11, 'currentColor') : '';

    return `<button class="${cls}" data-pad-id="${escapeAttr(p.id || '')}" type="button" title="${escapeAttr(p.name || '')}">
      <span class="qa-item__icon">${iconSvg}</span>
      <span class="qa-item__name">${escapeHtml(p.name || '')}</span>
      ${p.hotkey ? `<span class="qa-item__key">${escapeHtml(p.hotkey)}</span>` : ''}
    </button>`;
  }

  function renderEmptySlot() {
    return `<button class="qa-item qa-item--empty" disabled tabindex="-1" aria-hidden="true">
      <span class="qa-item__name">pin a pad…</span>
    </button>`;
  }

  // ── Helpers ─────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  root.renderQuickAccessStrip = renderQuickAccessStrip;
  root.renderQuickAccessItem  = renderQuickAccessItem;
})(typeof window !== 'undefined' ? window : this);
