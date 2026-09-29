// v3-variety.jsx — Pad-variety study.
// First: reconstruct the user's actual library screen as a baseline so
// the "monotone" critique reads visually. Then: four discrete strategies
// for adding type identity to each pad without competing with the mode
// accent, plus a combined recommendation.

// ─────────────────────────────────────────────────────────────────
// PadTile — the actual current-state tile, monotone in mode colour.
// Matches the screenshot: thin 1px border, hotkey at top centre,
// pixel icon middle, name at bottom. Everything paints in --acc.
// ─────────────────────────────────────────────────────────────────
function PadTile({ icon, name, hotkey, acc, size = 88, iconSize = 36, labelSize = 11, hotkeySize = 12, dashed }) {
  return (
    <div style={{
      width: size, height: size,
      background: 'var(--surface)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${acc}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 4px 4px',
      position: 'relative',
      cursor: 'pointer',
      flex: '0 0 auto',
    }}>
      {hotkey && (
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: hotkeySize, color: acc, lineHeight: 1,
          letterSpacing: '.04em',
        }}>{hotkey}</div>
      )}
      <div style={{ color: acc, flex: 1, display: 'flex', alignItems: 'center' }}>
        <PixelIcon name={icon} size={iconSize} />
      </div>
      <div style={{
        fontFamily: 'var(--font-ui)',
        fontSize: labelSize, color: acc,
        lineHeight: 1, whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
        width: '100%', textAlign: 'center',
      }}>{name}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sample data — mirrors the user's actual library content
// ─────────────────────────────────────────────────────────────────
const SAMPLE_PADS = [
  { name: 'NIGHT',       icon: 'moon',     hk: '=', type: 'loop'     },
  { name: 'DAY',         icon: 'star',     hk: '*', type: 'loop'     },
  { name: 'Wind',        icon: 'sparkle',  hk: '%', type: 'loop'     },
  { name: 'ghost_whis…', icon: 'eye',             type: 'loop'     },
  { name: 'Rain',        icon: 'potion',         type: 'loop'     },
  { name: 'Playlist_M…', icon: 'scroll',         type: 'playlist' },
  { name: 'bell deep',   icon: 'diamond',  hk: '7', type: 'single'   },
  { name: 'Rooster',     icon: 'flame',          type: 'single'   },
  { name: 'Thunder',     icon: 'flame',    hk: '(', type: 'single'   },
  { name: 'Sword hit…',  icon: 'rune',           type: 'single'   },
  { name: 'hammer',      icon: 'hourglass',hk: '-', type: 'single'   },
  { name: 'clock tick…', icon: 'hourglass',      type: 'loop'     },
  { name: 'wolf howl',   icon: 'skull',    hk: '6', type: 'single'   },
  { name: 'witch 01',    icon: 'rune',     hk: '5', type: 'single'   },
  { name: 'fire',        icon: 'flame',    hk: '1', type: 'loop'     },
  { name: 'gear runnig', icon: 'cog',            type: 'loop'     },
  { name: 'fall body',   icon: 'skull',          type: 'single'   },
  { name: 'ghost 01',    icon: 'eye',            type: 'single'   },
  { name: 'victory mu…', icon: 'star',           type: 'playlist' },
  { name: 'gear clicki…',icon: 'cog',            type: 'loop'     },
  { name: 'ticking clo…',icon: 'hourglass',      type: 'loop'     },
  { name: 'Clocktower',  icon: 'flame',    hk: '8', type: 'loop'     },
  { name: 'Kill',        icon: 'flame',    hk: '/', type: 'single'   },
  { name: 'boom cinem…', icon: 'rune',           type: 'single'   },
  { name: 'Anklage',     icon: 'flame',    hk: '9', type: 'single'   },
  { name: 'swordhit b…', icon: 'rune',           type: 'single'   },
  { name: 'crowd appl…', icon: 'star',           type: 'single'   },
  { name: 'gear heavy',  icon: 'cog',            type: 'loop'     },
  { name: 'WIN',         icon: 'sparkle',        type: 'combo'    },
  { name: 'punch',       icon: 'rune',     hk: '3', type: 'single'   },
  { name: 'chain',       icon: 'rune',     hk: '2', type: 'combo'    },
];

