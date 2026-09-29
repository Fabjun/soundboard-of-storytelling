// components.jsx — Reusable building blocks + a "Components" artboard
// that documents them. The screens import directly from window.* below.

// ── Pixel-flame logo (the big home-screen one) ───────────────────
function FlameLogo({ size = 80 }) {
  return (
    <div style={{ color: 'var(--sb-flame)', filter: 'drop-shadow(0 0 14px rgba(232,130,30,.55))' }}>
      <PixelIcon name="flame" size={size} />
    </div>
  );
}

// ── Menu row (used on the Home screen, and as a doc sample) ──────
function MenuRow({ icon, title, sub, active, danger, right, style }) {
  return (
    <div className={'sb-menu-row' + (active ? ' is-active' : '')} style={{
      ...(danger ? { '--pix-border': 'var(--sb-border-danger)' } : null),
      ...(style || null),
    }}>
      {icon && (
        <div className="sb-icon" style={{ color: danger ? 'var(--sb-danger)' : 'var(--sb-amber)' }}>
          <PixelIcon name={icon} size={28} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="sb-row-title" style={{ color: danger ? 'var(--sb-danger)' : (active ? 'var(--sb-amber)' : 'var(--sb-text)') }}>
          {title}
        </div>
        {sub && <div className="sb-row-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ── Single pad ───────────────────────────────────────────────────
function Pad({ title, meta, hotkey, playing, loop, color, tag }) {
  return (
    <div className={'sb-pad' + (playing ? ' is-playing' : '') + (loop && !playing ? ' is-loop' : '')}>
      {hotkey && <span className="sb-pad-key">{hotkey}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: color || 'var(--sb-amber)' }}>
          <PixelIcon name={loop ? 'loop' : 'play'} size={16} />
        </div>
        {tag && (
          <span style={{
            fontFamily: 'var(--sb-font-mono)', fontSize: 9, color: 'var(--sb-text-mute)',
            textTransform: 'uppercase', letterSpacing: '.05em',
          }}>{tag}</span>
        )}
      </div>
      <div>
        <div className="sb-pad-title">{title}</div>
        {meta && <div className="sb-pad-meta">{meta}</div>}
        {playing && (
          <div className="sb-slider" style={{ marginTop: 8 }}>
            <div className="sb-slider-fill" style={{ width: '38%' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────
function Pill({ on, children }) {
  return (
    <span className={'sb-pill' + (on ? ' is-on' : '')}>
      <span className="sb-dot" />
      {children}
    </span>
  );
}

// ── Slider with label ────────────────────────────────────────────
function LabelSlider({ label, value = 0.5, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="sb-caption" style={{ color: 'var(--sb-text-dim)' }}>{label}</span>
        <span className="sb-caption" style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(value * 100)}%</span>
      </div>
      <div className="sb-slider">
        <div className="sb-slider-fill" style={{ width: (value * 100) + '%', background: color || 'var(--sb-amber)' }} />
        <div className="sb-slider-thumb" style={{ left: (value * 100) + '%', background: color || 'var(--sb-amber)' }} />
      </div>
    </div>
  );
}

// ── Toggle row ──────────────────────────────────────────────────
function ToggleRow({ label, sub, on }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--sb-border-soft)' }}>
      <div>
        <div style={{ fontFamily: 'var(--sb-font-ui)', fontWeight: 600, fontSize: 13, color: 'var(--sb-text)' }}>{label}</div>
        {sub && <div className="sb-mono" style={{ fontSize: 11 }}>{sub}</div>}
      </div>
      <div className={'sb-toggle' + (on ? ' is-on' : '')} />
    </div>
  );
}

// ── Tab bar ─────────────────────────────────────────────────────
function Tabs({ items, active }) {
  return (
    <div className="sb-tabs">
      {items.map((it) => (
        <div key={it} className={'sb-tab' + (it === active ? ' is-active' : '')}>{it}</div>
      ))}
    </div>
  );
}

// ── Top bar (used on Board, Library, Settings) ───────────────────
function TopBar({ title, sub, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 22px',
      borderBottom: '1px solid var(--sb-border)',
      background: 'var(--sb-bg-deep)',
    }}>
      <div style={{ color: 'var(--sb-flame)' }}>
        <PixelIcon name="flame" size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="sb-display" style={{ fontSize: 22 }}>{title}</div>
        {sub && <div className="sb-mono" style={{ fontSize: 12 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ── Mixer strip / now-playing row ────────────────────────────────
function MixerStrip({ title, sub, value, loop, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px',
      background: 'var(--sb-bg-panel-sunk)',
      border: '1px solid var(--sb-border)',
      borderRadius: 8,
    }}>
      <div style={{ color: color || 'var(--sb-amber)' }}>
        <PixelIcon name={loop ? 'loop' : 'play'} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="sb-label" style={{ fontSize: 12, color: color || 'var(--sb-amber)' }}>{title}</div>
        <div className="sb-mono" style={{ fontSize: 11 }}>{sub}</div>
      </div>
      <div style={{ width: 100 }}>
        <div className="sb-slider"><div className="sb-slider-fill" style={{ width: (value || 0.6) * 100 + '%', background: color || 'var(--sb-amber)' }} /></div>
      </div>
      <div style={{ color: 'var(--sb-text-mute)' }}>
        <PixelIcon name="stop" size={12} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ComponentsArtboard — documents the kit
// ════════════════════════════════════════════════════════════════
function ComponentsArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display" style={{ fontSize: 40 }}>Components</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // the kit. Every screen is composed from these atoms.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* Buttons */}
        <section>
          <SectionLabel glyph="sparkle">BUTTONS</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <button className="sb-btn sb-btn-filled"><PixelIcon name="save" size={12} /> SAVE</button>
            <button className="sb-btn sb-btn-primary"><PixelIcon name="play" size={12} /> START</button>
            <button className="sb-btn"><PixelIcon name="download" size={12} /> IMPORT</button>
            <button className="sb-btn sb-btn-ghost">CANCEL</button>
            <button className="sb-btn sb-btn-danger"><PixelIcon name="save" size={12} /> BACKUP · NEVER</button>
          </div>
          <div className="sb-caption">filled · primary · default · ghost · danger</div>
        </section>

        {/* Pills */}
        <section>
          <SectionLabel glyph="tag">PILLS</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <Pill on>PLAYING</Pill>
            <Pill>STOPPED</Pill>
            <Pill on>LOOP</Pill>
            <Pill>AMBIENCE</Pill>
            <Pill>STINGER</Pill>
          </div>
          <div className="sb-caption">used for state &amp; tag chips</div>
        </section>

        {/* Menu rows */}
        <section style={{ gridColumn: 'span 2' }}>
          <SectionLabel glyph="flame">MENU ROW · HOME PATTERN</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MenuRow icon="flame" title="BOARD" sub="Board 1" active />
            <MenuRow icon="book" title="LIBRARY" sub="Audio, icons &amp; boards" />
            <MenuRow icon="cog" title="SETTINGS" sub="Theme, font size &amp; start mode" />
            <MenuRow icon="bulb" title="TIPS &amp; TRICKS" sub="Controls and key bindings" />
          </div>
        </section>

        {/* Pads */}
        <section style={{ gridColumn: 'span 2' }}>
          <SectionLabel glyph="diamond">PADS — IDLE · PLAYING · LOOPING</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <Pad title="Tavern Door" meta="0:04 · one-shot" hotkey="F1" tag="STINGER" />
            <Pad title="Rain Heavy" meta="2:14 · ambient" hotkey="F2" tag="AMBIENT" playing />
            <Pad title="Fireplace" meta="∞ · loop" hotkey="F3" tag="LOOP" loop />
            <Pad title="Sword Clash" meta="0:02" hotkey="F4" tag="STINGER" />
          </div>
        </section>

        {/* Mixer */}
        <section style={{ gridColumn: 'span 2' }}>
          <SectionLabel glyph="sparkle">MIXER STRIP</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MixerStrip title="RAIN · HEAVY" sub="ambient · 38% played" value={0.4} />
            <MixerStrip title="FIREPLACE" sub="loop · master 60%" value={0.6} loop />
          </div>
        </section>

        {/* Toggles + Slider */}
        <section>
          <SectionLabel glyph="key">TOGGLES</SectionLabel>
          <div className="sb-card" style={{ padding: '0 14px' }}>
            <ToggleRow label="Crossfade" sub="Fade between scenes" on />
            <ToggleRow label="Start in Edit Mode" sub="Open the board ready to arrange" />
          </div>
        </section>
        <section>
          <SectionLabel glyph="potion">SLIDERS</SectionLabel>
          <div className="sb-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <LabelSlider label="MASTER" value={0.72} />
            <LabelSlider label="AMBIENT BUS" value={0.45} />
            <LabelSlider label="STINGER BUS" value={0.9} />
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, {
  FlameLogo, MenuRow, Pad, Pill, LabelSlider, ToggleRow, Tabs, TopBar, MixerStrip, ComponentsArtboard,
});
