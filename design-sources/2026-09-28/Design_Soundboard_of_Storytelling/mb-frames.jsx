// mb-frames.jsx — grip comparison frame + tablet side-rail frame.

const { useState: useSt } = React;

// ── A seam demo: the summon arrow, centred on the seam ────────────
function SeamDemo({ orient, option, dim }) {
  const h = orient === 'h';
  return (
    <div className={`mb-seam-${h ? 'h' : 'v'}${dim ? ' dim' : ''}`}>
      <div className="panel" />
      {/* summon layer — the pull-tab, centred on the seam */}
      <div style={h
        ? { position: 'absolute', left: '50%', bottom: 40, transform: 'translateX(-50%)' }
        : { position: 'absolute', top: '50%', right: 44, transform: 'translateY(-50%)' }}>
        <GripTab style={option} orient={h ? 'h' : 'v'} />
      </div>
    </div>
  );
}

function Demo({ cap, children }) {
  return <div className="mb-grip-demo"><span className="cap">{cap}</span>{children}</div>;
}

function GripComparison({ live, setLive }) {
  const OPTS = [
    { id: 'A', title: 'Protrude + colour', desc: 'A stepped pixel tab that protrudes past the seam in the mode accent hue. The protrusion + colour make it glanceable even when dimmed. (My candidate.)' },
    { id: 'B', title: 'Pictographic, flush', desc: 'A flush tab carrying a directional chevron ("I open"). Cleaner, uninterrupted seam — but leans on glyph legibility in a dark room.' },
    { id: 'C', title: 'Raised vs recessed', desc: 'A raised, bevelled cap lit from above — leans hardest into the pixel-art tactility. Strongest in a lit room, subtler when dimmed.' },
  ];
  return (
    <div className="mb-grips-wrap">
      <div className="mb-section-note" style={{ marginTop: 0 }}>
        The summon tab opens / closes a docked panel. Here are three treatments for it — each shown on a
        <b style={{ color: 'var(--text)' }}> phone bottom-seam</b> (horizontal) and a <b style={{ color: 'var(--text)' }}>tablet vertical-seam</b>, in
        <b style={{ color: 'var(--text)' }}> active</b> and <b style={{ color: 'var(--text)' }}>dimmed</b> states (dimmed is the real test). Use the selector to drive the live prototype's summon grip with any option.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.12em', color: 'var(--text-dim)' }}>LIVE PROTOTYPE USES:</span>
        <div className="mb-seg">
          {['A', 'B', 'C'].map((o) => (
            <button key={o} className={live === o ? 'is-on' : ''} onClick={() => setLive(o)}
              style={live === o ? { background: 'var(--gold)', color: 'var(--text-on-gold)' } : null}>OPT {o}</button>
          ))}
        </div>
      </div>
      <div className="mb-grip-grid">
        {OPTS.map((o) => (
          <div key={o.id} className="mb-grip-card" style={live === o.id ? { borderColor: 'var(--gold)' } : null}>
            <div className="opt">OPTION {o.id}{live === o.id ? ' · LIVE' : ''}</div>
            <h4>{o.title}</h4>
            <p>{o.desc}</p>
            <div className="mb-grip-demos">
              <Demo cap="Phone · active"><SeamDemo orient="h" option={o.id} /></Demo>
              <Demo cap="Phone · dimmed"><SeamDemo orient="h" option={o.id} dim /></Demo>
            </div>
            <div className="mb-grip-demos" style={{ marginTop: 0 }}>
              <Demo cap="Tablet · active"><SeamDemo orient="v" option={o.id} /></Demo>
              <Demo cap="Tablet · dimmed"><SeamDemo orient="v" option={o.id} dim /></Demo>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-mute)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: 'var(--mode-setup)' }}>▲</span> summon · "I open"</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TABLET · dock edge rotates to a vertical side-rail ────────────
