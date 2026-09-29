// v16-mushroom-clock.jsx — A Mushroom Clock for the Verdant theme.
// Replaces the generic StandingClock when the verdant theme is active.
// Form factor: a classic toadstool with the clock face on the stem and
// a mini-mushroom-shaped pendulum bob. Mossy roots at the base.

function MushroomClock({ mode = 'live', remaining = 180, padName = 'OWL HOOT', height = 220 }) {
  const minutes = mode === 'live' ? 8  : Math.floor(remaining / 60);
  const seconds = mode === 'live' ? 42 : remaining % 60;
  const danger  = mode === 'countdown' && remaining < 30;
  const w  = 72;
  const cx = w / 2;

  // CAP outline — manually tuned half-widths per row so the dome reads as
  // a proper Amanita-style mushroom, not just an ellipse.
  const CAP_ROWS = [
    [ 4,  2], [ 8,  4], [12,  6], [16,  8],
    [19, 10], [22, 12], [24, 14], [25, 16],
    [26, 18], [26, 20], [26, 22], [25, 24],
    [23, 26], [20, 28],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} shapeRendering="crispEdges" style={{
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))',
      }}>

        {/* ───── CAP — red dome with subtle shading ────────────── */}
        {CAP_ROWS.map(([hw, y]) => (
          <rect key={`cap-${y}`} x={cx - hw} y={y} width={hw * 2} height={2} fill="#A03028" />
        ))}
        {/* Top highlight band — must stay inside the cap silhouette at
            each row. Cap is only 8 px wide at y=2 and 16 px wide at y=4,
            so the highlights are bound a hair narrower than the cap row. */}
        <rect x={cx - 3} y={2} width={6}  height={1} fill="#C8443A" />
        <rect x={cx - 7} y={4} width={14} height={1} fill="#B83A30" />
        {/* Cap rim — slightly darker bottom line for definition */}
        <rect x={cx - 24} y={26} width={48} height={2} fill="#7E1F18" />
        <rect x={cx - 20} y={28} width={40} height={1} fill="#5B1614" />

        {/* White dots — classic toadstool spots */}
        {[
          [-18, 8,  4, 3],
          [ -6, 5,  3, 3],
          [  8, 7,  4, 3],
          [ 16, 14, 3, 2],
          [-14, 18, 3, 2],
          [ 18, 22, 2, 2],
        ].map(([dx, y, dw, dh], i) => (
          <rect key={`dot-${i}`} x={cx + dx} y={y} width={dw} height={dh} fill="#F0E6C8" />
        ))}
        {/* Dot inner shadows for depth */}
        {[
          [-15, 10, 1],
          [ -4, 7,  1],
          [ 11, 9,  1],
        ].map(([dx, y, dw], i) => (
          <rect key={`ds-${i}`} x={cx + dx} y={y} width={dw} height={1} fill="rgba(0,0,0,.25)" />
        ))}

        {/* ───── GILLS — vertical strokes in the gap between cap and stem.
            Constrained: y=30..32 (fills the 3 px gap between the cap's
            last row at y=28-29 and the stem starting at y=33) and dx ≤ ±10
            (stays inside the stem's half-width of 13 with a margin). */}
        {[-10, -6, -2, 2, 6, 10].map((dx, i) => (
          <rect key={`g-${i}`} x={cx + dx} y={30} width={1} height={3} fill={i % 2 ? '#5B1614' : '#8A6E34'} />
        ))}

        {/* ───── STEM — warm cream column with side shading ── */}
        <rect x={cx - 13} y={33} width={26} height={92} fill="#C9B58A" />
        {/* Highlight on left */}
        <rect x={cx - 11} y={33} width={2} height={92} fill="#E8D6A8" />
        {/* Shadow on right */}
        <rect x={cx + 9} y={33} width={2} height={92} fill="#9C8868" />
        {/* Texture rings — subtle horizontal stripes */}
        {[44, 58, 78, 100, 118].map((y) => (
          <rect key={`ring-${y}`} x={cx - 11} y={y} width={22} height={1} fill="#A89870" opacity=".5" />
        ))}

        {/* ───── CLOCK FACE — embedded high on the stem ────── */}
        {/* Circle outline */}
        <circle cx={cx} cy={60} r="14" fill="#3a2818" stroke="#C9A04F" strokeWidth="1.2" />
        <circle cx={cx} cy={60} r="12" fill="#0F1A0E" />
        {/* Hour ticks at 12 / 3 / 6 / 9 */}
        {[0, 3, 6, 9].map((h) => {
          const a = (h * 30 - 90) * Math.PI / 180;
          const x = cx + Math.cos(a) * 10;
          const y = 60 + Math.sin(a) * 10;
          return <rect key={h} x={x - 1} y={y - 1} width={2} height={2} fill="#F2CC5C" />;
        })}
        {/* Hour-only minor ticks */}
        {[1, 2, 4, 5, 7, 8, 10, 11].map((h) => {
          const a = (h * 30 - 90) * Math.PI / 180;
          const x = cx + Math.cos(a) * 10;
          const y = 60 + Math.sin(a) * 10;
          return <rect key={`m-${h}`} x={x - 0.5} y={y - 0.5} width={1} height={1} fill="#C9A04F" opacity=".6" />;
        })}
        {/* Hour hand */}
        <g transform={`rotate(${mode === 'live' ? 250 : (minutes * 30)} ${cx} 60)`}>
          <rect x={cx - 1} y={52} width={2} height={8} fill="#F0E6C8" />
        </g>
        {/* Minute / second hand */}
        <g transform={`rotate(${mode === 'live' ? 60 : (seconds * 6)} ${cx} 60)`}>
          <rect x={cx - 0.5} y={49} width={1} height={11} fill={danger ? '#D63A3A' : '#F2CC5C'} />
        </g>
        {/* Centre pin */}
        <rect x={cx - 1} y={59} width={2} height={2} fill="#C9A04F" />

        {/* ───── DIGITAL READOUT (countdown only) ─────────── */}
        {mode === 'countdown' && (
          <g>
            <rect x={cx - 15} y={80} width={30} height={9} fill="#0a0604" stroke="#C9A04F" />
            <text x={cx} y={87} fontFamily="monospace" fontSize="7"
              fill={danger ? '#D63A3A' : '#F2CC5C'}
              textAnchor="middle" letterSpacing=".5">
              {String(minutes).padStart(1, '0')}:{String(seconds).padStart(2, '0')}
            </text>
          </g>
        )}

        {/* ───── PENDULUM WINDOW ──────────────────────────── */}
        <rect x={cx - 9} y={94} width={18} height={height - 124} fill="#0a0604" stroke="#3a2818" />

        {/* PENDULUM — rod with a mini mushroom as the bob */}
        <g style={{ transformOrigin: `${cx}px 94px`, animation: 'sb-mushroom-pendulum 2.3s ease-in-out infinite' }}>
          {/* Rod */}
          <rect x={cx - 0.5} y={94} width={1} height={height - 130} fill="#C9A04F" />
          {/* Mini mushroom bob */}
          <g transform={`translate(0, ${height - 38})`}>
            {/* mini cap */}
            <rect x={cx - 7} y={-4} width={14} height={2} fill="#A03028" />
            <rect x={cx - 5} y={-6} width={10} height={2} fill="#A03028" />
            <rect x={cx - 3} y={-7} width={6}  height={1} fill="#A03028" />
            {/* tiny white dots */}
            <rect x={cx - 4} y={-5} width={1}  height={1} fill="#F0E6C8" />
            <rect x={cx + 2} y={-4} width={1}  height={1} fill="#F0E6C8" />
            {/* highlight rim */}
            <rect x={cx - 3} y={-6} width={2} height={1} fill="#C8443A" />
            {/* mini stem */}
            <rect x={cx - 2} y={-2} width={4} height={4} fill="#C9B58A" />
            <rect x={cx - 2} y={-2} width={1} height={4} fill="#E8D6A8" />
          </g>
        </g>

        {/* ───── BASE — mossy ground + tiny mushrooms ─────── */}
        {/* dark earth band */}
        <rect x={2} y={height - 14} width={w - 4} height={6} fill="#1A382B" />
        {/* moss/grass top */}
        <rect x={0} y={height - 8} width={w} height={8} fill="#2A5640" />
        {/* moss tufts */}
        {[6, 14, 22, 32, 42, 52, 60, 66].map((x, i) => (
          <rect key={`m-${i}`} x={x} y={height - 10 - (i % 2)} width={2} height={3 + (i % 2)} fill="#4FA67A" />
        ))}
        {/* tiny mushrooms beside the base */}
        <g transform={`translate(8, ${height - 18})`}>
          <rect x={-1} y={0} width={5} height={1} fill="#A03028" />
          <rect x={0}  y={1} width={3} height={2} fill="#A03028" />
          <rect x={1}  y={3} width={2} height={3} fill="#C9B58A" />
        </g>
        <g transform={`translate(58, ${height - 16})`}>
          <rect x={-1} y={0} width={4} height={1} fill="#A03028" />
          <rect x={0}  y={1} width={2} height={2} fill="#C9B58A" />
        </g>

        {/* Tiny butterfly hovering near the cap (verdant accent) */}
        <g transform={`translate(${cx + 24}, 18)`} style={{ animation: 'sb-butterfly 4s ease-in-out infinite' }}>
          <rect x="-2" y="0" width="2" height="2" fill="#F2CC5C" />
          <rect x="-1" y="1" width="2" height="1" fill="#C9A04F" />
          <rect x="1"  y="0" width="2" height="2" fill="#F2CC5C" />
          <rect x="1"  y="1" width="2" height="1" fill="#C9A04F" />
          <rect x="0"  y="0" width="1" height="3" fill="#7E1F18" />
        </g>
      </svg>

      <style>{`
        @keyframes sb-mushroom-pendulum {
          0%, 100% { transform: rotate(-14deg); }
          50%      { transform: rotate(14deg); }
        }
        @keyframes sb-butterfly {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(-4px, -3px); }
          50%      { transform: translate(2px, -5px); }
          75%      { transform: translate(-2px, -2px); }
        }
      `}</style>

      {/* Countdown PAD chip */}
      {mode === 'countdown' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', background: 'var(--raised)',
          border: `1px solid ${danger ? 'var(--blood)' : 'var(--border-gold)'}`,
          borderLeft: `3px solid var(--pad-single)`,
        }}>
          <PixelIcon name="play" size={9} color="var(--pad-single)" />
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 9,
            color: danger ? 'var(--blood-bright)' : 'var(--gold)',
            letterSpacing: '.08em',
          }}>↳ {padName}</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MushroomClockArtboard — comparison + showcase + new verdant board
