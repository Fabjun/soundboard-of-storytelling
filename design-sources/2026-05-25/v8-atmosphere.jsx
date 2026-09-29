// v8-atmosphere.jsx — Cozy decorations for the Board mode.
// Every effect is opt-in via the AtmosphereProvider state below, and
// scoped to pixel-art aesthetics: no foreign gradients, no glass, no
// blur. Everything keeps the "tabletop game-master at a fire" feel.

// ════════════════════════════════════════════════════════════════
// 1 · AMBIENT EMBERS — slow-rising pixel particles in the canvas
//     background. Triggered by the hearth, fades before reaching
//     the top. Capped at ~24 particles; CSS-only animation.
// ════════════════════════════════════════════════════════════════
function AmbientEmbers({ density = 22, color, hue = 'flame' }) {
  // Deterministic seeded positions so re-renders don't reshuffle
  const particles = React.useMemo(() => {
    return Array.from({ length: density }).map((_, i) => {
      const seed = i * 73.13;
      return {
        left:    ((seed * 1.7)  % 100),
        delay:   (seed * 0.31)  % 18,
        dur:     12 + (seed % 14),
        size:    2 + ((seed * 0.5) % 4),
        drift:   ((seed * 0.7) % 60) - 30,
        opacity: 0.3 + ((seed * 0.13) % 0.5),
      };
    });
  }, [density]);

  const c = color || (hue === 'flame' ? 'var(--flame)' : hue === 'gold' ? 'var(--gold)' : `var(--pad-${hue})`);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', overflow: 'hidden',
      zIndex: 0,
    }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.left}%`, bottom: -10,
          width: p.size, height: p.size,
          background: c,
          opacity: p.opacity,
          animation: `sb-ember ${p.dur}s linear infinite`,
          animationDelay: `-${p.delay}s`,
          ['--drift']: `${p.drift}px`,
        }} />
      ))}
      <style>{`
        @keyframes sb-ember {
          0%   { transform: translateY(0)            translateX(0);            opacity: 0; }
          12%  {                                                                opacity: var(--ember-peak, .9); }
          85%  {                                                                opacity: var(--ember-fade, .4); }
          100% { transform: translateY(-100vh)       translateX(var(--drift)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2 · HEARTH GLOW — warm firelight gradient at the bottom edge of
//     the workspace. Bleeds upward, very subtle. The visual anchor
//     that says "you're sitting near a fire."
// ════════════════════════════════════════════════════════════════
function HearthGlow({ intensity = 1, hue = 'flame' }) {
  const c = hue === 'flame' ? '232, 130, 30' :
            hue === 'gold'  ? '212, 178, 92' :
            hue === 'blood' ? '160, 40, 40'  : '232, 130, 30';
  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0, bottom: 0, height: '60%',
      background: `radial-gradient(80% 100% at 50% 130%, rgba(${c},${0.16 * intensity}) 0%, rgba(${c},${0.06 * intensity}) 50%, transparent 80%)`,
      pointerEvents: 'none',
      zIndex: 0,
      mixBlendMode: 'screen',
    }} />
  );
}