function TabletFrame({ gripStyle = 'A' }) {
  const pads = buildPads().slice(0, 30);
  return (
    <div className="mb-tablet-wrap">
      <div className="mb-tablet">
        <div className="mb-tablet-screen sb is-setup mb-phone" style={{ position: 'relative' }}>
          {/* top band */}
          <div className="mb-statusbar" style={{ paddingTop: 6 }}>
            <span style={{ fontWeight: 600 }}>21:42</span><span>The Tavern · SETUP</span>
          </div>
          <div className="mb-topbar" style={{ maxWidth: 520 }}>
            <button className="mb-iconbtn"><MBIcon name="menu" size={18} /></button>
            <div className="mb-modeswitch">
              <div className="mb-modeswitch-thumb" style={{ left: 0, background: 'var(--mode-setup)' }} />
              <div className="mb-modeswitch-half h-setup" style={{ color: '#04201f' }}><MBIcon name="sliders" size={13} /> SETUP</div>
              <div className="mb-modeswitch-half h-game"><MBIcon name="play" size={12} /> GAME</div>
            </div>
            <button className="mb-iconbtn" style={{ color: 'var(--text-mute)' }}><MBIcon name="unlock" size={17} /></button>
          </div>
          {/* body: grid + side-rail */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <div className="mb-grid-scroll" style={{ position: 'relative', inset: 'auto', height: '100%' }}>
                <div className="mb-grid" style={{ '--mb-cols': 6, '--mb-gap': '10px', '--mb-pad-h': '110px', '--mb-label': '14px' }}>
                  {pads.map((p) => p.gap
                    ? <div key={p.id} className="mb-empty"><span className="mb-plus">+</span>ADD</div>
                    : <div key={p.id} className="mb-pad" style={{ '--pad-color': `var(--pad-${p.type})` }}>
                        <span className="mb-pad-handle" style={{ display: 'block' }}><MBIcon name="dots" size={11} color="var(--mode-setup)" /></span>
                        <div className="mb-pad-type"><MBIcon name={MB_TYPE_ICON[p.type]} size={11} color={`var(--pad-${p.type})`} />{p.type.toUpperCase()}</div>
                        <div><div className="mb-pad-title">{p.t}</div><div className="mb-pad-meta">{p.type}</div></div>
                      </div>)}
                </div>
              </div>
            </div>
            {/* side-rail (the SETUP DISPLAY panel, docked to the vertical seam) */}
            <div style={{ width: 308, background: 'var(--surface)', borderLeft: '1px solid var(--border-strong)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* unified grip on the vertical seam — tap toggles, drag resizes */}
              <div style={{ position: 'absolute', left: -1, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 5 }}>
                <GripTab style={gripStyle} orient="v" />
              </div>
              <div className="mb-sheet-head" style={{ padding: '12px 16px' }}>
                <MBIcon name="grid" size={13} color="var(--mode-setup)" />
                <span className="t">DISPLAY · this scene</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <StaticCtl label="PAD SIZE" val="110px" pct={62} />
                <StaticCtl label="GAP" val="10px" pct={42} />
                <div>
                  <div className="mb-ctl-label"><span>COLUMNS</span><b>AUTO · 6</b></div>
                  <div className="mb-cols">
                    <div className="mb-seg"><button className="is-on">AUTO</button><button>FIXED</button></div>
                    <div style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>cells grow with the viewport</div>
                  </div>
                </div>
                <StaticCtl label="LABEL SIZE" val="14px" pct={50} />
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ padding: 16, borderTop: '1px solid var(--border-soft)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <b style={{ color: 'var(--mode-setup)', fontFamily: 'var(--font-ui)', letterSpacing: '.1em' }}>ROTATION</b><br />
                Same component, dock edge rotated: phone = bottom-sheet (grip on the top seam); tablet = side-rail (grip on the vertical seam). The pad grid is the invariant — cells grow as the viewport grows.
              </div>
            </div>
          </div>
          {/* slim bottom band */}
          <div className="mb-band-bottom" style={{ position: 'relative' }}>
            <div className="mb-scenes">
              {MB_SCENES.map((s, i) => <button key={s} className={`mb-scene${i === 1 ? ' is-on' : ''}`}>{s}</button>)}
            </div>
            <div className="mb-transport">
              <button className="mb-stop"><MBIcon name="stop" size={15} color="#fff" />STOP</button>
              <div className="mb-setup-actions">
                <button className="mb-action is-accent"><MBIcon name="grid" size={14} color="var(--mode-setup)" /> DISPLAY</button>
                <button className="mb-action"><MBIcon name="plus" size={13} /> ADD PAD</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaticCtl({ label, val, pct }) {
  return (
    <div>
      <div className="mb-ctl-label"><span>{label}</span><b>{val}</b></div>
      <div className="mb-track" style={{ cursor: 'default' }}>
        <div className="mb-track-rail" />
        <div className="mb-track-fill" style={{ width: pct + '%' }} />
        <div className="mb-track-thumb" style={{ left: pct + '%' }} />
      </div>
    </div>
  );
}

Object.assign(window, { GripComparison, TabletFrame, SeamDemo });