// ════════════════════════════════════════════════════════════════
function MushroomClockArtboard() {
  return (
    <div className="sb theme-verdant" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>Mushroom Clock · Verdant theme</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // Replaces the generic standing clock when the verdant theme is active.<br/>
          // Toadstool cap with white spots · clock face on the stem · mini-mushroom pendulum bob · mossy roots.
        </div>
      </div>

      <SectionLabel glyph="potion">SIDE-BY-SIDE — was vs. now</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <ClockCompare title="OLD · standing clock" sub="wooden grandfather — generic">
          <StandingClock mode="live" height={200} />
        </ClockCompare>
        <ClockCompare title="NEW · mushroom" sub="live mode" highlight>
          <MushroomClock mode="live" height={200} />
        </ClockCompare>
        <ClockCompare title="NEW · countdown" sub="4 min remaining">
          <MushroomClock mode="countdown" remaining={240} padName="OWL HOOT" height={200} />
        </ClockCompare>
        <ClockCompare title="NEW · &lt; 30s" sub="danger tint">
          <MushroomClock mode="countdown" remaining={22} padName="WOLF HOWL" height={200} />
        </ClockCompare>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="diamond">WHAT MAKES IT THEMATIC</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          ['Toadstool cap',     'Red dome with white spots — instantly reads as "forest" not "manor parlor". Top highlight band + bottom rim shadow give the cap volume.'],
          ['Gills under cap',   'Vertical 1-pixel stripes alternating dark red / earthy gold — the underside of a real mushroom, not just a hat.'],
          ['Clock-on-stem',     'The face sits high on the stem with gold rim + bone hour hand. Smaller than the standing clock\'s but more intimate.'],
          ['Mini-mushroom bob', 'The pendulum bob is itself a tiny toadstool — recurses the motif. Swings 2.3s, matched to the old pendulum cadence.'],
          ['Butterfly accent',  'A 5-pixel butterfly hovers near the cap on a slow 4s loop. Tiny piece of life that the wooden clock never had.'],
          ['Moss + sprouts',    'Dark earth band + mossy top + 8 grass tufts + 2 micro-mushrooms growing beside the base. Plants the clock in the ground.'],
        ].map(([k, v]) => (
          <div key={k} style={{
            padding: '10px 12px',
            background: 'var(--raised)',
            borderLeft: '3px solid var(--gold)',
          }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.06em', marginBottom: 3 }}>{k}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.45 }}>{v}</div>
          </div>
        ))}
      </div>

      <PixelDivider glyph="sparkle" />

      <SectionLabel glyph="star">VERDANT BOARD WITH THE MUSHROOM CLOCK</SectionLabel>
      <div style={{ height: 440, border: '1px solid var(--border)' }}>
        <ThemedBoardWithMushroom />
      </div>
    </div>
  );
}

