// v11-mobile.jsx — Honest mobile companions for the design system.
// Strategy: phone screens reuse every token / atom / type system from
// the desktop layouts but lay them out vertically with a 56px persistent
// bottom transport bar and bottom-sheet editors. Hit targets ≥ 44px
// (Apple HIG / Material) everywhere. The same atmosphere effects work,
// just scoped tighter.

// ════════════════════════════════════════════════════════════════
// Phone shell helpers — top status bar + bottom indicator
// ════════════════════════════════════════════════════════════════
function PhoneStatusBar({ light = true }) {
  return (
    <div style={{
      height: 28,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      color: light ? 'var(--gold-bright)' : 'var(--text)',
      letterSpacing: '.04em',
      background: 'transparent',
      position: 'relative', zIndex: 10,
    }}>
      <span style={{ fontWeight: 600 }}>21:42</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span>5G</span>
        <svg width="20" height="9" viewBox="0 0 20 9" fill="currentColor"><rect x="0" y="2" width="3" height="5"/><rect x="4" y="0" width="3" height="9"/><rect x="8" y="3" width="3" height="6"/><rect x="12" y="1" width="3" height="8"/></svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="18" height="9"/><rect x="2" y="2" width="13" height="6" fill="currentColor"/><rect x="20" y="3" width="1.5" height="4" fill="currentColor"/></svg>
      </div>
    </div>
  );
}
function PhoneHomeIndicator() {
  return (
    <div style={{
      height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', zIndex: 10,
    }}>
      <div style={{ width: 130, height: 4, background: 'var(--text)', opacity: .5, borderRadius: 2 }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MOBILE BOARD · GAME MODE
// What matters most on the phone — the live trigger surface.
// Layout:
//   ▸ chunky top bar (mode toggle, scene scroll, clock)
//   ▸ now-playing strip (collapsible)
//   ▸ 3-column pad grid (cards 110×100 with big readable type)
//   ▸ persistent transport bottom bar (STOP ALL · master · pause · next)
// ════════════════════════════════════════════════════════════════
function MobileBoardGame({ atmosphere = true }) {
  const PADS = [
    { type: 'single',   t: 'Tavern Door',  k: 'F1' },
    { type: 'loop',     t: 'Rain Heavy',   k: 'F2', hot: true },
    { type: 'loop',     t: 'Fireplace',    k: 'F3', hot: true },
    { type: 'single',   t: 'Sword Clash',  k: 'F4' },
    { type: 'single',   t: 'Wolf Howl',    k: 'F5' },
    { type: 'loop',     t: 'Crowd',        k: 'F6' },
    { type: 'playlist', t: 'Tavern Mix',   k: 'F7' },
    { type: 'single',   t: 'Thunder',      k: 'F8' },
    { type: 'combo',    t: 'Boss Reveal',  k: 'Q' },
    { type: 'single',   t: 'Door Slam',    k: 'W' },
    { type: 'playlist', t: 'Combat',       k: 'E' },
    { type: 'loop',     t: 'Whispers',     k: 'R' },
    { type: 'single',   t: 'Coin Drop',    k: 'T' },
    { type: 'single',   t: 'Owl Hoot',     k: 'Y' },
    { type: 'loop',     t: 'Wind',         k: 'U' },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{NOW_PLAYING_AURA_CSS}</style>
      <PhoneStatusBar />

      {/* Top bar — minimal, large hit targets */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        {/* Menu icon · 44×44 */}
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor"><rect x="0" y="0" width="20" height="2"/><rect x="0" y="6" width="20" height="2"/><rect x="0" y="12" width="20" height="2"/></svg>
        </div>
        {/* Mode pill — bigger on phone */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '4px 6px', border: '1px solid var(--gold)',
          fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.1em',
        }}>
          <span style={{ color: 'var(--text-mute)', padding: '2px 6px' }}>SETUP</span>
          <span style={{ color: 'var(--gold)', padding: '2px 8px', background: 'var(--gold)', mixBlendMode: 'normal' }}>
            <span style={{ color: 'var(--text-on-gold)' }}>GAME</span>
          </span>
        </div>
        <div style={{ flex: 1 }} />
        {/* Mini pocket-watch */}
        <div style={{ transform: 'scale(.65)', transformOrigin: 'center right', width: 80, marginRight: -16 }}>
          <PocketWatch mode="live" size={70} />
        </div>
      </div>

      {/* Scene scroller */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 14px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border-soft)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {[
          ['Approach',  false],
          ['Tavern',    true],
          ['Combat',    false],
          ['Boss',      false],
          ['Aftermath', false],
        ].map(([n, active]) => (
          <div key={n} style={{
            padding: '5px 12px',
            background: active ? 'var(--top)' : 'transparent',
            border: '1px solid ' + (active ? 'var(--gold)' : 'var(--border)'),
            borderLeft: active ? '3px solid var(--gold)' : '1px solid var(--border)',
            fontFamily: 'var(--font-ui)', fontSize: 12,
            color: active ? 'var(--gold)' : 'var(--text-dim)',
            letterSpacing: '.04em',
            whiteSpace: 'nowrap',
          }}>{n}</div>
        ))}
      </div>

      {/* Now-playing strip — collapsible */}
      <div style={{
        padding: '8px 12px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <PixelIcon name="sparkle" size={10} color="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--gold)', letterSpacing: '.14em' }}>NOW PLAYING · 2</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>▾</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MobileMixerRow type="loop" title="RAIN HEAVY" sub="0:42 / 2:14" value={0.5} />
          <MobileMixerRow type="loop" title="FIREPLACE"  sub="∞ · 0:12"   value={0.6} />
        </div>
      </div>

      {/* Pad grid */}
      <main className="sb-board-canvas" style={{
        flex: 1, overflow: 'auto', padding: 10,
        position: 'relative',
        background: 'radial-gradient(70% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.3) 100%), var(--surface)',
      }}>
        {atmosphere && <HearthGlow intensity={1} />}
        {atmosphere && <AmbientEmbers density={10} />}

        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {PADS.map((p) => (
            <div key={p.t} className={'sb-pad' + (p.hot ? ' is-hot' : '')} data-type={p.type} style={{
              '--pad-color': `var(--pad-${p.type})`,
              '--pad-glow': `var(--pad-${p.type}-glow)`,
              minHeight: 100,
              padding: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={12} color={`var(--pad-${p.type})`} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: `var(--pad-${p.type})`, letterSpacing: '.1em' }}>
                  {p.type.toUpperCase()}
                </span>
              </div>
              <div style={{ paddingLeft: 4 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', letterSpacing: '.04em', lineHeight: 1.1 }}>{p.t}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{p.k}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Persistent transport */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: 'var(--deep)',
        borderTop: '1px solid var(--gold-dim)',
      }}>
        {/* Stop all — 44×44 hit target */}
        <div style={{
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--raised)', border: '1px solid var(--blood)',
          color: 'var(--blood-bright)',
        }}>
          <PixelIcon name="stop" size={14} />
        </div>
        {/* Master volume — large touch target */}
        <div style={{ flex: 1, padding: '0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '.1em' }}>MASTER</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text)' }}>72</span>
          </div>
          <div className="sb-slider" style={{ height: 10 }}>
            <div className="sb-slider-fill" style={{ width: '72%' }} />
            <div className="sb-slider-thumb" style={{ left: '72%', width: 18, height: 18 }} />
          </div>
        </div>
        {/* Pause */}
        <div style={{
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--raised)', border: '1px solid var(--border)',
          color: 'var(--text-dim)',
        }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14 }}>∥∥</span>
        </div>
        {/* Cue next */}
        <div style={{
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--gold)', color: 'var(--text-on-gold)',
        }}>
          <PixelIcon name="loop" size={16} />
        </div>
      </div>

      <PhoneHomeIndicator />
    </div>
  );
}

function MobileMixerRow({ type, title, sub, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px',
      background: 'var(--raised)',
      borderLeft: `3px solid var(--pad-${type})`,
    }}>
      <PixelIcon name={type === 'loop' ? 'loop' : 'play'} size={11} color={`var(--pad-${type})`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: `var(--pad-${type})`, letterSpacing: '.08em', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)' }}>{sub}</div>
      </div>
      <div style={{ width: 50 }}>
        <div className="sb-slider" style={{ height: 4 }}>
          <div className="sb-slider-fill" style={{ width: (value * 100) + '%', background: `var(--pad-${type})` }} />
        </div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>{Math.round(value * 100)}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MOBILE BOARD · SETUP MODE
// Same layout, with: dashed PAD borders, drag handles, a floating
// "+ ADD PAD" button bottom-right, and the transport replaced by a
// SETUP toolbar (save / undo / grid).
// ════════════════════════════════════════════════════════════════
function MobileBoardSetup() {
  const PADS = [
    { type: 'single',   t: 'Tavern Door' },
    { type: 'loop',     t: 'Rain Heavy' },
    { type: 'loop',     t: 'Fireplace' },
    { type: 'single',   t: 'Sword Clash' },
    { type: 'single',   t: 'Wolf Howl' },
    { type: 'loop',     t: 'Crowd' },
    { type: 'playlist', t: 'Tavern Mix' },
    { type: 'single',   t: 'Thunder' },
    { type: 'combo',    t: 'Boss Reveal' },
    { type: 'single',   t: 'Door Slam' },
    { type: 'playlist', t: 'Combat' },
    { type: 'loop',     t: 'Whispers' },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PhoneStatusBar />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--mode-setup)',
      }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mode-setup)' }}>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor"><rect x="0" y="0" width="20" height="2"/><rect x="0" y="6" width="20" height="2"/><rect x="0" y="12" width="20" height="2"/></svg>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '4px 6px', border: '1px solid var(--mode-setup)',
          fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.1em',
        }}>
          <span style={{ color: 'var(--mode-setup)', padding: '2px 8px', background: 'rgba(109,181,184,.18)' }}>SETUP</span>
          <span style={{ color: 'var(--text-mute)', padding: '2px 6px' }}>GAME</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mode-setup)' }}>
          <PixelIcon name="search" size={14} />
        </div>
      </div>

      {/* Selection info */}
      <div style={{
        padding: '8px 14px',
        background: 'rgba(109,181,184,.05)',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <PixelIcon name="edit" size={11} color="var(--mode-setup)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--mode-setup)', letterSpacing: '.1em' }}>
          THE TAVERN · 12 PADS
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>3 × 4 grid</span>
      </div>

      {/* Grid */}
      <main className="sb-grid-bg" style={{
        flex: 1, overflow: 'auto', padding: 10,
        background: 'var(--surface)',
        position: 'relative',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {PADS.map((p, i) => (
            <div key={p.t} className="sb-pad is-setup" data-type={p.type} style={{
              '--pad-color': `var(--pad-${p.type})`,
              minHeight: 92,
              padding: 8,
              position: 'relative',
              border: i === 1 ? '2px solid var(--gold)' : undefined,
            }}>
              {/* Drag handle */}
              <span style={{
                position: 'absolute', top: 4, left: 4,
                color: 'var(--mode-setup)', opacity: .8,
              }}>
                <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/><circle cx="2" cy="5.5" r="1.1"/><circle cx="7" cy="5.5" r="1.1"/><circle cx="2" cy="9" r="1.1"/><circle cx="7" cy="9" r="1.1"/></svg>
              </span>
              {/* Selected indicator */}
              {i === 1 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: 'var(--gold)' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 14, marginTop: 6 }}>
                <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={11} color={`var(--pad-${p.type})`} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, color: `var(--pad-${p.type})`, letterSpacing: '.1em' }}>
                  {p.type.toUpperCase()}
                </span>
              </div>
              <div style={{ paddingLeft: 4, marginTop: 4 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)', letterSpacing: '.04em', lineHeight: 1.1 }}>{p.t}</div>
              </div>
            </div>
          ))}
          {/* Add-pad slot */}
          <div style={{
            minHeight: 92, border: '1px dashed var(--mode-setup)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--mode-setup)', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>+</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.1em' }}>ADD</span>
          </div>
        </div>
      </main>

      {/* Floating action bar — only appears when something is selected */}
      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 32,
        background: 'var(--deep)',
        border: '2px solid var(--gold)',
        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', gap: 4,
        padding: 6,
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', padding: '0 6px', letterSpacing: '.08em' }}>1 SEL</span>
        <FabIcon glyph="edit" />
        <FabIcon glyph="tag" />
        <FabIcon glyph="loop" />
        <FabIcon glyph="diamond" />
        <FabIcon glyph="skull" danger />
      </div>

      <PhoneHomeIndicator />
    </div>
  );
}
function FabIcon({ glyph, danger }) {
  return (
    <div style={{
      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--raised)',
      border: '1px solid ' + (danger ? 'var(--blood)' : 'var(--border)'),
      color: danger ? 'var(--blood-bright)' : 'var(--text-dim)',
    }}>
      <PixelIcon name={glyph} size={13} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MOBILE PAD EDITOR · BOTTOM SHEET that takes ~85% of the screen.
// SAVE / DELETE always visible at top, scrolling content below.
// Critical: every interactive thing >= 44px tall.
// ════════════════════════════════════════════════════════════════
function MobilePadEditor() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(0,0,0,.6)' }}>
      <PhoneStatusBar />

      {/* Dim background hint of board */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 10,
          opacity: .25,
          pointerEvents: 'none',
        }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--raised)', border: '1px solid var(--border)', minHeight: 80 }} />
          ))}
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{
        background: 'var(--surface)',
        border: '2px solid var(--gold)',
        borderBottom: 'none',
        marginBottom: -20,
        boxShadow: '0 -12px 36px rgba(0,0,0,.6)',
        height: '78%',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Grab handle */}
        <div style={{ padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, background: 'var(--gold-dim)' }} />
        </div>

        {/* Sticky toolbar — same pattern as desktop refined */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--deep)',
        }}>
          <MiniPad type="loop" name="WIND" hk="%" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.14em' }}>EDITING S-PAD · 03</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text)' }}>Wind</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 4px', background: 'var(--sunk)', border: '1px solid var(--border-soft)', color: 'var(--text-dim)' }}>%</span>
            </div>
          </div>
        </div>

        {/* Action row — always visible */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr auto',
          gap: 6, padding: '8px 12px',
          background: 'var(--deep)',
          borderBottom: '1px solid var(--border)',
        }}>
          <button className="sb-btn sb-btn-ghost" style={{ minHeight: 44, fontSize: 13 }}>
            <PixelIcon name="play" size={11} /> PREVIEW
          </button>
          <button className="sb-btn sb-btn-filled" style={{ minHeight: 44, fontSize: 13 }}>
            <PixelIcon name="save" size={11} /> SAVE
          </button>
          <button className="sb-btn sb-btn-danger" style={{ minHeight: 44, width: 56 }}>
            <PixelIcon name="skull" size={11} />
          </button>
        </div>

        {/* Scrolling content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
          {/* Type selector */}
          <SectionLabel glyph="diamond">TYPE</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
            {[
              { t: 'single', l: 'SOLO' },
              { t: 'loop',   l: 'LOOP', active: true },
              { t: 'playlist', l: 'LIST' },
              { t: 'combo', l: 'CHAIN' },
            ].map((m) => (
              <div key={m.t} style={{
                padding: '10px 0', textAlign: 'center',
                background: m.active ? `var(--pad-${m.t}-soft)` : 'var(--raised)',
                border: '1px solid ' + (m.active ? `var(--pad-${m.t})` : 'var(--border)'),
                borderLeft: m.active ? `3px solid var(--pad-${m.t})` : '1px solid var(--border)',
                minHeight: 44,
              }}>
                <PixelIcon name={m.t === 'loop' ? 'loop' : m.t === 'playlist' ? 'scroll' : m.t === 'combo' ? 'rune' : 'play'} size={12} color={`var(--pad-${m.t})`} />
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: m.active ? `var(--pad-${m.t})` : 'var(--text-dim)', letterSpacing: '.1em', marginTop: 3 }}>{m.l}</div>
              </div>
            ))}
          </div>

          {/* Sound file */}
          <SectionLabel glyph="potion">SOUND</SectionLabel>
          <div style={{
            padding: 10, marginBottom: 12,
            background: 'var(--raised)',
            borderLeft: '3px solid var(--pad-loop)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <PixelIcon name="potion" size={14} color="var(--pad-loop)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}>wind.ogg</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>0:12 · 395 KB · 48k</div>
              </div>
            </div>
            <Waveform progress={0} height={32} color="var(--pad-loop)" />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="sb-btn sb-btn-ghost" style={{ flex: 1, fontSize: 11, minHeight: 36 }}>PREVIEW</button>
              <button className="sb-btn sb-btn-ghost" style={{ flex: 1, fontSize: 11, minHeight: 36 }}>CHANGE</button>
            </div>
          </div>

          {/* Volume */}
          <SectionLabel glyph="diamond">VOLUME</SectionLabel>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>0</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)' }}>72%</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>100</span>
            </div>
            <div className="sb-slider" style={{ height: 10 }}>
              <div className="sb-slider-fill" style={{ width: '72%', background: 'var(--pad-loop)' }} />
              <div className="sb-slider-thumb" style={{ left: '72%', width: 22, height: 22, background: 'var(--pad-loop)' }} />
            </div>
          </div>

          <SectionLabel glyph="loop">FADE</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <FadeSliderMobile label="FADE IN"  value={0.08} />
            <FadeSliderMobile label="FADE OUT" value={0.32} />
          </div>

          <SectionLabel glyph="key">KEY</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <KeyCap kind="game" wide>%</KeyCap>
            <button className="sb-btn sb-btn-ghost" style={{ minHeight: 40, fontSize: 11 }}>CAPTURE</button>
            <button className="sb-btn sb-btn-ghost" style={{ minHeight: 40, fontSize: 11 }}>CLEAR</button>
          </div>

          {/* Visual */}
          <SectionLabel glyph="eye">ICON · 1 / 4</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginBottom: 20 }}>
            {['loop', 'flame', 'moon', 'star', 'potion', 'eye'].map((g, i) => (
              <div key={g} style={{
                aspectRatio: '1',
                background: i === 0 ? 'var(--pad-loop-soft)' : 'var(--raised)',
                border: '1px solid ' + (i === 0 ? 'var(--pad-loop)' : 'var(--border)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i === 0 ? 'var(--pad-loop)' : 'var(--text-dim)',
              }}>
                <PixelIcon name={g} size={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function FadeSliderMobile({ label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.08em' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)' }}>{(value * 10).toFixed(1)}s</span>
      </div>
      <div className="sb-slider" style={{ height: 8 }}>
        <div className="sb-slider-fill" style={{ width: (value * 100) + '%', background: 'var(--pad-loop)' }} />
        <div className="sb-slider-thumb" style={{ left: (value * 100) + '%', width: 18, height: 18, background: 'var(--pad-loop)' }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MOBILE LIBRARY · 4 tabs, swipeable
// ════════════════════════════════════════════════════════════════
function MobileLibrary() {
  const AUDIO = [
    { name: 'wind_02',        meta: '0:12 · 128 KB', used: 1 },
    { name: 'scream_male_01', meta: '0:04 · 159 KB', used: 0 },
    { name: 'thunder_02',     meta: '0:03 · 224 KB', used: 1 },
    { name: 'rain_loop',      meta: '2:14 · 1.4 MB', used: 2 },
    { name: 'fire_crackle',   meta: '0:42 · 480 KB', used: 1 },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PhoneStatusBar />

      {/* Title bar */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--gold-dim)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          <span style={{ fontSize: 18 }}>←</span>
        </div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold)', letterSpacing: '.14em' }}>LIBRARY</span>
        <div style={{ flex: 1 }} />
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          <PixelIcon name="search" size={14} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: 'var(--night)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
      }}>
        {[
          ['AUDIO',  99, true],
          ['PADS',   31, false],
          ['BOARDS', 1,  false],
          ['ICONS',  2289, false],
        ].map(([label, n, active]) => (
          <div key={label} style={{
            flex: '1 0 auto',
            padding: '12px 16px',
            textAlign: 'center',
            fontFamily: 'var(--font-ui)', fontSize: 12,
            color: active ? 'var(--gold)' : 'var(--text-mute)',
            letterSpacing: '.12em',
            borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: -1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            minHeight: 44,
          }}>
            {label}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: active ? 'var(--gold-dim)' : 'var(--text-mute)' }}>{n}</span>
          </div>
        ))}
      </div>

      {/* Filter strip */}
      <div style={{ padding: '8px 14px', background: 'var(--surface)', display: 'flex', gap: 6, overflowX: 'auto', borderBottom: '1px solid var(--border-soft)' }}>
        <span className="sb-pill is-on">All · 99</span>
        <span className="sb-pill">In use · 87</span>
        <span className="sb-pill">Unused · 12</span>
        <span className="sb-pill is-loop">Ambient</span>
      </div>

      {/* List */}
      <main style={{ flex: 1, overflow: 'auto', padding: 10, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {AUDIO.map((r, i) => (
            <div key={r.name} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 10, alignItems: 'center',
              padding: '10px 12px',
              background: i === 3 ? 'var(--top)' : 'var(--raised)',
              borderLeft: i === 3 ? '3px solid var(--gold)' : '3px solid transparent',
              minHeight: 56,
            }}>
              <PixelIcon name={r.used ? 'loop' : 'play'} size={14} color={r.used ? 'var(--pad-loop)' : 'var(--gold)'} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', letterSpacing: '.04em' }}>{r.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{r.meta}</div>
              </div>
              {r.used > 0
                ? <span className="sb-pill is-loop" style={{ fontSize: 9 }}>● {r.used}</span>
                : <span className="sb-pill" style={{ fontSize: 9, color: 'var(--text-mute)' }}>OFF</span>}
            </div>
          ))}
        </div>
      </main>

      {/* Upload FAB */}
      <div style={{
        position: 'absolute', right: 16, bottom: 60,
        width: 56, height: 56,
        background: 'var(--gold)', color: 'var(--text-on-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,.5)',
      }}>
        <PixelIcon name="download" size={20} />
      </div>

      {/* Backup status footer */}
      <div className="sb-status-bar" style={{ background: 'var(--deep)', height: 32, padding: '0 10px' }}>
        <span style={{ color: 'var(--blood-bright)' }}>⚠ backup overdue · 3d</span>
        <div style={{ flex: 1 }} />
        <button className="sb-btn sb-btn-sm sb-btn-danger" style={{ padding: '2px 10px', fontSize: 10 }}>EXPORT</button>
      </div>

      <PhoneHomeIndicator />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MOBILE SETTINGS · sub-menu list, drilling in
// ════════════════════════════════════════════════════════════════
function MobileSettings() {
  const SECTIONS = [
    { id: 'controls', label: 'CONTROLS', icon: 'keyboard', count: '5 settings'  },
    { id: 'audio',    label: 'AUDIO',    icon: 'potion',   count: '7 settings'  },
    { id: 'display',  label: 'DISPLAY',  icon: 'eye',      count: '4 settings'  },
    { id: 'behavior', label: 'BEHAVIOR', icon: 'cog',      count: '6 settings'  },
    { id: 'data',     label: 'DATA',     icon: 'save',     count: 'backup · import', warning: true },
    { id: 'about',    label: 'ABOUT',    icon: 'info',     count: 'v 150'        },
  ];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PhoneStatusBar />
      <div style={{
        padding: '10px 14px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--gold-dim)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          <span style={{ fontSize: 18 }}>←</span>
        </div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold)', letterSpacing: '.14em' }}>SETTINGS</span>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', minHeight: 44,
          background: 'var(--sunk)', border: '1px solid var(--border)',
          color: 'var(--text-mute)',
        }}>
          <PixelIcon name="search" size={13} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Search settings…</span>
        </div>
      </div>

      <main style={{ flex: 1, overflow: 'auto', padding: 10, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SECTIONS.map((s) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 14px',
              background: 'var(--raised)',
              borderLeft: '3px solid ' + (s.warning ? 'var(--blood)' : 'var(--gold-dim)'),
              minHeight: 60,
            }}>
              <PixelIcon name={s.icon} size={18} color={s.warning ? 'var(--blood-bright)' : 'var(--gold)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text)', letterSpacing: '.1em' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: s.warning ? 'var(--blood-bright)' : 'var(--text-mute)', marginTop: 2 }}>
                  {s.warning && '⚠ '}{s.count}
                </div>
              </div>
              <span style={{ color: 'var(--text-mute)', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      </main>

      <div className="sb-status-bar" style={{ background: 'var(--deep)', height: 32, padding: '0 10px' }}>
        <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.14em' }}>v 150</span>
        <div style={{ flex: 1 }} />
        <span>auto-saved · 2s</span>
      </div>

      <PhoneHomeIndicator />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LANDSCAPE BOARD · GAME (held sideways during play)
// 4×3 grid + side rail collapsed to icons only. Better when you
// have the phone propped up next to your screen.
// ════════════════════════════════════════════════════════════════
function MobileBoardLandscape() {
  const PADS = [
    { type: 'single',   t: 'Door',   k: 'F1' },
    { type: 'loop',     t: 'Rain',   k: 'F2', hot: true },
    { type: 'loop',     t: 'Fire',   k: 'F3', hot: true },
    { type: 'single',   t: 'Sword',  k: 'F4' },
    { type: 'single',   t: 'Wolf',   k: 'F5' },
    { type: 'loop',     t: 'Crowd',  k: 'F6' },
    { type: 'playlist', t: 'Tavern', k: 'F7' },
    { type: 'single',   t: 'Thndr',  k: 'F8' },
    { type: 'combo',    t: 'Boss',   k: 'Q' },
    { type: 'single',   t: 'Slam',   k: 'W' },
    { type: 'playlist', t: 'Battle', k: 'E' },
    { type: 'loop',     t: 'Whisper',k: 'R' },
  ];

  return (
    <div className="sb sb-board-canvas" style={{ display: 'flex', height: '100%' }}>
      <style>{NOW_PLAYING_AURA_CSS}</style>
      <HearthGlow intensity={1} />
      <AmbientEmbers density={10} />

      {/* Left icon rail */}
      <aside style={{
        width: 44, background: 'var(--deep)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 0', gap: 4,
      }}>
        <SideIcon glyph="moon" />
        <SideIcon glyph="potion" active />
        <SideIcon glyph="rune" />
        <SideIcon glyph="skull" />
        <div style={{ flex: 1 }} />
        <SideIcon glyph="search" />
      </aside>

      {/* Pads */}
      <main style={{ flex: 1, padding: 8, position: 'relative', zIndex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, height: '100%' }}>
          {PADS.map((p) => (
            <div key={p.t} className={'sb-pad' + (p.hot ? ' is-hot' : '')} data-type={p.type} style={{
              '--pad-color': `var(--pad-${p.type})`,
              '--pad-glow': `var(--pad-${p.type}-glow)`,
              minHeight: 70, padding: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4 }}>
                <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={10} color={`var(--pad-${p.type})`} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)' }}>{p.k}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text)', paddingLeft: 4 }}>{p.t}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Right rail: clock + transport */}
      <aside style={{
        width: 100, background: 'var(--deep)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '6px 4px', gap: 8,
      }}>
        <div style={{ transform: 'scale(.7)', transformOrigin: 'top center', marginBottom: -22 }}>
          <PocketWatch mode="live" size={70} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, width: '100%' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--gold)', letterSpacing: '.1em', textAlign: 'center' }}>MASTER</div>
          <div className="sb-slider" style={{ height: 6 }}>
            <div className="sb-slider-fill" style={{ width: '72%' }} />
            <div className="sb-slider-thumb" style={{ left: '72%' }} />
          </div>
          <div style={{
            padding: '8px 0', textAlign: 'center', minHeight: 32,
            background: 'var(--raised)', border: '1px solid var(--blood)',
            color: 'var(--blood-bright)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.14em',
          }}>STOP</div>
        </div>
      </aside>
    </div>
  );
}
function SideIcon({ glyph, active }) {
  return (
    <div style={{
      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'var(--top)' : 'transparent',
      borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
      color: active ? 'var(--gold)' : 'var(--text-dim)',
    }}>
      <PixelIcon name={glyph} size={14} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ANSWER ARTBOARD — text + screenshots of each mobile view
// ════════════════════════════════════════════════════════════════
function MobileAnswerArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>Spielbar auf dem Handy?</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // ehrliche Antwort: das Design-System (Tokens, Atome, Pad-Typen, Atmosphäre, Uhr) — ja, überall.<br/>
          // aber die LAYOUTS sind alle Desktop-First (3-Spalten mit Rails). Brauchen eigene Mobile-Versionen.
        </div>
      </div>

      <div style={{
        padding: 16,
        background: 'var(--raised)',
        borderLeft: '3px solid var(--gold)',
        marginBottom: 22,
      }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--gold)', letterSpacing: '.08em', marginBottom: 8 }}>
          PRINZIPIEN FÜR MOBILE
        </div>
        <ul style={{
          margin: 0, padding: '0 0 0 20px',
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
          lineHeight: 1.7,
        }}>
          <li>Alle Hit-Targets ≥ <span style={{ color: 'var(--gold-bright)' }}>44 px</span> (Apple HIG / Material).</li>
          <li>Side-Rails kollabieren in einen Bottom-Sheet (Editor) oder Bottom-Bar (Transport).</li>
          <li>Pad-Grid: 3 Spalten Portrait · 4 Spalten Landscape.</li>
          <li>Persistente <span style={{ color: 'var(--gold)' }}>Master-Slider + STOP-Button</span> immer am unteren Bildschirmrand.</li>
          <li>Szenen werden zur horizontal scrollbaren Pill-Liste.</li>
          <li>Sub-Settings als Drill-In Liste mit Pfeil rechts, statt Sidebar.</li>
          <li>Library-Tabs bleiben Tabs, mit Swipe-Gestures.</li>
          <li>Uhr bleibt sichtbar — als Mini-Variante (70% scale) im Top-Bar oder Landscape-Right-Rail.</li>
          <li>Atmosphäre-Effekte (Embers, Hearth-Glow, Now-Playing-Aura) funktionieren <span style={{ color: 'var(--gold-bright)' }}>identisch</span> — sind reine CSS-Animationen.</li>
        </ul>
      </div>

      {/* Phone mockups */}
      <SectionLabel glyph="sparkle">PORTRAIT · DIE WICHTIGSTEN SCREENS (375 × 812)</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24, alignItems: 'flex-start' }}>
        <PhoneFrame label="GAME · live"><MobileBoardGame /></PhoneFrame>
        <PhoneFrame label="SETUP · edit"><MobileBoardSetup /></PhoneFrame>
        <PhoneFrame label="PAD editor · sheet"><MobilePadEditor /></PhoneFrame>
        <PhoneFrame label="Library · Audio"><MobileLibrary /></PhoneFrame>
        <PhoneFrame label="Settings · drill"><MobileSettings /></PhoneFrame>
      </div>

      <SectionLabel glyph="diamond">LANDSCAPE · BESSER WENN HANDY DANEBEN LIEGT (812 × 375)</SectionLabel>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          width: 660, height: 320, margin: '0 auto',
          border: '6px solid #000', borderRadius: 32,
          padding: 4, background: '#000',
          boxShadow: '0 8px 30px rgba(0,0,0,.6)',
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 26, overflow: 'hidden', position: 'relative' }}>
            <MobileBoardLandscape />
          </div>
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="key">WAS DESKTOP HAT, WAS MOBIL FEHLT (UND WARUM)</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <FeatureMobility name="Pad Grid" mobile="✓" desc="Funktioniert. 3 Spalten Portrait, 4 Landscape. Type-Identität (Spine + Icon) ist sogar wichtiger auf kleinem Screen." />
        <FeatureMobility name="Mode Toggle" mobile="✓" desc="Gleicher Toggle, leicht größer. SETUP / GAME bleibt absolut zentral." />
        <FeatureMobility name="Now Playing" mobile="✓" desc="Collapsible Strip oben statt persistente Right-Rail. Tap zum Erweitern." />
        <FeatureMobility name="Master + Stop" mobile="✓" desc="Permanente Bottom-Bar. Master + Pause + Cue-Next + STOP. Immer erreichbar mit Daumen." />
        <FeatureMobility name="Scenes" mobile="✓" desc="Horizontal scrollbare Pill-Liste oben statt Sidebar." />
        <FeatureMobility name="Inspector / Right Rail" mobile="✗" desc="Existiert nicht auf Mobile. Inhalt geht in Bottom-Sheets (PAD-Edit, Mixer)." />
        <FeatureMobility name="Library Sidebar Facets" mobile="◐" desc="Wird zur scrollbaren Pill-Reihe oben. Funktioniert für die wichtigsten Filter, nicht für 50+ Tags." />
        <FeatureMobility name="Multi-Select bulk edit" mobile="◐" desc="Möglich mit Long-Press, aber die Action-Bar braucht mehr Platz; auf Mobile auf 4 wichtige Aktionen reduziert." />
        <FeatureMobility name="Keyboard Map" mobile="✗" desc="Macht auf Touch keinen Sinn. Im Settings → Controls als Read-Only Übersicht der Belegungen ersetzt." />
        <FeatureMobility name="Command Palette" mobile="✓" desc="Search-Icon oben rechts öffnet die Palette als Vollbild. Wischt von oben rein." />
        <FeatureMobility name="Clock + Countdown" mobile="✓" desc="Mini-Pocket-Watch im Top-Bar Portrait / Landscape-Rail. Tap öffnet Countdown-Sheet." />
        <FeatureMobility name="Atmosphere" mobile="✓" desc="Embers, Hearth Glow, Now-Playing Aura — alles CSS, läuft 1:1." />
      </div>

      <SectionLabel glyph="skull">NICHT EMPFOHLEN AUF MOBILE</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
        ▸ <b>Combo Editor</b> — die Step-Sequenzer-UI ist auf Handy frustrierend. Lass nur "Combo aktivieren" und "Stop", den Bau immer am Desktop.<br/>
        ▸ <b>PAD-Layout bearbeiten</b> — Drag & Drop auf Touch ist okay, aber kein Spaß. SETUP-Modus für kleine Tweaks behalten, große Reorganisationen am Desktop.<br/>
        ▸ <b>Bulk Tag-Editor</b> — auf Handy auf einzelne Pads beschränken.<br/>
        ▸ <b>Library Icons-Tab</b> — bei 2289 Icons macht Touch-Browsen wenig Spaß. Search-only UX auf Handy.
      </div>
    </div>
  );
}

function PhoneFrame({ label, children }) {
  return (
    <div>
      <div style={{
        width: '100%', aspectRatio: '375 / 812',
        border: '4px solid #000', borderRadius: 24,
        padding: 3, background: '#000',
        boxShadow: '0 4px 20px rgba(0,0,0,.5)',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '.14em', textAlign: 'center', marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}
function FeatureMobility({ name, mobile, desc }) {
  const c = mobile === '✓' ? 'var(--pad-loop)' : mobile === '◐' ? 'var(--gold)' : 'var(--blood-bright)';
  return (
    <div style={{
      padding: 10,
      background: 'var(--raised)',
      borderLeft: `3px solid ${c}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: c, lineHeight: 1 }}>{mobile}</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)', letterSpacing: '.08em' }}>{name}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}

Object.assign(window, {
  MobileBoardGame, MobileBoardSetup, MobilePadEditor, MobileLibrary,
  MobileSettings, MobileBoardLandscape, MobileAnswerArtboard,
});
