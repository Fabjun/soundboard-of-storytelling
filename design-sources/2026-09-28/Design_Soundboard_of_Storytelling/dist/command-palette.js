// dist/command-palette.js — Command palette (Cmd/Ctrl + K).
// Vanilla JS · self-contained · attaches to <body>.
//
// Usage:
//
//   const cp = createCommandPalette({
//     // Build the list of searchable items once at app boot. Re-call
//     // setItems(newList) whenever pads/scenes/boards change.
//     items: [
//       { kind: 'pad-loop',  label: 'Rain Heavy',  meta: 'F2 · loop · 2:14', run: () => triggerPad('p2') },
//       { kind: 'pad-single',label: 'Thunder',     meta: 'F8 · 0:03',         run: () => triggerPad('p8') },
//       { kind: 'scene',     label: 'The Tavern',  meta: 'Board 1 · 16 pads', run: () => openScene(2) },
//       { kind: 'action',    label: 'Stop all',    meta: 'ENTER',             run: () => stopAll() },
//       { kind: 'setting',   label: 'Set crossfade duration…',                 meta: 'Settings → Audio', run: () => openSetting('audio.crossfade') },
//     ],
//     // Optional — hotkey, defaults to Cmd/Ctrl+K
//     hotkey: (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k',
//   });
//
//   cp.open();        // also auto-opens on the hotkey
//   cp.close();
//   cp.setItems(newList);   // refresh items
//
// Behaviour:
//   - ↑ / ↓     — move selection
//   - Enter     — run selected item
//   - Esc       — close
//   - Any text  — substring filter (case-insensitive)
//   - Click row — select + run