function ClockCompare({ title, sub, highlight, children }) {
  return (
    <div style={{
      padding: 16,
      background: 'var(--surface)',
      border: highlight ? '2px solid var(--gold)' : '1px solid var(--border)',
      borderTop: highlight ? '2px solid var(--gold)' : '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      minHeight: 280,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: highlight ? 'var(--gold)' : 'var(--text-dim)', letterSpacing: '.14em' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ThemedBoardWithMushroom — a verdant board showing the mushroom
// clock in the sidebar slot, plus a few pads.
// ════════════════════════════════════════════════════════════════
function ThemedBoardWithMushroom() {
  const SCENES = ['Approach', 'The Glade', 'Combat', 'Aftermath'];
  const PADS = [
    { type: 'loop',     t: 'Forest',  k: 'F1', hot: true },
    { type: 'single',   t: 'Owl',    k: 'F2' },
    { type: 'loop',     t: 'Stream', k: 'F3' },
    { type: 'single',   t: 'Branch', k: 'F4' },
    { type: 'playlist', t: 'Druid',  k: 'F5' },
    { type: 'combo',    t: 'Spell',  k: 'F6' },
    { type: 'loop',     t: 'Wind',   k: 'F7' },
    { type: 'single',   t: 'Wolf',   k: 'F8' },
    { type: 'single',   t: 'Step',   k: 'Q' },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <PixelIcon name="flame" size={14} color="var(--flame)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.1em' }}>
          VERDANT · the glade · mushroom clock
        </span>
        <div style={{ flex: 1 }} />
        <span className="sb-mode-badge is-game" style={{ fontSize: 9 }}>GAME</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 130px', flex: 1, minHeight: 0 }}>
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', marginBottom: 6 }}>SCENES</div>
            {SCENES.map((s, i) => (
              <div key={s} style={{
                padding: '4px 6px',
                background: i === 1 ? 'var(--top)' : 'transparent',
                borderLeft: i === 1 ? '2px solid var(--gold)' : '2px solid transparent',
                fontFamily: 'var(--font-ui)', fontSize: 11,
                color: i === 1 ? 'var(--gold)' : 'var(--text-dim)',
                letterSpacing: '.04em',
              }}>{s}</div>
            ))}
          </div>

          {/* Mushroom clock slot */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <MushroomClock mode="live" height={200} />
          </div>
        </aside>

        <main style={{
          position: 'relative',
          background: 'var(--surface)',
          padding: 14, overflow: 'hidden',
        }}>
          <AmbientEmbers density={10} color="#5fc88f" />

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {PADS.map((p) => (
              <div key={p.t} className={'sb-pad' + (p.hot ? ' is-hot' : '')} data-type={p.type} style={{
                '--pad-color': `var(--pad-${p.type})`,
                '--pad-glow':  `var(--pad-${p.type}-glow)`,
                minHeight: 76, padding: 8,
              }}>
                <span className="sb-pad-key" style={{ fontSize: 9 }}>{p.k}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4 }}>
                  <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={10} color={`var(--pad-${p.type})`} />
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text)', paddingLeft: 4 }}>{p.t}</div>
              </div>
            ))}
          </div>
        </main>

        <aside style={{
          background: 'var(--deep)', borderLeft: '1px solid var(--border)',
          padding: '8px 6px', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.14em', marginBottom: 10 }}>MIXER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%', alignItems: 'center' }}>
            <div style={{ width: 90, height: 6, background: 'var(--sunk)', border: '1px solid var(--border-soft)' }}>
              <div style={{ width: '60%', height: '100%', background: 'var(--pad-loop)', boxShadow: '0 0 4px var(--pad-loop)' }} />
            </div>
            <div style={{ width: 90, height: 6, background: 'var(--sunk)', border: '1px solid var(--border-soft)' }}>
              <div style={{ width: '72%', height: '100%', background: 'var(--gold)', boxShadow: '0 0 4px var(--gold)' }} />
            </div>
          </div>

          {/* Mushroom cluster + hanging vine at the bottom */}
          <div style={{ flex: 1 }} />
          <div style={{ marginBottom: 4 }}>
            <MushroomCluster />
          </div>
          <div style={{ position: 'absolute', top: 0, right: -4, bottom: 0, pointerEvents: 'none' }}>
            <HangingVine height={300} />
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { MushroomClock, MushroomClockArtboard, ThemedBoardWithMushroom });