// ════════════════════════════════════════════════════════════════
// 3 · STAGE FRAME — pixel-art corner ornaments at the four corners
//     of the workspace + a thin gilded inset border. The "stage
//     proscenium" effect, drawn in pixels not vectors.
// ════════════════════════════════════════════════════════════════
function StageFrame({ inset = 4, color = 'var(--gold-dim)', tip = 'var(--gold)' }) {
  // The corner motif: a 16×16 pixel L-shape with a small flourish at
  // the inner elbow. Painted via inline SVG so theme swaps apply.
  const Corner = ({ flipX, flipY }) => (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{
      transform: `scale(${flipX ? -1 : 1},${flipY ? -1 : 1})`,
      display: 'block',
    }}>
      {/* Outer L */}
      <rect x="0" y="0" width="14" height="2" fill={color} />
      <rect x="0" y="0" width="2"  height="14" fill={color} />
      {/* Inner pip */}
      <rect x="6" y="6" width="2" height="2" fill={tip} />
      <rect x="9" y="3" width="2" height="2" fill={tip} />
      <rect x="3" y="9" width="2" height="2" fill={tip} />
      {/* Tiny accent rune */}
      <rect x="11" y="11" width="2" height="2" fill={color} />
    </svg>
  );

  return (
    <div style={{ position: 'absolute', inset, pointerEvents: 'none', zIndex: 2 }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>                          <Corner /> </div>
      <div style={{ position: 'absolute', top: 0, right: 0 }}>                         <Corner flipX /> </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0 }}>                       <Corner flipY /> </div>
      <div style={{ position: 'absolute', bottom: 0, right: 0 }}>                      <Corner flipX flipY /> </div>

      {/* Hairline inset border — barely there, gives the proscenium effect */}
      <div style={{
        position: 'absolute', inset: 11,
        border: `1px solid ${color}`,
        opacity: .25,
      }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4 · CHAPTER HEADER — illuminated-manuscript style scene title.
//     Big VT323 name flanked by sigils + sub-rule + scene meta.
//     Replaces the bland "The Tavern" header inside the board.
// ════════════════════════════════════════════════════════════════
function ChapterHeader({ chapter = 'II', title = 'The Tavern', sub = 'Approach · Day · 16 pads', glyphLeft = 'star', glyphRight = 'moon' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '8px 0 12px',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {/* Drop-cap chapter mark */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12, color: 'var(--gold-dim)',
          letterSpacing: '.08em',
        }}>CHAPTER {chapter}</div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <PixelIcon name={glyphLeft} size={18} color="var(--gold)" />
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          color: 'var(--gold-bright)',
          letterSpacing: '.06em',
          textShadow: '0 0 6px rgba(245,213,122,.45), 0 0 16px rgba(245,213,122,.22)',
        }}>
          {title.toUpperCase()}
        </div>
        <PixelIcon name={glyphRight} size={18} color="var(--gold)" />
      </div>
      {/* Ornamental rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold-dim)' }}>
        <div style={{
          width: 80, height: 2,
          backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px)',
        }} />
        <PixelIcon name="diamond" size={6} color="var(--gold)" />
        <div style={{
          width: 80, height: 2,
          backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px)',
        }} />
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontStyle: 'italic',
        fontSize: 12,
        color: 'var(--text-mute)',
      }}>// {sub}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5 · NOW-PLAYING AURA — soft radial glow behind a pad when hot.
//     Bleeds onto neighbouring pads slightly, like firelight
//     warming an adjacent surface. Pure CSS, no DOM elements.
// ════════════════════════════════════════════════════════════════
const NOW_PLAYING_AURA_CSS = `
.sb-board-canvas .sb-pad.is-hot {
  position: relative;
  z-index: 1;
}
.sb-board-canvas .sb-pad.is-hot::after {
  content: "";
  position: absolute;
  inset: -16px;
  background: radial-gradient(circle at 50% 50%, var(--pad-glow, rgba(245,213,122,.5)) 0%, transparent 60%);
  pointer-events: none;
  z-index: -1;
  animation: sb-aura-breath 3.4s ease-in-out infinite;
}
@keyframes sb-aura-breath {
  0%, 100% { opacity: .8; transform: scale(1); }
  50%      { opacity: 1;  transform: scale(1.04); }
}
`;

// ════════════════════════════════════════════════════════════════
// 6 · BREATHING PAD — gentle pulse on idle Loop pads, matching the
//     rhythm of a calm breath. Tells the eye "these are alive,
//     just sleeping" without distracting from playback.
// ════════════════════════════════════════════════════════════════
const BREATHING_PAD_CSS = `
.sb-board-canvas .sb-pad[data-type="loop"]:not(.is-hot)::before {
  animation: sb-pad-breath 5.2s ease-in-out infinite;
}
@keyframes sb-pad-breath {
  0%, 100% { opacity: .55; }
  50%      { opacity: .95; }
}
`;

// ════════════════════════════════════════════════════════════════
// 7 · SCENE RUNES — each scene in the left rail gets a contextual
//     pixel-art glyph, like an illuminated chapter mark in a
//     gamebook. The icon is colour-aware: gold for the active scene,
//     muted gold-dim otherwise.
// ════════════════════════════════════════════════════════════════
const SCENE_RUNES = {
  approach:   { icon: 'moon',      label: 'before sundown' },
  tavern:     { icon: 'potion',    label: 'firelight' },
  combat:     { icon: 'rune',      label: 'iron and oath' },
  boss:       { icon: 'skull',     label: 'the necromancer' },
  aftermath:  { icon: 'hourglass', label: 'silence after' },
};

function SceneRune({ kind, active }) {
  const meta = SCENE_RUNES[kind] || { icon: 'diamond' };
  return (
    <PixelIcon
      name={meta.icon}
      size={16}
      color={active ? 'var(--gold-bright)' : 'var(--gold-dim)'}
    />
  );
}

// ════════════════════════════════════════════════════════════════
// 8 · BUS RIBBON — when a pad plays, a thin coloured ribbon
//     "streams" from the pad along the panel edge toward the
//     mixer strip on the right rail. Implemented per-pad as a CSS
//     pseudo-element so it can be feature-flagged.
// ════════════════════════════════════════════════════════════════
function BusRibbon({ from, to, color }) {
  // For prototype: render a single subtle gradient bar across the
  // top of the workspace, segment-coloured per active pad. Real
  // implementation would track per-pad geometry.
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, transparent 0%, ${color || 'var(--pad-loop)'} 30%, ${color || 'var(--pad-loop)'} 70%, transparent 100%)`,
      opacity: .55,
      pointerEvents: 'none',
      zIndex: 3,
      animation: 'sb-ribbon-flow 8s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes sb-ribbon-flow {
          0%, 100% { opacity: .35; }
          50%      { opacity: .7; }
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 9 · CHAPTER DIVIDER — between groups of pads. Decorative pixel
//     rule with a flanking glyph. Use to break a board with many
//     pads into thematic sub-groups.
// ════════════════════════════════════════════════════════════════
function ChapterDivider({ glyph = 'diamond', label }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 0',
      color: 'var(--gold-dim)',
    }}>
      <div style={{
        flex: 1, height: 2,
        backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px)',
      }} />
      <PixelIcon name={glyph} size={10} color="var(--gold)" />
      {label && (
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          color: 'var(--gold)',
          letterSpacing: '.14em',
          textTransform: 'uppercase',
        }}>{label}</span>
      )}
      <PixelIcon name={glyph} size={10} color="var(--gold)" />
      <div style={{
        flex: 1, height: 2,
        backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px)',
      }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 10 · CANDLE — vertical pixel-art candle that lives at the edge
//      of the screen, flickering. Use one per side of the workspace.
// ════════════════════════════════════════════════════════════════
function Candle({ height = 80 }) {
  return (
    <div style={{
      width: 18, height: height + 30,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative',
    }}>
      {/* Flame */}
      <svg width="14" height="20" viewBox="0 0 14 20" style={{
        animation: 'sb-candle-flicker 1.2s ease-in-out infinite',
      }}>
        <rect x="6" y="2" width="2" height="2" fill="var(--gold-bright)"/>
        <rect x="5" y="4" width="4" height="2" fill="var(--flame)"/>
        <rect x="4" y="6" width="6" height="4" fill="var(--flame)"/>
        <rect x="5" y="10" width="4" height="2" fill="var(--gold-bright)"/>
        <rect x="6" y="12" width="2" height="2" fill="#000"/>
      </svg>
      {/* Wax body */}
      <div style={{
        width: 10, height,
        background: 'var(--gold-dim)',
        borderTop: '1px solid var(--gold)',
        borderBottom: '1px solid #000',
        marginTop: -2,
      }} />
      {/* Halo */}
      <div style={{
        position: 'absolute', top: 6, left: '50%',
        width: 40, height: 40,
        background: 'radial-gradient(circle, rgba(232,130,30,.35) 0%, transparent 60%)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        animation: 'sb-halo-pulse 1.8s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes sb-candle-flicker {
          0%, 100% { transform: translateY(0)    scaleY(1); }
          25%      { transform: translateY(-1px) scaleY(1.06); }
          50%      { transform: translateY(0)    scaleY(.94); }
          75%      { transform: translateY(-1px) scaleY(1.02); }
        }
        @keyframes sb-halo-pulse {
          0%, 100% { opacity: .9; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 11 · MASTER HEARTBEAT — a slow pixel-pulse in the status bar
//      that thumps every ~2.5s, like a slow drum. Synchronizes the
//      whole UI to a felt rhythm. Disable for sci-fi theme.
// ════════════════════════════════════════════════════════════════
function MasterHeartbeat() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontSize: 11,
      color: 'var(--text-mute)',
    }}>
      <span style={{
        width: 6, height: 6,
        background: 'var(--flame)',
        animation: 'sb-heartbeat 2.4s ease-in-out infinite',
      }} />
      hearth
      <style>{`
        @keyframes sb-heartbeat {
          0%, 100% { opacity: .35; transform: scale(1); }
          15%      { opacity: 1;   transform: scale(1.4); }
          25%      { opacity: .55; transform: scale(1); }
          40%      { opacity: .8;  transform: scale(1.25); }
          50%      { opacity: .35; transform: scale(1); }
        }
      `}</style>
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
// COZY BOARD — full demonstration combining the best decorations
// in moderation. Designed to feel warm without becoming busy.
// ════════════════════════════════════════════════════════════════
function CozyBoard({ atmosphere = {} }) {
  const A = {
    embers:     true,
    hearth:     true,
    frame:      true,
    aura:       true,
    breathing:  true,
    chapter:    true,
    candles:    true,
    heartbeat:  true,
    ribbon:     true,
    divider:    true,
    ...atmosphere,
  };

  const SCENES = [
    ['approach',  'Approach',           false],
    ['tavern',    'The Tavern',         true],
    ['combat',    'Combat — Forest',    false],
    ['boss',      'Boss · Necromancer', false],
    ['aftermath', 'Aftermath',          false],
  ];

  const PADS = [
    { type: 'single',   t: 'Tavern Door', m: '0:04', k: 'F1' },
    { type: 'loop',     t: 'Rain Heavy',  m: '∞',    k: 'F2', hot: true },
    { type: 'loop',     t: 'Fireplace',   m: '∞',    k: 'F3', hot: true },
    { type: 'single',   t: 'Sword Clash', m: '0:02', k: 'F4' },
    { type: 'single',   t: 'Wolf Howl',   m: '0:08', k: 'F5' },
    { type: 'loop',     t: 'Crowd',       m: '∞',    k: 'F6' },
    { type: 'playlist', t: 'Tavern Mix',  m: '14 trax', k: 'F7' },
    { type: 'single',   t: 'Thunder',     m: '0:03', k: 'F8' },
  ];

  const PADS_2 = [
    { type: 'combo',    t: 'Boss Reveal', m: '4-chain', k: 'Q' },
    { type: 'single',   t: 'Door Slam',   m: '0:01', k: 'W' },
    { type: 'playlist', t: 'Combat Mix',  m: '6 trax', k: 'E' },
    { type: 'loop',     t: 'Whispers',    m: '∞', k: 'R' },
    { type: 'single',   t: 'Coin Drop',   m: '0:01', k: 'T' },
    { type: 'single',   t: 'Owl Hoot',    m: '0:04', k: 'Y' },
    { type: 'loop',     t: 'Wind',        m: '∞', k: 'U' },
    { type: 'single',   t: 'Bell Toll',   m: '0:06', k: 'I' },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{NOW_PLAYING_AURA_CSS}</style>
      {A.breathing && <style>{BREATHING_PAD_CSS}</style>}

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{ color: 'var(--flame)' }}><PixelIcon name="flame" size={20} /></div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--text)', letterSpacing: '.08em' }}>
          Soundboard of Storytelling
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>
          · Board 1 · Cozy mode
        </span>
        <div style={{ flex: 1 }} />
        <span className="sb-mode-badge is-game" style={{ fontSize: 11 }}>
          <PixelIcon name="play" size={11} color="currentColor" /> GAME
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', flex: 1, minHeight: 0 }}>

        {/* Left rail — scenes with runes */}
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="moon" title="SCENES" active />
          <div style={{ padding: 8, flex: 1, overflow: 'auto' }}>
            {SCENES.map(([kind, label, active], i) => (
              <div key={kind} style={{
                padding: '8px 10px',
                background: active ? 'var(--top)' : 'transparent',
                borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 1,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <span style={{
                  width: 18, fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-mute)',
                }}>{(i + 1).toString().padStart(2, '0')}</span>
                <SceneRune kind={kind} active={active} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-ui)', fontSize: 14,
                    color: active ? 'var(--gold-bright)' : 'var(--text-dim)',
                    letterSpacing: '.04em',
                  }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: 10, color: 'var(--text-mute)' }}>
                    {SCENE_RUNES[kind]?.label}
                  </div>
                </div>
                {active && <PixelIcon name="sparkle" size={10} color="var(--gold-bright)" />}
              </div>
            ))}
          </div>

          {A.candles && (
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0', borderTop: '1px solid var(--border-soft)' }}>
              <Candle height={50} />
              <Candle height={64} />
              <Candle height={42} />
            </div>
          )}
        </aside>

        {/* CENTER — the workspace */}
        <main className="sb-board-canvas" style={{
          position: 'relative',
          background: `radial-gradient(70% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.3) 100%), var(--surface)`,
          padding: '14px 24px',
          overflow: 'auto',
        }}>
          {/* Atmosphere layers */}
          {A.embers && <AmbientEmbers density={20} />}
          {A.hearth && <HearthGlow intensity={1} />}
          {A.frame  && <StageFrame inset={6} />}
          {A.ribbon && <BusRibbon color="var(--pad-loop)" />}

          {/* Content — sits above atmosphere */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {A.chapter && <ChapterHeader chapter="II" title="The Tavern" sub="Approach · Day · 16 pads · 2 playing" />}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '8px 18px 0' }}>
              {PADS.map((p) => (
                <div key={p.t} className={'sb-pad' + (p.hot ? ' is-hot' : '')} data-type={p.type} style={{
                  '--pad-color': `var(--pad-${p.type})`,
                  '--pad-glow':  `var(--pad-${p.type}-glow)`,
                }}>
                  <span className="sb-pad-key">{p.k}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
                    <div style={{ color: `var(--pad-${p.type})` }}>
                      <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={14} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-ui)', fontSize: 11,
                      color: `var(--pad-${p.type})`, letterSpacing: '.1em',
                    }}>{p.type.toUpperCase()}</span>
                  </div>
                  <div style={{ paddingLeft: 6 }}>
                    <div className="sb-pad-title">{p.t}</div>
                    <div className="sb-pad-meta">{p.m}</div>
                  </div>
                </div>
              ))}

              {A.divider && <ChapterDivider glyph="diamond" label="LATER" />}

              {PADS_2.map((p) => (
                <div key={p.t} className={'sb-pad' + (p.hot ? ' is-hot' : '')} data-type={p.type} style={{
                  '--pad-color': `var(--pad-${p.type})`,
                  '--pad-glow':  `var(--pad-${p.type}-glow)`,
                }}>
                  <span className="sb-pad-key">{p.k}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
                    <div style={{ color: `var(--pad-${p.type})` }}>
                      <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={14} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-ui)', fontSize: 11,
                      color: `var(--pad-${p.type})`, letterSpacing: '.1em',
                    }}>{p.type.toUpperCase()}</span>
                  </div>
                  <div style={{ paddingLeft: 6 }}>
                    <div className="sb-pad-title">{p.t}</div>
                    <div className="sb-pad-meta">{p.m}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right rail — mixer */}
        <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="sparkle" title="NOW PLAYING" active right={<span className="sb-caption">2</span>} />
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MixerRowV2 type="loop" title="RAIN HEAVY" sub="0:42 / 2:14" value={0.5} />
            <MixerRowV2 type="loop" title="FIREPLACE"  sub="∞ · 0:12"   value={0.6} />
          </div>

          <PanelHeaderV2 icon="diamond" title="MASTER" />
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabelSliderV2 label="MASTER" value={0.72} />
            <LabelSliderV2 label="AMBIENT" value={0.45} color="var(--pad-loop)" />
            <LabelSliderV2 label="STINGER" value={0.90} color="var(--pad-single)" />
          </div>
        </aside>
      </div>

      {/* Status footer with the optional heartbeat */}
      <div className="sb-status-bar">
        <span className="sb-status-section" style={{ color: 'var(--gold)' }}>LIVE</span>
        <span className="sb-status-section">Board 1 · The Tavern</span>
        <span className="sb-status-section">2 playing</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {A.heartbeat && <MasterHeartbeat />}
          <span>Master 72%</span>
          <span>48 kHz</span>
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SHOWCASE — each effect alone so the user can see exactly what
// it does and decide which to keep.
// ════════════════════════════════════════════════════════════════
function AtmosphereShowcaseArtboard() {
  const Item = ({ title, desc, children }) => (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--gold)',
      padding: 14, display: 'flex', gap: 18,
      alignItems: 'flex-start',
    }}>
      <div style={{ flex: '0 0 220px' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--gold)', letterSpacing: '.08em', marginBottom: 4 }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{ flex: 1, minHeight: 120, position: 'relative', background: 'var(--night)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>Board Atmosphere</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // ten optional decorations, each scoped to pixel-art.<br/>
          // Mix and match — every effect is opt-in via the Tweaks panel.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Item title="1 · Ambient embers" desc="Slow rising pixel particles, ~20 on screen, fade before reaching the top. CSS animation, no JS tick. The single most atmospheric cue — small but the room feels warmer instantly.">
          <AmbientEmbers density={20} />
        </Item>

        <Item title="2 · Hearth glow" desc="A warm radial gradient at the bottom edge of the workspace, like firelight bleeding upward. Screen-blend so it adds light, never darkens.">
          <HearthGlow intensity={1.5} />
        </Item>

        <Item title="3 · Stage frame" desc="Pixel-art L-shaped corner ornaments at the four corners of the workspace + a hairline gilded inset border. Drawn in 22×22 pixel cells; theme-aware.">
          <StageFrame inset={8} />
        </Item>

        <Item title="4 · Chapter header" desc="The scene title treated like an illuminated-manuscript chapter mark — drop-cap CHAPTER II / flanking glyphs / ornamental rule / italic mono subtitle.">
          <div style={{ padding: 16 }}><ChapterHeader chapter="II" title="The Tavern" sub="Approach · Day · 16 pads" /></div>
        </Item>

        <Item title="5 · Now-playing aura" desc="Playing pads gain a soft pulse aura in their type colour. Bleeds onto neighbouring pads slightly, like a lantern in a corridor. Pure CSS keyframes (3.4s breath).">
          <div style={{ display: 'flex', gap: 12, padding: 18 }}>
            <style>{NOW_PLAYING_AURA_CSS}</style>
            <div className="sb-board-canvas" style={{ position: 'relative', display: 'flex', gap: 12 }}>
              <div className="sb-pad is-hot" data-type="loop" style={{ '--pad-color': 'var(--pad-loop)', '--pad-glow': 'var(--pad-loop-glow)', width: 90 }}>
                <div style={{ paddingLeft: 6 }}>
                  <div className="sb-pad-title">RAIN</div>
                  <div className="sb-pad-meta">∞ · loop</div>
                </div>
              </div>
              <div className="sb-pad is-hot" data-type="single" style={{ '--pad-color': 'var(--pad-single)', '--pad-glow': 'var(--pad-single-glow)', width: 90 }}>
                <div style={{ paddingLeft: 6 }}>
                  <div className="sb-pad-title">BELL</div>
                  <div className="sb-pad-meta">0:06</div>
                </div>
              </div>
            </div>
          </div>
        </Item>

        <Item title="6 · Breathing pads" desc="Idle Loop pads' coloured spines gently pulse on a 5.2s cycle — alive but sleeping. So subtle you won't notice until it's off.">
          <div style={{ display: 'flex', gap: 12, padding: 18 }}>
            <style>{BREATHING_PAD_CSS}</style>
            <div className="sb-board-canvas" style={{ display: 'flex', gap: 12 }}>
              <div className="sb-pad" data-type="loop" style={{ '--pad-color': 'var(--pad-loop)', width: 90 }}>
                <div style={{ paddingLeft: 6 }}>
                  <div className="sb-pad-title">CROWD</div>
                  <div className="sb-pad-meta">∞ · idle</div>
                </div>
              </div>
              <div className="sb-pad" data-type="loop" style={{ '--pad-color': 'var(--pad-loop)', width: 90 }}>
                <div style={{ paddingLeft: 6 }}>
                  <div className="sb-pad-title">WIND</div>
                  <div className="sb-pad-meta">∞ · idle</div>
                </div>
              </div>
            </div>
          </div>
        </Item>

        <Item title="7 · Scene runes" desc="Each scene in the left rail gets a contextual pixel-art glyph — moon for approach, potion for tavern, rune for combat, skull for boss, hourglass for aftermath. Italic mono subtitle for flavour.">
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['approach', 'Approach'],
              ['tavern', 'The Tavern'],
              ['combat', 'Combat — Forest'],
              ['boss', 'Boss · Necromancer'],
            ].map(([k, l], i) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SceneRune kind={k} active={i === 1} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: i === 1 ? 'var(--gold-bright)' : 'var(--text-dim)' }}>{l}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: 11, color: 'var(--text-mute)' }}>// {SCENE_RUNES[k].label}</span>
              </div>
            ))}
          </div>
        </Item>

        <Item title="8 · Chapter dividers" desc="Use to break a long pad grid into thematic sub-groups (BEFORE / DURING / AFTER, or DAY / NIGHT). Pixel-rule with flanking glyphs and an uppercase label.">
          <div style={{ padding: 14 }}>
            <ChapterDivider glyph="diamond" label="LATER" />
            <ChapterDivider glyph="moon" label="NIGHT FALLS" />
            <ChapterDivider glyph="rune" />
          </div>
        </Item>

        <Item title="9 · Candles" desc="Vertical pixel-art candles with a flickering flame and a soft halo. Tuck two or three at the foot of the scenes rail or in an empty corner. Tactile, never decorative-for-decoration's-sake.">
          <div style={{ padding: 14, display: 'flex', gap: 24, alignItems: 'flex-end' }}>
            <Candle height={60} />
            <Candle height={80} />
            <Candle height={48} />
          </div>
        </Item>

        <Item title="10 · Master heartbeat" desc="A small pixel dot in the status bar that pulses like a slow drum — 'lub-dub' every 2.4s. Synchronises the whole UI to a felt rhythm. Disable for sci-fi.">
          <div style={{ padding: 18 }}>
            <div className="sb-status-bar" style={{ background: 'var(--deep)' }}>
              <span className="sb-status-section" style={{ color: 'var(--gold)' }}>LIVE</span>
              <span className="sb-status-section">Board 1</span>
              <span style={{ marginLeft: 'auto' }}><MasterHeartbeat /></span>
            </div>
          </div>
        </Item>
      </div>

      <div style={{ height: 24 }} />
      <SectionLabel glyph="sparkle">A FEW IDEAS I'D LEAVE FOR LATER (TOO RISKY OR TOO BUSY)</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        ▸ Floating dust motes drifting downward — pretty but distracting during a session.<br/>
        ▸ Per-bus visualiser bars in the status footer — useful but adds chrome you'd never look at.<br/>
        ▸ Animated background mist — would require WebGL to look right; clip-path mist looks cheap.<br/>
        ▸ Pad covers with parchment texture — fights the pixel-art voice, becomes "fantasy slop".<br/>
        ▸ Synced bus ribbons (every active pad streams to its bus) — needs real geometry tracking, save for code.<br/>
        ▸ Reading the scene name aloud on swap (Web Speech API) — too on-the-nose.
      </div>
    </div>
  );
}

Object.assign(window, {
  AmbientEmbers, HearthGlow, StageFrame, ChapterHeader, SceneRune, BusRibbon,
  ChapterDivider, Candle, MasterHeartbeat, CozyBoard, AtmosphereShowcaseArtboard,
  NOW_PLAYING_AURA_CSS, BREATHING_PAD_CSS, SCENE_RUNES,
});