(function (root) {
  'use strict';

  // Map of result.kind → icon id (for the leftmost icon)
  const KIND_ICONS = {
    'pad-single':   'play',
    'pad-loop':     'loop',
    'pad-playlist': 'scroll',
    'pad-combo':    'rune',
    'scene':        'moon',
    'action':       'flame',
    'setting':      'cog',
    'board':        'grid',
    'audio':        'volume',
  };

  // Human-readable label per kind (top of each result row)
  const KIND_LABELS = {
    'pad-single':   'PAD',
    'pad-loop':     'PAD',
    'pad-playlist': 'PAD',
    'pad-combo':    'PAD',
    'scene':        'SCENE',
    'action':       'ACTION',
    'setting':      'SETTING',
    'board':        'BOARD',
    'audio':        'AUDIO',
  };

  function createCommandPalette(opts) {
    opts = opts || {};
    let items = opts.items || [];
    const hotkey = opts.hotkey || ((e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k');

    // ── DOM scaffold ────────────────────────────────────────
    const searchSvg = root.pixelIcon ? root.pixelIcon('search', 14, 'currentColor') : '';
    const enterSvg  = root.pixelIcon ? root.pixelIcon('enter',  12, 'currentColor') : '';

    const overlay = document.createElement('div');
    overlay.className = 'cp-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `<div class="cp" role="dialog" aria-label="Command palette">
      <div class="cp__input-row">
        <span class="cp__search-icon">${searchSvg}</span>
        <input class="cp__input" type="text" placeholder="Type to search pads, scenes, actions…" autocomplete="off" spellcheck="false">
        <span class="cp__count">0 · enter to run</span>
      </div>
      <div class="cp__results" role="listbox" aria-label="Results"></div>
      <div class="cp__footer">
        <span>↑↓ navigate</span>
        <span>↵ run</span>
        <span class="cp__esc">esc close</span>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    const input    = overlay.querySelector('.cp__input');
    const countEl  = overlay.querySelector('.cp__count');
    const resultsE = overlay.querySelector('.cp__results');

    let filtered = [];
    let selectedIndex = 0;

    // ── Filtering ───────────────────────────────────────────
    function filter(query) {
      const q = String(query || '').trim().toLowerCase();
      if (!q) { filtered = items.slice(0, 40); return; }
      // Score = substring position (earlier = better)
      const scored = [];
      for (let i = 0; i < items.length; i++) {
        const lbl = String(items[i].label || '').toLowerCase();
        const pos = lbl.indexOf(q);
        if (pos !== -1) scored.push({ item: items[i], pos: pos });
      }
      scored.sort((a, b) => a.pos - b.pos);
      filtered = scored.slice(0, 40).map((s) => s.item);
    }

    function render() {
      countEl.textContent = filtered.length + ' · enter to run';
      if (filtered.length === 0) {
        resultsE.innerHTML = '<div class="cp__empty">// no matches</div>';
        return;
      }
      const q = input.value.trim();
      let html = '';
      for (let i = 0; i < filtered.length; i++) {
        const it = filtered[i];
        const iconId = KIND_ICONS[it.kind] || 'diamond';
        const iconSvg = root.pixelIcon ? root.pixelIcon(iconId, 14, 'currentColor') : '';
        const kindLbl = KIND_LABELS[it.kind] || (it.kind || '').toUpperCase();
        html += `<button class="cp__result${i === selectedIndex ? ' cp__result--selected' : ''}"
            data-kind="${escapeAttr(it.kind || '')}"
            data-index="${i}"
            type="button"
            role="option"
            aria-selected="${i === selectedIndex}">
          <span class="cp__icon">${iconSvg}</span>
          <span class="cp__kind">${escapeHtml(kindLbl)}</span>
          <span class="cp__label">${highlight(it.label || '', q)}</span>
          <span class="cp__meta">${escapeHtml(it.meta || '')}</span>
          <span class="cp__enter">${enterSvg}</span>
        </button>`;
      }
      resultsE.innerHTML = html;

      // Scroll selected into view if needed
      const sel = resultsE.querySelector('.cp__result--selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    // Highlight the matched substring inside the label
    function highlight(text, q) {
      if (!q) return escapeHtml(text);
      const lc = text.toLowerCase();
      const pos = lc.indexOf(q.toLowerCase());
      if (pos === -1) return escapeHtml(text);
      const a = text.slice(0, pos);
      const b = text.slice(pos, pos + q.length);
      const c = text.slice(pos + q.length);
      return escapeHtml(a) + '<mark>' + escapeHtml(b) + '</mark>' + escapeHtml(c);
    }

    // ── Selection navigation ────────────────────────────────
    function moveSelection(delta) {
      if (filtered.length === 0) return;
      selectedIndex = (selectedIndex + delta + filtered.length) % filtered.length;
      render();
    }

    function runSelected() {
      const it = filtered[selectedIndex];
      if (!it) return;
      close();
      try {
        if (typeof it.run === 'function') it.run();
      } catch (err) { console.error('[cp] run failed:', err); }
    }

    // ── Open / close ────────────────────────────────────────
    function open() {
      filter('');
      selectedIndex = 0;
      input.value = '';
      overlay.hidden = false;
      requestAnimationFrame(() => { input.focus(); render(); });
    }
    function close() {
      overlay.hidden = true;
    }
    function isOpen() { return !overlay.hidden; }

    // ── Event wiring ────────────────────────────────────────
    input.addEventListener('input', () => {
      filter(input.value);
      selectedIndex = 0;
      render();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape')      { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); moveSelection(-1); }
      else if (e.key === 'Enter')     { e.preventDefault(); runSelected(); }
    });

    resultsE.addEventListener('click', (e) => {
      const row = e.target.closest('.cp__result');
      if (!row) return;
      selectedIndex = parseInt(row.dataset.index, 10);
      runSelected();
    });

    // Click outside the .cp panel closes it
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Global hotkey listener
    document.addEventListener('keydown', (e) => {
      if (hotkey(e)) {
        e.preventDefault();
        if (isOpen()) close(); else open();
      }
    });

    // ── Public API ──────────────────────────────────────────
    return {
      open: open,
      close: close,
      isOpen: isOpen,
      setItems: (next) => { items = next || []; if (isOpen()) { filter(input.value); render(); } },
      element: overlay,
    };
  }

  // ── Helpers ───────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  root.createCommandPalette = createCommandPalette;
})(typeof window !== 'undefined' ? window : this);