// ─────────────────────────────────────────────────────────────────
// Reconstruction: the user's actual library look in both modes.
// Shared chrome (top bar with SETUP|GAME toggle, sidebar with
// filter + style sliders, red backup strip at the bottom).
// ─────────────────────────────────────────────────────────────────
function LibraryActualScreen({ mode = 'game' }) {
  const acc = mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)';
  const accDim = mode === 'game' ? 'var(--gold-dim)' : 'rgba(109,181,184,.4)';

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        background: 'var(--deep)',
        borderBottom: `1px solid ${accDim}`,
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: acc, cursor: 'pointer' }}>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor">
              <rect x="0" y="0" width="20" height="2"/>
              <rect x="0" y="6" width="20" height="2"/>
              <rect x="0" y="12" width="20" height="2"/>
            </svg>
          </div>
          <div style={{
            padding: '6px 14px',
            border: `1px solid ${acc}`,
            color: acc,
            fontFamily: 'var(--font-ui)',
            fontSize: 13, letterSpacing: '.1em',
          }}>MENU</div>
        </div>

        <div style={{ flex: 1 }} />

        {/* SETUP | GAME toggle */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '4px 16px',
          border: `1px solid ${acc}`,
          background: 'var(--sunk)',
          fontFamily: 'var(--font-ui)', fontSize: 16, letterSpacing: '.12em',
        }}>
          <span style={{
            color: mode === 'setup' ? acc : 'var(--text-mute)',
            padding: '2px 10px',
            background: mode === 'setup' ? 'var(--top)' : 'transparent',
          }}>SETUP</span>
          <span style={{ color: 'var(--text-mute)', padding: '0 6px' }}>|</span>
          <span style={{
            color: mode === 'game' ? acc : 'var(--text-mute)',
            padding: '2px 10px',
            background: mode === 'game' ? 'var(--top)' : 'transparent',
          }}>GAME</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 10, color: acc }}>
          <div style={{ border: `1px solid ${acc}`, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>?</div>
          <div style={{ border: `1px solid ${acc}`, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M1 4V1h3M11 4V1H8M1 8v3h3M11 8v3H8" />
            </svg>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '175px 1fr', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ background: 'var(--night)', padding: '14px 12px', borderRight: `1px solid ${accDim}` }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.14em', marginBottom: 10 }}>FILTER</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 22 }}>
            <PillTag acc={acc} active>ALL</PillTag>
            <PillTag acc={acc}>S-PAD</PillTag>
            <PillTag acc={acc}>C-PAD</PillTag>
          </div>

          {mode === 'setup' && (
            <>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.14em', marginBottom: 10 }}>PAD STYLE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <SlimSlider label="◰ SIZE" value={0.28} acc={acc} />
                <SlimSlider label="↔ GAP"  value={0.32} acc={acc} />
                <SlimSlider label="◉ ICO"  value={0.62} acc={acc} />
                <SlimSlider label="▦ DENS" value={0.46} acc={acc} />
                <SlimSlider label="T LBL"  value={0.40} acc={acc} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <ShapeTag acc={acc} active><span style={{ width: 10, height: 10, background: acc, display: 'inline-block', marginRight: 6 }} />SQ</ShapeTag>
                <ShapeTag acc={acc}><span style={{ width: 10, height: 10, border: `1px solid ${acc}`, display: 'inline-block', marginRight: 6 }} />RD</ShapeTag>
                <ShapeTag acc={acc}><span style={{ width: 10, height: 10, border: `1px solid ${acc}`, borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />CI</ShapeTag>
              </div>
            </>
          )}
        </aside>

        {/* Pad grid */}
        <main style={{ background: `radial-gradient(120% 60% at 50% -10%, var(--glow-radial) 0%, transparent 60%), var(--night)`, padding: '14px 16px', overflow: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              padding: '6px 12px',
              background: 'var(--sunk)', border: `1px solid ${accDim}`,
              fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-mute)',
            }}>Search PADs…</div>
            <div style={{
              padding: '6px 14px',
              border: `1px solid ${accDim}`,
              fontFamily: 'var(--font-ui)', fontSize: 13, color: acc, letterSpacing: '.1em',
            }}>SORT ▾</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 6 }}>
            {SAMPLE_PADS.slice(0, 31).map((p, i) => (
              <PadTile key={i} icon={p.icon} name={p.name} hotkey={p.hk}
                acc={acc} dashed={mode === 'setup'} size={70} iconSize={28} labelSize={10} hotkeySize={11} />
            ))}
            {mode === 'setup' && (
              <PadTile icon="diamond" name="NEW PAD" hotkey="+" acc={accDim} dashed size={70} iconSize={20} labelSize={10} hotkeySize={11} />
            )}
          </div>

          {/* Backup strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            background: 'var(--night)',
            borderTop: '1px solid var(--blood)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--blood-bright)' }}>tap below to back up your data now.</span>
            <div style={{ flex: 1 }} />
            <div style={{
              padding: '6px 14px',
              background: 'var(--blood)',
              color: '#fff',
              fontFamily: 'var(--font-ui)', fontSize: 13, letterSpacing: '.1em',
            }}>EXPORT NOW</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function PillTag({ children, acc, active }) {
  return (
    <span style={{
      padding: '4px 10px',
      border: `1px solid ${acc}`,
      background: active ? 'var(--top)' : 'transparent',
      fontFamily: 'var(--font-ui)', fontSize: 12, color: acc,
      letterSpacing: '.1em',
    }}>{children}</span>
  );
}
function ShapeTag({ children, acc, active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px',
      border: `1px solid ${acc}`,
      background: active ? 'var(--top)' : 'transparent',
      fontFamily: 'var(--font-ui)', fontSize: 11, color: acc,
      letterSpacing: '.1em',
    }}>{children}</span>
  );
}
function SlimSlider({ label, value = 0.5, acc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', minWidth: 48, letterSpacing: '.06em' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--sunk)', position: 'relative', border: '1px solid var(--border-soft)' }}>
        <div style={{ position: 'absolute', inset: 0, width: (value * 100) + '%', background: acc }} />
        <div style={{ position: 'absolute', top: '50%', left: (value * 100) + '%', width: 8, height: 12, background: acc, transform: 'translate(-50%, -50%)' }} />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// VARIATION TILES — four discrete strategies for adding type identity
// ═════════════════════════════════════════════════════════════════
function tColor(type) {
  return ({
    single: 'var(--pad-single)',
    loop: 'var(--pad-loop)',
    playlist: 'var(--pad-playlist)',
    combo: 'var(--pad-combo)',
  })[type];
}

// A — coloured icon. Icon paints in pad-type colour; everything else
// stays mode-coloured (border, hotkey, label).
function PadA({ p, mode = 'game', dashed }) {
  const acc = mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)';
  return (
    <div style={{
      width: 84, height: 84,
      background: 'var(--surface)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${acc}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 4px 4px', position: 'relative',
    }}>
      {p.hk && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: acc, lineHeight: 1 }}>{p.hk}</div>}
      <div style={{ color: tColor(p.type) }}><PixelIcon name={p.icon} size={34} /></div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: acc, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{p.name}</div>
    </div>
  );
}

// B — colour spine. 3 px coloured bar at the left edge; icon stays
// neutral (mode-coloured). Subtle but readable.
function PadB({ p, mode = 'game', dashed }) {
  const acc = mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)';
  return (
    <div style={{
      width: 84, height: 84,
      background: 'var(--surface)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${acc}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 4px 4px', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, background: tColor(p.type) }} />
      {p.hk && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: acc, lineHeight: 1 }}>{p.hk}</div>}
      <div style={{ color: acc }}><PixelIcon name={p.icon} size={34} /></div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: acc, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{p.name}</div>
    </div>
  );
}

// C — coloured hotkey + type pip. Hotkey character shifts to type
// colour and gains a tiny type-coloured pip beside it. Most subtle.
function PadC({ p, mode = 'game', dashed }) {
  const acc = mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)';
  return (
    <div style={{
      width: 84, height: 84,
      background: 'var(--surface)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${acc}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 4px 4px', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', fontSize: 12, lineHeight: 1 }}>
        <div style={{ width: 5, height: 5, background: tColor(p.type) }} />
        {p.hk && <span style={{ color: acc }}>{p.hk}</span>}
      </div>
      <div style={{ color: acc }}><PixelIcon name={p.icon} size={34} /></div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: acc, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{p.name}</div>
    </div>
  );
}

// D — tile / aureole. Icon sits on a type-coloured pixel "tile" — a
// soft tinted block behind it. Richest, most decorative.
function PadD({ p, mode = 'game', dashed }) {
  const acc = mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)';
  const c = tColor(p.type);
  return (
    <div style={{
      width: 84, height: 84,
      background: 'var(--surface)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${acc}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 4px 4px', position: 'relative',
    }}>
      {p.hk && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: acc, lineHeight: 1 }}>{p.hk}</div>}
      <div style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${c}33 0%, transparent 100%)`,
        border: `1px solid ${c}55`,
        color: c,
      }}>
        <PixelIcon name={p.icon} size={28} />
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: acc, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{p.name}</div>
    </div>
  );
}

// Recommended — combines spine + coloured icon + status pulse when hot.
// Most legible at scale; mode accent still dominant on chrome/borders.
function PadRec({ p, mode = 'game', dashed, hot }) {
  const acc = mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)';
  const c = tColor(p.type);
  return (
    <div style={{
      width: 84, height: 84,
      background: 'var(--surface)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${hot ? c : acc}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 4px 4px', position: 'relative',
      boxShadow: hot ? `0 0 12px ${c}aa, inset 0 0 0 1px ${c}` : 'none',
    }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, background: c }} />
      {p.hk && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: acc, lineHeight: 1 }}>{p.hk}</div>}
      <div style={{ color: c }}><PixelIcon name={p.icon} size={34} /></div>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 11,
        color: hot ? c : acc,
        lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        width: '100%', textAlign: 'center',
      }}>{p.name}</div>
      {hot && (
        <div style={{
          position: 'absolute', bottom: 0, left: 3, right: 0, height: 2,
          background: c, opacity: .9,
        }} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PAD VARIETY ARTBOARD — the comparison study
// ═════════════════════════════════════════════════════════════════
function PadVarietyArtboard() {
  const PICK = SAMPLE_PADS.slice(0, 14);  // representative subset

  const Row = ({ title, Variant, mode = 'game' }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8,
      }}>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 16,
          color: 'var(--text)', letterSpacing: '.06em',
        }}>{title}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PICK.map((p, i) => <Variant key={i} p={p} mode={mode} />)}
      </div>
    </div>
  );

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 22 }}>PAD Variety Study</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // The mode is signalled by colour (gold = GAME, teal = SETUP) on the chrome.<br/>
          // What's missing: PADs of different TYPES read identical inside the same mode.<br/>
          // Below: four strategies for adding type identity without competing with mode.
        </div>
      </div>

      {/* Baseline — current monotone */}
      <SectionLabel glyph="diamond">CURRENT — every PAD identical (the problem)</SectionLabel>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PICK.map((p, i) => (
            <PadTile key={i} icon={p.icon} name={p.name} hotkey={p.hk} acc="var(--gold)" />
          ))}
        </div>
        <div className="sb-mono" style={{ fontSize: 12, marginTop: 8 }}>
          // Mode = gold. ALL 14 pads look the same. Single / Loop / Playlist / Combo<br/>
          // are indistinguishable unless you read the name.
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="potion">A · COLOURED ICON  —  loudest signal, type reads from across the room</SectionLabel>
      <Row title="" Variant={PadA} />
      <div className="sb-mono" style={{ fontSize: 12, marginBottom: 18 }}>
        // ✓ Strong type read   ·   ✓ Same shape    ·   ⚠ Mode colour visible only on border + label.
      </div>

      <SectionLabel glyph="rune">B · LEFT-EDGE SPINE  —  subtle, type still scannable at small sizes</SectionLabel>
      <Row title="" Variant={PadB} />
      <div className="sb-mono" style={{ fontSize: 12, marginBottom: 18 }}>
        // ✓ Mode colour stays dominant on the tile   ·   ✓ Works tiny   ·   ⚠ Quiet at distance.
      </div>

      <SectionLabel glyph="key">C · TYPE PIP  ·  next to hotkey  —  whisper-quiet, almost invisible</SectionLabel>
      <Row title="" Variant={PadC} />
      <div className="sb-mono" style={{ fontSize: 12, marginBottom: 18 }}>
        // ✓ Least visual noise   ·   ⚠ Hard to scan when many pads share a type.
      </div>

      <SectionLabel glyph="diamond">D · TYPE TILE  —  icon on a tinted aureole; decorative, alchemy-feel</SectionLabel>
      <Row title="" Variant={PadD} />
      <div className="sb-mono" style={{ fontSize: 12, marginBottom: 22 }}>
        // ✓ Richest pixel-art texture   ·   ✓ Strong type read<br/>
        // ⚠ Slightly busy when dozens of pads cluster — may need a smaller tile or only on hover.
      </div>

      <PixelDivider glyph="sparkle" />

      <SectionLabel glyph="star">RECOMMENDED — spine + coloured icon. Both states shown.</SectionLabel>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 6 }}>GAME · idle</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PICK.map((p, i) => <PadRec key={i} p={p} mode="game" />)}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 6 }}>GAME · 3 PADs playing (hot — full type colour takes over)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PICK.map((p, i) => <PadRec key={i} p={p} mode="game" hot={i === 4 || i === 11 || i === 5} />)}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 6 }}>SETUP · dashed borders, type identity still visible</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PICK.map((p, i) => <PadRec key={i} p={p} mode="setup" dashed />)}
        </div>
      </div>

      <div className="sb-mono" style={{ fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
        // <span style={{ color: 'var(--gold)' }}>Mode</span> still drives the chrome — toolbar, sidebar borders, hotkey labels, mode badge.<br/>
        // <span style={{ color: 'var(--pad-loop)' }}>Type</span> lives on the pad and only takes over when the pad becomes hot.<br/>
        // The two systems stack instead of fighting: glance once → mode; glance twice → types.
      </div>
    </div>
  );
}

Object.assign(window, {
  PadTile, SAMPLE_PADS, LibraryActualScreen, PadA, PadB, PadC, PadD, PadRec, PadVarietyArtboard, tColor,
});
