// v20-pad-creation-flow.jsx — A2 from the Slice-3 plan.
//
// Three concrete paths for putting a pad on a grid slot. Each path
// has different ergonomics and a different "best at" scenario; they
// are NOT mutually exclusive in V3 — all three ship. The recommend-
// ation here is purely about VISUAL PROMINENCE for first-time use.
//
// ── Path summary ─────────────────────────────────────────────────
//   A · TAP A SLOT         — inline popover anchored to the slot.
//                            Mental model: grid is the workspace.
//   B · DRAG FROM LIBRARY  — drop audio onto a slot; auto-pad.
//                            Mental model: library is the palette.
//   C · + ADD PAD TOOLBAR  — opens the full PAD editor.
//                            Mental model: explicit action.
//
// Recommendation: Path A as PRIMARY for first-time use. The empty
// slot itself is the affordance — nothing to discover. Path B is the
// natural power workflow once the Library button is known. Path C is
// the universal fallback because the keyboard shortcut works
// regardless of mode or panel state.
//
// Mobile adaptations (per the V3 strategy: same component, two
// variants):
//   A · tap slot → bottom sheet (not floating popover)
//   B · long-press audio → "place" mode → tap target slot
//   C · toolbar button → full-screen pad editor

// ── Tiny grid renderer used in flow frames ─────────────────────────
function FlowGrid({ filled = [], accent = -1, hover = -1, dropTarget = -1, cols = 4, rows = 3, scale = 1, cellH = 56 }) {
  const total = cols * rows;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridAutoRows: `${cellH}px`,
      gap: 6 * scale,
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const padInfo = filled[i];
        if (padInfo) {
          return (
            <div key={i} className="sb-pad" style={{
              minHeight: 0,
              padding: '4px 6px',
              fontFamily: 'var(--font-ui)', fontSize: 9,
              '--pad-color': `var(--pad-${padInfo.type})`,
              '--pad-glow':  `var(--pad-${padInfo.type}-glow)`,
              '--pix-step': '3px',
            }}>
              <div style={{ color: 'var(--text)', fontSize: 10, letterSpacing: '.04em' }}>{padInfo.name}</div>
              <div style={{ color: `var(--pad-${padInfo.type})`, fontSize: 8, marginTop: 2, letterSpacing: '.1em' }}>
                {padInfo.type.toUpperCase()}
              </div>
            </div>
          );
        }
        const isAccent     = i === accent;
        const isHover      = i === hover;
        const isDropTarget = i === dropTarget;
        return (
          <div key={i} style={{
            border: isAccent || isHover || isDropTarget
              ? `2px solid ${isDropTarget ? 'var(--success)' : isHover ? 'var(--gold)' : 'var(--border-strong)'}`
              : '1px dashed var(--border-soft)',
            background: isDropTarget
              ? 'rgba(109,181,184,.10)'
              : isHover
                ? 'rgba(212,178,92,.06)'
                : 'var(--sunk)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isAccent || isHover || isDropTarget ? 1 : 0.5,
            position: 'relative',
          }}>
            {(isHover || isAccent) && (
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 12,
                color: isHover ? 'var(--gold)' : 'var(--text-mute)',
              }}>+</span>
            )}
            {isDropTarget && (
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--success)', letterSpacing: '.12em' }}>
                DROP
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Frame: a single step in a flow ────────────────────────────────
function FlowFrame({ no, title, children, height = 220, accent }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${accent || 'var(--border-strong)'}`,
      padding: 'var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      minHeight: height,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-mute)', letterSpacing: '.14em',
        }}>STEP {no}</span>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: 12,
          color: 'var(--text)', letterSpacing: '.06em',
        }}>{title}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

// ── Inline pad-creation popover sketch (Path A · desktop) ─────────
function InlinePopover({ x = 8, y = 8 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 220, padding: 'var(--space-3)',
      background: 'var(--raised)',
      border: '1px solid var(--border-strong)',
      filter: 'var(--shadow-pop)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      zIndex: 10,
    }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.10em' }}>
        NEW PAD · slot 4
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {['single', 'loop', 'playlist', 'combo'].map(t => (
          <div key={t} className="sb-pill" style={{
            fontSize: 9,
            '--pix-border': `var(--pad-${t})`,
            color: `var(--pad-${t})`,
            padding: '1px 5px',
            opacity: t === 'single' ? 1 : 0.4,
          }}>{t[0].toUpperCase()}</div>
        ))}
      </div>
      <div style={{
        background: 'var(--sunk)', border: '1px solid var(--border-soft)',
        padding: '4px 6px',
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text)',
      }}>Tavern Door|</div>
      <div style={{
        background: 'var(--sunk)', border: '1px dashed var(--border-soft)',
        padding: '5px 6px', minHeight: 22,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)',
      }}>drop audio · or click to pick</div>
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <button className="sb-btn sb-btn-primary" style={{ fontSize: 9, padding: '2px 8px', flex: 1 }}>SAVE</button>
        <button className="sb-btn sb-btn-ghost" style={{ fontSize: 9, padding: '2px 8px' }}>·</button>
      </div>
    </div>
  );
}

// ── Library audio list (Path B · desktop) ─────────────────────────
function LibList({ dragging = -1 }) {
  const items = [
    { n: 'Rain Heavy.wav',  d: '∞ · 1:24', t: 'loop' },
    { n: 'Sword Clash.wav', d: '0:02',     t: 'single' },
    { n: 'Tavern Door.wav', d: '0:04',     t: 'single' },
    { n: 'Crowd Murmur.ogg',d: '∞ · 0:54', t: 'loop' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-mute)',
        letterSpacing: '.14em', textTransform: 'uppercase',
        padding: '0 4px', marginBottom: 2,
      }}>LIBRARY · AUDIO</div>
      {items.map((it, i) => (
        <div key={it.n} style={{
          padding: '4px 6px',
          background: i === dragging ? 'var(--top)' : 'var(--surface)',
          border: '1px solid ' + (i === dragging ? 'var(--gold)' : 'var(--border-soft)'),
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: i === dragging ? 'var(--gold)' : 'var(--text-dim)',
          opacity: dragging !== -1 && i !== dragging ? 0.4 : 1,
        }}>
          <span>{it.n}</span>
          <span style={{ fontSize: 9, color: 'var(--text-mute)' }}>{it.d}</span>
        </div>
      ))}
    </div>
  );
}

// ── Toolbar mini-strip (Path C · desktop) ─────────────────────────
function ToolbarStrip({ highlightAdd }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 6px',
      background: 'var(--deep)',
      border: '1px solid var(--border)',
    }}>
      <button className={'sb-btn ' + (highlightAdd ? 'sb-btn-primary' : 'sb-btn-ghost')} style={{
        fontSize: 10, padding: '3px 8px',
        ...(highlightAdd ? { filter: 'drop-shadow(0 0 6px var(--gold-bright))' } : {}),
      }}>+ ADD PAD <span style={{ marginLeft: 4, opacity: .6 }}>A</span></button>
      <button className="sb-btn sb-btn-ghost" style={{ fontSize: 10, padding: '3px 8px' }}>LIB</button>
      <button className="sb-btn sb-btn-ghost" style={{ fontSize: 10, padding: '3px 8px' }}>SETUP</button>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)' }}>Scene · Tavern</span>
    </div>
  );
}

// ── PAD editor sketch (Path C · desktop) ───────────────────────────
function EditorSheet() {
  return (
    <div style={{
      position: 'absolute', inset: 18,
      background: 'var(--surface)',
      border: '1px solid var(--border-strong)',
      filter: 'var(--shadow-pop)',
      padding: 'var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 6,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.12em' }}>
          PAD EDITOR · NEW
        </span>
        <div style={{ flex: 1 }} />
        <button className="sb-btn sb-btn-primary" style={{ fontSize: 9, padding: '2px 8px' }}>SAVE</button>
        <button className="sb-btn sb-btn-ghost"   style={{ fontSize: 9, padding: '2px 8px' }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 6, flex: 1 }}>
        {['IDENTITY', 'SOUND + WAVEFORM', 'INSPECTOR'].map(c => (
          <div key={c} style={{
            background: 'var(--raised)',
            border: '1px solid var(--border-soft)',
            padding: 4,
            fontFamily: 'var(--font-ui)', fontSize: 8, color: 'var(--text-mute)',
            letterSpacing: '.10em',
          }}>{c}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//   PATH A · TAP A SLOT — desktop frames
// ─────────────────────────────────────────────────────────────────

function PathA_Desktop() {
  const accent = 'var(--gold)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <FlowFrame no="1" title="Hover a slot · pad-type ghost appears" accent={accent}>
        <FlowGrid hover={3} />
      </FlowFrame>
      <FlowFrame no="2" title="Click · inline popover anchors to the slot" height={300} accent={accent}>
        <div style={{ position: 'relative', minHeight: 240 }}>
          <FlowGrid accent={3} />
          <InlinePopover x={140} y={70} />
        </div>
      </FlowFrame>
      <FlowFrame no="3" title="Save · pad lands in slot · focus stays on the grid" accent={accent}>
        <FlowGrid
          filled={[null, null, null, { name: 'Tavern Door', type: 'single' }]}
          accent={3}
        />
      </FlowFrame>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//   PATH B · DRAG FROM LIBRARY — desktop frames
// ─────────────────────────────────────────────────────────────────

function PathB_Desktop() {
  const accent = 'var(--pad-loop)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <FlowFrame no="1" title="Library panel visible alongside the grid" accent={accent}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 6 }}>
          <LibList />
          <FlowGrid />
        </div>
      </FlowFrame>
      <FlowFrame no="2" title="Drag audio over a slot · drop target highlights" accent={accent}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 6, position: 'relative' }}>
          <LibList dragging={0} />
          <FlowGrid dropTarget={5} />
          {/* drag ghost */}
          <div style={{
            position: 'absolute', left: 130, top: 22,
            padding: '3px 6px',
            background: 'var(--top)',
            border: '1px solid var(--gold)',
            filter: 'var(--shadow-card)',
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)',
            opacity: 0.92, pointerEvents: 'none',
          }}>Rain Heavy.wav</div>
        </div>
      </FlowFrame>
      <FlowFrame no="3" title="Drop · pad auto-creates · type inferred from duration" accent={accent}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 6 }}>
          <LibList />
          <FlowGrid
            filled={[null, null, null, null, null, { name: 'Rain Heavy', type: 'loop' }]}
            accent={5}
          />
        </div>
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 4 }}>
          // 1:24 file → infers LOOP (≥10 s). Click pad to rename or change type.
        </div>
      </FlowFrame>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//   PATH C · + ADD PAD TOOLBAR — desktop frames
// ─────────────────────────────────────────────────────────────────

function PathC_Desktop() {
  const accent = 'var(--pad-playlist)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <FlowFrame no="1" title="Toolbar shows + ADD PAD · keyboard shortcut A" accent={accent}>
        <ToolbarStrip highlightAdd />
        <div style={{ height: 8 }} />
        <FlowGrid />
      </FlowFrame>
      <FlowFrame no="2" title="Click / press A · full PAD editor opens" height={300} accent={accent}>
        <div style={{ position: 'relative', minHeight: 240 }}>
          <ToolbarStrip />
          <div style={{ height: 8 }} />
          <FlowGrid />
          <EditorSheet />
        </div>
      </FlowFrame>
      <FlowFrame no="3" title="Save · pad lands on next available slot" accent={accent}>
        <FlowGrid
          filled={[{ name: 'Spell Cast', type: 'playlist' }]}
          accent={0}
        />
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 4 }}>
          // First empty slot in row-major order. User can re-arrange in SETUP mode.
        </div>
      </FlowFrame>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//   MOBILE FRAMES — one phone-shaped column per path
// ─────────────────────────────────────────────────────────────────

function MobilePhone({ children, title, badge }) {
  return (
    <div style={{
      width: 240, height: 420,
      background: 'var(--night)',
      border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 32,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 8px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border-soft)',
        fontFamily: 'var(--font-ui)', fontSize: 10,
        color: 'var(--text)', letterSpacing: '.10em',
      }}>
        <span style={{ width: 12, height: 12, background: 'transparent', borderLeft: '1px solid var(--text-dim)', borderTop: '1px solid var(--text-dim)' }} />
        <span>{title}</span>
        <div style={{ flex: 1 }} />
        {badge && <span className="sb-mode-badge is-setup" style={{ fontSize: 8 }}>SETUP</span>}
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function PathA_Mobile() {
  return (
    <MobilePhone title="TAVERN" badge>
      <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FlowGrid cols={3} rows={3} cellH={44} hover={2} />
        <div style={{ flex: 1 }} />
        {/* Bottom sheet sketch */}
        <div style={{
          background: 'var(--raised)',
          border: '1px solid var(--border-strong)',
          borderBottom: 'none',
          padding: 8,
          margin: '0 -10px -10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ width: 28, height: 3, background: 'var(--border-strong)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--gold)', letterSpacing: '.10em', marginBottom: 6 }}>
            NEW PAD · SLOT 3
          </div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {['SGL', 'LOOP', 'PL', 'COMBO'].map((t, i) => (
              <div key={t} style={{
                flex: 1,
                fontFamily: 'var(--font-mono)', fontSize: 9,
                padding: '3px 4px', textAlign: 'center',
                background: i === 0 ? 'var(--top)' : 'var(--sunk)',
                border: '1px solid ' + (i === 0 ? 'var(--gold)' : 'var(--border-soft)'),
                color: i === 0 ? 'var(--gold)' : 'var(--text-dim)',
              }}>{t}</div>
            ))}
          </div>
          <div style={{
            background: 'var(--sunk)', border: '1px solid var(--border-soft)',
            padding: '5px 6px', marginBottom: 6,
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text)',
          }}>Tavern Door</div>
          <button className="sb-btn sb-btn-primary" style={{ width: '100%', fontSize: 11, padding: '4px 0', minHeight: 30 }}>
            SAVE
          </button>
        </div>
      </div>
    </MobilePhone>
  );
}

function PathB_Mobile() {
  return (
    <MobilePhone title="TAVERN" badge>
      <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Place-mode banner */}
        <div style={{
          background: 'rgba(212,178,92,.10)',
          border: '1px solid var(--gold)',
          padding: '4px 6px',
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)',
          textAlign: 'center', letterSpacing: '.10em',
        }}>PLACING · Rain Heavy.wav → tap target slot</div>
        <FlowGrid cols={3} rows={3} cellH={44} dropTarget={4} />
        <div style={{ flex: 1 }} />
        <div className="sb-mono" style={{ fontSize: 9, color: 'var(--text-mute)', lineHeight: 1.5, padding: '0 2px' }}>
          // Mobile substitute for DnD: long-press audio in Library
            → place-mode → tap target slot. Cancel = back gesture.
        </div>
      </div>
    </MobilePhone>
  );
}

function PathC_Mobile() {
  return (
    <MobilePhone title="TAVERN" badge>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Full-screen editor takeover */}
        <div style={{
          flex: 1,
          background: 'var(--surface)',
          padding: 10,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="sb-btn sb-btn-ghost" style={{ fontSize: 10, padding: '2px 6px' }}>← CANCEL</button>
            <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.10em', textAlign: 'center' }}>
              NEW PAD
            </span>
            <button className="sb-btn sb-btn-primary" style={{ fontSize: 10, padding: '2px 6px' }}>SAVE</button>
          </div>
          {['Identity', 'Sound', 'Volume / fade', 'Hotkey'].map(s => (
            <div key={s} style={{
              padding: '6px 8px',
              background: 'var(--raised)',
              border: '1px solid var(--border-soft)',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)',
            }}>{s}</div>
          ))}
          <div style={{ flex: 1 }} />
        </div>
        {/* Bottom toolbar with + ADD PAD */}
        <div style={{
          height: 48,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 10px',
          background: 'var(--deep)',
          borderTop: '1px solid var(--border)',
          opacity: 0.55,
        }}>
          <button className="sb-btn sb-btn-filled" style={{ flex: 1, fontSize: 11, minHeight: 30 }}>+ ADD PAD</button>
          <button className="sb-btn sb-btn-ghost" style={{ fontSize: 10, padding: '0 8px', minHeight: 30 }}>LIB</button>
        </div>
      </div>
    </MobilePhone>
  );
}

// ─────────────────────────────────────────────────────────────────
//   PATH COLUMN — desktop frames + caption + pros/cons + mobile
// ─────────────────────────────────────────────────────────────────

function PathColumn({ letter, title, sub, accent, desktop, mobile, mobileNote, pros, cons, wins, recommend }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
      padding: 'var(--space-3)',
      background: 'var(--deep)',
      border: '1px solid var(--border)',
      borderTop: `3px solid ${accent}`,
    }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 18, color: accent,
          }}>{letter}</span>
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 14,
            color: 'var(--text)', letterSpacing: '.06em', textTransform: 'uppercase',
          }}>{title}</span>
          {recommend && (
            <span className="sb-pill is-on" style={{ fontSize: 9, marginLeft: 'auto', color: 'var(--gold-bright)', '--pix-border': 'var(--gold-bright)' }}>
              ★ PRIMARY
            </span>
          )}
        </div>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>
          {sub}
        </div>
      </div>

      {/* Desktop frames */}
      {desktop}

      {/* Pros / cons / wins */}
      <div style={{
        background: 'var(--raised)',
        border: '1px solid var(--border-soft)',
        padding: 'var(--space-3)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {pros.map(p => (
          <div key={p} className="sb-mono" style={{ fontSize: 11, color: 'var(--success)', lineHeight: 1.5 }}>
            ✓ {p}
          </div>
        ))}
        {cons.map(c => (
          <div key={c} className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            ⚠ {c}
          </div>
        ))}
        <div style={{
          marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-soft)',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)', lineHeight: 1.5,
        }}>
          BEST AT · {wins}
        </div>
      </div>

      {/* Mobile column */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: 'var(--space-3)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)',
      }}>
        <div className="sb-mono" style={{
          fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em',
          textTransform: 'uppercase', alignSelf: 'flex-start',
        }}>MOBILE VARIANT</div>
        {mobile}
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, alignSelf: 'flex-start' }}>
          {mobileNote}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//   ARTBOARD
// ─────────────────────────────────────────────────────────────────

function PadCreationFlowArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="sb-display" style={{ fontSize: 20 }}>
          PAD Creation Flow · Three Paths
        </div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          // A2 from the Slice-3 plan. All three ship — they're not mutually exclusive.<br/>
          // What's decided here: which path gets visual prominence in the empty state and for
          first-time use. Each path also has its mobile expression.
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}>
        <PathColumn
          letter="A"
          title="Tap a slot"
          sub={<>Inline popover anchors to the clicked slot. Lowest-friction first-pad creation.
                The empty slot IS the affordance — nothing to discover.</>}
          accent="var(--gold)"
          recommend
          desktop={<PathA_Desktop />}
          mobile={<PathA_Mobile />}
          mobileNote={<>Mobile substitutes a <b>bottom sheet</b> for the floating popover — floating
                       UI doesn't work at thumb scale. Same fields, same flow.</>}
          pros={[
            'Direct manipulation — click where you want it',
            'No mode switch, no context lost',
            'Affordance is visible without any chrome',
          ]}
          cons={[
            'Inline editor is constrained — power editing still needs the full PAD Editor',
          ]}
          wins="first pad on a fresh scene · one-off adds"
        />

        <PathColumn
          letter="B"
          title="Drag from Library"
          sub={<>Library panel is the palette, grid is the canvas. Drag audio onto a slot;
                 the pad auto-creates with type inferred from audio duration.</>}
          accent="var(--pad-loop)"
          desktop={<PathB_Desktop />}
          mobile={<PathB_Mobile />}
          mobileNote={<>Mobile has no native drag-across-panels. <b>Long-press audio → place
                        mode → tap target slot.</b> Place-mode is visible via a top banner
                        and survives a back gesture.</>}
          pros={[
            'Bulk creation — drop many files in sequence',
            'Re-uses audio you already imported',
            'Familiar from DAWs (Logic, Ableton drum pads)',
          ]}
          cons={[
            'Library must be open / accessible',
            'Auto-named pads need a rename pass',
          ]}
          wins="bulk creation · power workflow · already-imported audio"
        />

        <PathColumn
          letter="C"
          title="+ Add Pad toolbar"
          sub={<>Explicit toolbar button + keyboard shortcut <code>A</code>. Opens the full
                 PAD Editor (the v7 refined editor). Pad lands on the next free slot on save.</>}
          accent="var(--pad-playlist)"
          desktop={<PathC_Desktop />}
          mobile={<PathC_Mobile />}
          mobileNote={<>Mobile uses a <b>full-screen editor</b> instead of a docked panel —
                        same vocabulary as v11-mobile's PAD editor. Toolbar primary remains
                        the same shortcut.</>}
          pros={[
            'Keyboard-driven — A works regardless of mode / panel state',
            'Full editor from the start — every field accessible',
            'Discoverable — toolbar button is always visible',
          ]}
          cons={[
            'Heaviest path — takes you off the board context',
            'Overkill for "just add a pad with this file"',
          ]}
          wins="keyboard flow · building a pad from scratch · users coming from PAD Editor habits"
        />
      </div>

      <PixelDivider glyph="diamond" />

      {/* Recommendation */}
      <SectionLabel glyph="star">RECOMMENDATION · visual hierarchy in the empty state</SectionLabel>
      <div style={{
        background: 'var(--raised)',
        border: '1px solid var(--gold-dim)',
        borderLeft: '3px solid var(--gold)',
        padding: 'var(--space-5) var(--space-6)',
        marginBottom: 'var(--space-5)',
        marginTop: 'var(--space-3)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
          <ArcaneSigil size={96} />
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold-bright)', letterSpacing: '.06em', marginBottom: 'var(--space-3)' }}>
              Make Path A the primary affordance. Path B is parallel-secondary. Path C is the
              universal-fallback shortcut.
            </div>
            <div className="sb-mono" style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
              <b style={{ color: 'var(--text)' }}>Why Path A wins for first-time use:</b> the empty
              slot itself is the affordance. There's no separate UI element to discover. The user
              sees "this is where a pad goes" and clicks. The popover is the smallest possible
              editor — single decision (type) + single field (name) + single source picker — so it
              doesn't compete with the board.<br/><br/>
              <b style={{ color: 'var(--text)' }}>Why Path B is parallel-secondary, not tertiary:</b>{' '}
              once the user knows where the Library button lives, drag-from-library becomes the
              natural workflow for the common case ("I have 12 sounds, I want them all as pads").
              The Empty Library state already teaches Library exists; Empty Scene's hint strip
              already names "drag from Library". Path B's affordance is the Library panel itself
              — discovered organically.<br/><br/>
              <b style={{ color: 'var(--text)' }}>Why Path C stays:</b> keyboard-driven flow is
              a different user mode (advanced, fast, eyes-on-music). The <code>A</code> shortcut
              works regardless of which panels are open, which mode is active, or whether a slot
              is selected. The toolbar button is the discoverable surface for the same action.
              Removing C would force keyboard users into mouse-only flows.
            </div>
          </div>
        </div>
      </div>

      {/* Scenario → path table */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-6)',
      }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>
          WHEN EACH PATH WINS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          {[
            ['First-time user', 'A · slot is the affordance', 'gold'],
            ['Already imported 12 files', 'B · drag them in sequence', 'pad-loop'],
            ['Eyes-on-music keyboard flow', 'C · press A', 'pad-playlist'],
            ['Adding one pad on the fly', 'A · least disruptive', 'gold'],
            ['Building a complex combo from scratch', 'C · need full editor', 'pad-playlist'],
            ['Re-importing a backup', 'B · library-driven', 'pad-loop'],
          ].map(([when, then, c]) => (
            <div key={when} style={{
              padding: 'var(--space-3)',
              background: 'var(--raised)',
              borderLeft: `2px solid var(--${c})`,
            }}>
              <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.4 }}>{when}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: `var(--${c})`, letterSpacing: '.04em', marginTop: 4 }}>
                {then}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="moon">OPEN QUESTIONS · ask before Slice-3 commits</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, marginTop: 'var(--space-3)' }}>
        ▸ <b>Path B pad-type inference</b> — proposal: &lt;5 s → SINGLE, ≥10 s → LOOP, multi-file
          drop → PLAYLIST. Edge case: 5–10 s mono file? Default to SINGLE; user can flip the
          type on the pad. Acceptable, or split the threshold differently?<br/>
        ▸ <b>Path C "next available slot"</b> — proposal: row-major scan from top-left, first
          empty wins. Alternative: drop near the currently-focused / hovered slot. Row-major is
          predictable; "near-focus" is intent-respecting. Either works; pick before Slice 3.<br/>
        ▸ <b>Path A audio source</b> — proposal: the source picker shows a 3-way segmented
          control inside the popover: RECENT LIBRARY · BROWSE · DROP HERE. Keeps the popover
          small but supports all the common cases.<br/>
        ▸ <b>Path A → Path C handoff</b> — proposal: the inline popover has a "More options →"
          link that opens the full PAD Editor with the in-progress data carried over. So users
          can start in A and graduate to C without retyping.
      </div>
    </div>
  );
}

Object.assign(window, {
  FlowGrid, FlowFrame, InlinePopover, LibList, ToolbarStrip, EditorSheet,
  PathA_Desktop, PathB_Desktop, PathC_Desktop,
  PathA_Mobile, PathB_Mobile, PathC_Mobile,
  PathColumn, PadCreationFlowArtboard,
});
