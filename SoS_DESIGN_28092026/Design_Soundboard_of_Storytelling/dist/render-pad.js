// dist/render-pad.js — Template-string PAD renderer.
// Vanilla JS · returns an HTML STRING ready for innerHTML.
// Pair with dist/pad.css + dist/icons.js.
//
// USAGE:
//   const html = renderPad({
//     type:   'loop',          // 'single' | 'loop' | 'playlist' | 'combo'
//     name:   'Rain Heavy',
//     hotkey: 'F2',
//     meta:   '∞ · loop',
//     hot:    true,            // playing
//     setup:  false,           // SETUP mode
//   });
//   container.innerHTML = html;
//
//   Or many at once:
//   container.innerHTML = pads.map(renderPad).join('');

(function (root) {
  'use strict';

  // Icon used for the type tag
  const TYPE_ICONS = {
    single:   'play',
    loop:     'loop',
    playlist: 'scroll',
    combo:    'rune',
  };

  function renderPad(p) {
    const type    = p.type || 'single';
    const cls     = [
      'pad',
      'pad--' + type,
      p.hot   ? 'pad--hot'   : '',
      p.setup ? 'pad--setup' : '',
    ].filter(Boolean).join(' ');

    const icon    = TYPE_ICONS[type] || 'play';
    const iconSvg = root.pixelIcon ? root.pixelIcon(icon, 12, 'currentColor') : '';

    // Drag handle dots — only rendered for SETUP mode (CSS hides them otherwise)
    const dragDots = `<svg class="pad__drag" viewBox="0 0 9 11" fill="currentColor" aria-hidden="true">
        <circle cx="2" cy="2"   r="1.1"/><circle cx="7" cy="2"   r="1.1"/>
        <circle cx="2" cy="5.5" r="1.1"/><circle cx="7" cy="5.5" r="1.1"/>
        <circle cx="2" cy="9"   r="1.1"/><circle cx="7" cy="9"   r="1.1"/>
      </svg>`;

    // 10-bar level meter — only added to hot pads
    const meter = p.hot
      ? `<div class="pad__meter">${'<i></i>'.repeat(10)}</div>`
      : '';

    // Hotkey badge — hidden by CSS when .pad--setup is present
    const hotkey = p.hotkey
      ? `<span class="pad__hotkey">${escapeHtml(p.hotkey)}</span>`
      : '';

    return `<div class="${cls}" data-pad-type="${type}"${p.id ? ` data-pad-id="${escapeAttr(p.id)}"` : ''}>
      ${dragDots}
      ${hotkey}
      <div class="pad__type">${iconSvg}<span>${type.toUpperCase()}</span></div>
      <div>
        <div class="pad__title">${escapeHtml(p.name || 'Untitled')}</div>
        ${p.meta ? `<div class="pad__meta">${escapeHtml(p.meta)}</div>` : ''}
        ${meter}
      </div>
    </div>`;
  }

  // ── Helpers ─────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  root.renderPad = renderPad;
})(typeof window !== 'undefined' ? window : this);
