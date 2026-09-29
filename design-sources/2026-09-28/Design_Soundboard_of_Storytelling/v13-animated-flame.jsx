// v13-animated-flame.jsx — A real animated pixel-fire.
// Interactive: tap to freeze (cold builds with each click), idle to thaw.
// Warm flame = GAME mode color family · frozen ice = SETUP mode.
//
// While the flame is WARM and the user taps, sparks burst out of the
// top in a generous cone. While it is COLD and the user taps, ice chips
// fly out of the surface — rotating, falling under gravity.
// The body subtly sways and breathes when burning, and the ice glitters
// when fully frozen.

// ── Base flame shape ─────────────────────────────────────────────
// 16×17 grid of pixels. Three layers per pixel: 0=outer, 1=mid, 2=core.
// The TIP rows (y=0,1) animate; everything below y=2 is the stable body.
const FLAME_TIP = [
  [7, 0, 2], [8, 0, 2],
  [7, 1, 1], [8, 1, 1],
];
const FLAME_BODY = [
  [6, 2, 0], [7, 2, 2], [8, 2, 2], [9, 2, 0],
  [6, 3, 0], [7, 3, 2], [8, 3, 2], [9, 3, 0],
  [5, 4, 0], [6, 4, 1], [7, 4, 2], [8, 4, 2], [9, 4, 1], [10, 4, 0],
  [5, 5, 0], [6, 5, 1], [7, 5, 2], [8, 5, 2], [9, 5, 1], [10, 5, 0],
  [4, 6, 0], [5, 6, 1], [6, 6, 2], [7, 6, 2], [8, 6, 2], [9, 6, 2], [10, 6, 1], [11, 6, 0],
  [4, 7, 0], [5, 7, 1], [6, 7, 2], [7, 7, 2], [8, 7, 2], [9, 7, 2], [10, 7, 1], [11, 7, 0],
  [3, 8, 0], [4, 8, 1], [5, 8, 2], [6, 8, 2], [7, 8, 2], [8, 8, 2], [9, 8, 2], [10, 8, 2], [11, 8, 1], [12, 8, 0],
  [3, 9, 0], [4, 9, 1], [5, 9, 2], [6, 9, 2], [7, 9, 2], [8, 9, 2], [9, 9, 2], [10, 9, 2], [11, 9, 1], [12, 9, 0],
  [3, 10, 0], [4, 10, 1], [5, 10, 2], [6, 10, 2], [7, 10, 2], [8, 10, 2], [9, 10, 2], [10, 10, 2], [11, 10, 1], [12, 10, 0],
  [4, 11, 0], [5, 11, 1], [6, 11, 2], [7, 11, 2], [8, 11, 2], [9, 11, 2], [10, 11, 1], [11, 11, 0],
  [4, 12, 0], [5, 12, 1], [6, 12, 2], [7, 12, 2], [8, 12, 2], [9, 12, 2], [10, 12, 1], [11, 12, 0],
  [5, 13, 0], [6, 13, 1], [7, 13, 2], [8, 13, 2], [9, 13, 1], [10, 13, 0],
  [5, 14, 0], [6, 14, 0], [7, 14, 1], [8, 14, 1], [9, 14, 0], [10, 14, 0],
  [6, 15, 0], [7, 15, 0], [8, 15, 0], [9, 15, 0],
];
const ICE_FACETS = [
  [4, 7], [5, 8], [6, 9], [7, 10],
  [11, 7], [10, 8], [9, 9],
  [6, 11], [7, 12], [8, 13],
  [4, 5], [11, 5], [3, 10], [12, 10], [5, 13], [10, 13],
];
// Source pixels for ice-chip particles — pixels that can chip off
const CHIP_SOURCES = [
  [4, 7], [5, 5], [6, 8], [7, 10], [10, 5], [11, 7], [10, 8], [9, 9],
  [4, 9], [5, 11], [10, 11], [6, 13], [9, 13], [5, 8], [11, 9],
];
// Possible glitter positions on the ice
const GLITTER_POS = [
  [4, 5], [5, 5], [10, 5], [11, 5], [5, 7], [10, 7], [4, 9], [11, 9],
  [6, 11], [9, 11], [5, 13], [10, 13], [7, 8], [8, 8], [3, 10], [12, 10],
];

// ── Helpers ──────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lerpColor(c1, c2, t) {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
}

const WARM = { outer: '#C46818', mid: '#E8881E', core: '#F5C242', heart: '#FFE8A0' };
const COLD = { outer: '#3F88B8', mid: '#5BAFD8', core: '#9FD8EE', heart: '#E8F8FF' };

function colorAt(layer, cold) {
  const w = WARM, c = COLD;
  if (layer === 0) return lerpColor(w.outer, c.outer, cold);
  if (layer === 1) return lerpColor(w.mid,   c.mid,   cold);
  return lerpColor(w.core, c.core, cold);
}

// ════════════════════════════════════════════════════════════════
// <AnimatedFlame /> — the main component.
// ════════════════════════════════════════════════════════════════
function AnimatedFlame({
  size = 120,
  interactive = true,
  thawSeconds = 1.6,
  freezePerTap = 0.18,
  initialCold = 0,
  onColdChange,
}) {
  const [cold, setCold] = React.useState(initialCold);
  const [time, setTime] = React.useState(0);
  const lastTapRef  = React.useRef(performance.now() - thawSeconds * 1000 - 1000);
  const coldRef     = React.useRef(cold);

  // Particle systems live in refs so they don't trigger re-renders.
  // setTime() already re-renders 60fps; we mutate the refs in the same loop.
  const particlesRef    = React.useRef([]); // sparks (kind:'spark') + chips (kind:'chip')
  const glitterRef      = React.useRef([]); // brief sparkles on the ice
  const glitterTimerRef = React.useRef(0);
  const lickRef         = React.useRef({ side: 0, until: 0 }); // tongue-lick burst

  React.useEffect(() => {
    coldRef.current = cold;
    if (onColdChange) onColdChange(cold);
  }, [cold, onColdChange]);

  // ── Animation loop ────────────────────────────────────────
  React.useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      setTime((t) => t + dt);

      // Thaw decay — only after a brief grace period after the last tap
      const sinceTap = (now - lastTapRef.current) / 1000;
      if (sinceTap > thawSeconds && coldRef.current > 0) {
        const decay = dt * 0.45; // ~2.2s full thaw
        const next = Math.max(0, coldRef.current - decay);
        if (next !== coldRef.current) setCold(next);
      }

      // Update spark / chip particles
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'chip') {
          p.vy += 26 * dt;            // gravity
          p.rot += p.spin * dt;
          p.vx *= (1 - dt * 0.25);    // mild drag
        } else {
          p.vy -= 4 * dt;             // buoyancy — sparks rise
          p.vx *= (1 - dt * 0.6);
        }
        p.life -= dt;
        if (p.life <= 0) ps.splice(i, 1);
      }

      // Random tongue-lick — only when warm. Adds a brief asymmetric flame.
      if (coldRef.current < 0.55 && now > lickRef.current.until) {
        if (Math.random() < dt * 1.6) {
          lickRef.current = {
            side: Math.random() < 0.5 ? -1 : 1,
            until: now + 80 + Math.random() * 140,
          };
        }
      }

      // Frozen-idle glitter — sparkles randomly appear on the ice surface
      glitterTimerRef.current -= dt;
      if (coldRef.current > 0.7 && glitterTimerRef.current <= 0) {
        glitterTimerRef.current = 0.22 + Math.random() * 0.5;
        const [gx, gy] = GLITTER_POS[Math.floor(Math.random() * GLITTER_POS.length)];
        glitterRef.current.push({ x: gx, y: gy, life: 0.42, maxLife: 0.42 });
      }
      for (let i = glitterRef.current.length - 1; i >= 0; i--) {
        glitterRef.current[i].life -= dt;
        if (glitterRef.current[i].life <= 0) glitterRef.current.splice(i, 1);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [thawSeconds]);

  // ── Tap → freeze + spawn particles ────────────────────────
  const handleTap = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    lastTapRef.current = performance.now();
    const c = coldRef.current;

    // SPARKS — when the flame is mostly warm
    if (c < 0.55) {
      const count = 9 + Math.floor(Math.random() * 5); // 9-13 sparks per tap
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
        const speed = 7 + Math.random() * 10;
        const life = 0.7 + Math.random() * 0.7;
        particlesRef.current.push({
          kind: 'spark',
          x: 8 + (Math.random() - 0.5) * 3,
          y: 4 + Math.random() * 3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life, maxLife: life,
          size: 0.45 + Math.random() * 0.7,
          warmth: Math.random(),
        });
      }
    }

    // ICE CHIPS — when the flame is mostly frozen
    if (c > 0.7) {
      const count = 5 + Math.floor(Math.random() * 3); // 5-7 chips
      for (let i = 0; i < count; i++) {
        const [px, py] = CHIP_SOURCES[Math.floor(Math.random() * CHIP_SOURCES.length)];
        const angle = Math.atan2(py - 9, px - 8) + (Math.random() - 0.5) * 0.55;
        const speed = 5 + Math.random() * 7;
        const life = 0.9 + Math.random() * 0.8;
        particlesRef.current.push({
          kind: 'chip',
          x: px + 0.5, y: py + 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          life, maxLife: life,
          size: 0.7 + Math.random() * 0.7,
          rot: Math.random() * 360,
          spin: (Math.random() - 0.5) * 700,
        });
      }
    }

    setCold((c) => Math.min(1, c + freezePerTap));
  };

  // ── Visuals derived from time + cold ──────────────────────
  const flicker = Math.max(0, 1 - cold * 1.4);

  // Subtle horizontal sway + vertical breath when burning
  const swayPx   = Math.sin(time * 1.4) * 0.4 * flicker;
  const breathY  = 1 + Math.sin(time * 2.3) * 0.030 * flicker;

  // Tip flicker — y=0 always animated, y=1 mostly, plus occasional y=-1 extension.
  // The tip animation runs at 12fps so it reads as discrete flicker, not smooth motion.
  const tipFrame = Math.floor(time * 12) % 16;
  const tipPixels = [];
  if (cold < 0.88) {
    FLAME_TIP.forEach(([x, y, l], i) => {
      const seed = (tipFrame * 11 + i * 17) % 13;
      const threshold = y === 0 ? 0.4 : 0.6;
      if (seed / 13 < threshold + flicker * 0.4) tipPixels.push([x, y, l]);
    });
    // Extension pixel — flame "reaches" one cell higher every few frames
    if (flicker > 0.4) {
      const ext = Math.floor(time * 4) % 5;
      if (ext === 0) tipPixels.push([7, -1, 2]);
      if (ext === 1) { tipPixels.push([7, -1, 2]); tipPixels.push([8, -1, 1]); }
      if (ext === 2) tipPixels.push([8, -1, 2]);
    }
  } else {
    // Frozen tip — keep four static pixels so the silhouette holds
    tipPixels.push([7, 0, 2], [8, 0, 2], [7, 1, 1], [8, 1, 1]);
  }

  // Tongue lick — an asymmetric mid-body bulge for ~120ms after the lickRef triggers
  const lickActive = performance.now() < lickRef.current.until;
  if (lickActive && cold < 0.55) {
    const side = lickRef.current.side;
    const baseX = side > 0 ? 11 : 4;
    tipPixels.push([baseX, 5, 0]);
    tipPixels.push([baseX + side, 6, 0]);
  }

  // Rising embers — small body pixels drifting up continuously while warm
  const ember1Phase = (time * 0.7) % 1;
  const ember2Phase = ((time * 0.7) + 0.5) % 1;
  const ember1 = flicker > 0.25;
  const ember2 = flicker > 0.4;

  // Core heart pulse
  const heart = 0.7 + 0.3 * Math.sin(time * 4) * flicker;
  const heartColor = lerpColor(WARM.heart, COLD.heart, cold);

  // Halo
  const haloColor = cold < 0.5
    ? lerpColor('#E8821E', '#9F88E8', cold * 2)
    : lerpColor('#9F88E8', '#5BAFD8', (cold - 0.5) * 2);
  const haloPulse = 1 + Math.sin(time * 3) * 0.06 * flicker;
  const haloIntensity = lerp(0.55, 0.22, cold) * haloPulse;

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'relative',
        width: size, height: size * (17 / 16),
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Halo */}
      <div style={{
        position: 'absolute', inset: -size * 0.32,
        background: `radial-gradient(circle, ${haloColor} 0%, transparent 60%)`,
        opacity: haloIntensity,
        pointerEvents: 'none',
        transition: 'opacity .15s',
      }} />

      <svg
        width={size}
        height={size * (17 / 16)}
        viewBox="0 0 16 17"
        shapeRendering="crispEdges"
        style={{ position: 'relative', display: 'block', overflow: 'visible' }}
      >
        {/* BODY — sways + breathes when warm */}
        <g style={{
          transform: `translate(${swayPx}px, 0) scaleY(${breathY})`,
          transformOrigin: '8px 16px',
        }}>
          {/* outer / mid / core layers, painted in order */}
          {[0, 1, 2].map((layer) => (
            <g key={layer}>
              {FLAME_BODY.filter(([, , l]) => l === layer).map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colorAt(layer, cold)} />
              ))}
            </g>
          ))}

          {/* Core heart — pulses bright when warm */}
          {cold < 0.85 && (
            <rect x="7" y="9" width="2" height="2" fill={heartColor}
              opacity={heart * (1 - cold)} />
          )}

          {/* Tip flicker + extension + lick */}
          {tipPixels.map(([x, y, l], i) => (
            <rect key={`tip-${i}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={colorAt(l, cold)} />
          ))}

          {/* Continuous body embers — gentle stream rising from the flame */}
          {ember1 && (
            <rect
              x={7 + Math.sin(time * 2) * 1.2}
              y={4 - ember1Phase * 5}
              width="0.6" height="0.6"
              fill={colorAt(2, cold)}
              opacity={(1 - ember1Phase) * flicker * 0.85}
            />
          )}
          {ember2 && (
            <rect
              x={8 + Math.cos(time * 1.8) * 1.0}
              y={3 - ember2Phase * 6}
              width="0.5" height="0.5"
              fill={lerpColor(WARM.mid, '#FFFFFF', ember2Phase * 0.4)}
              opacity={(1 - ember2Phase) * flicker * 0.7}
            />
          )}

          {/* Ice facets — fade in when freezing */}
          {cold > 0.5 && ICE_FACETS.map(([x, y], i) => (
            <rect key={`fa-${i}`} x={x} y={y} width="1" height="1"
              fill={i < 11 ? lerpColor(COLD.core, '#FFFFFF', 0.3) : '#FFFFFF'}
              opacity={Math.max(0, (cold - 0.5) * 2) * (i < 11 ? 0.85 : 1)}
            />
          ))}

          {/* Icicles below the base when fully frozen */}
          {cold > 0.7 && [[5, 15], [6, 16], [8, 16], [10, 15], [11, 16]].map(([x, y], i) => (
            <rect key={`ic-${i}`} x={x} y={y} width="1" height="1"
              fill={lerpColor(COLD.mid, '#FFFFFF', 0.4)}
              opacity={Math.max(0, (cold - 0.7) * 3.3)}
            />
          ))}

          {/* Frozen-idle glitter */}
          {glitterRef.current.map((g, i) => {
            const t = g.life / g.maxLife;
            // Triangle envelope so each glitter fades in + out
            const brightness = 1 - Math.abs(t - 0.5) * 2;
            return (
              <rect key={`gl-${i}-${g.x}-${g.y}`}
                x={g.x} y={g.y} width="1" height="1"
                fill="#FFFFFF" opacity={brightness} />
            );
          })}
        </g>

        {/* PARTICLES — outside the body transform so they fly free of the sway */}
        {particlesRef.current.map((p, i) => {
          const t = Math.max(0, p.life / p.maxLife);
          if (p.kind === 'spark') {
            // Hot core → cool mid as the spark cools mid-flight
            const color = lerpColor('#FFFFFF', lerpColor(WARM.core, WARM.mid, p.warmth), 1 - t * 0.4);
            return (
              <rect key={`sp-${i}`}
                x={p.x - p.size / 2} y={p.y - p.size / 2}
                width={p.size} height={p.size}
                fill={color} opacity={Math.min(1, t * 1.5)} />
            );
          }
          // Ice chip — square with rotation
          const color = lerpColor(COLD.core, '#FFFFFF', 0.35);
          return (
            <g key={`ch-${i}`} transform={`translate(${p.x},${p.y}) rotate(${p.rot})`}>
              <rect x={-p.size / 2} y={-p.size / 2} width={p.size} height={p.size}
                fill={color} opacity={Math.min(1, t * 1.4)} />
              {/* tiny inner highlight */}
              <rect x={-p.size / 4} y={-p.size / 4} width={p.size / 3} height={p.size / 3}
                fill="#FFFFFF" opacity={Math.min(1, t * 1.6)} />
            </g>
          );
        })}
      </svg>

      {/* Frost vignette */}
      {cold > 0.3 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle, transparent 50%, rgba(155,210,235,${(cold - 0.3) * 0.18}) 100%)`,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// <ColdMeter cold={0..1} /> — tiny secondary indicator
// ════════════════════════════════════════════════════════════════
function ColdMeter({ cold }) {
  return (
    <div style={{
      width: 120, height: 4,
      background: 'var(--sunk)',
      border: '1px solid var(--border-soft)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        width: cold * 100 + '%',
        background: cold < 0.4 ? 'var(--flame)' :
                    cold < 0.7 ? 'linear-gradient(90deg, var(--flame), #9F88E8)' :
                    'linear-gradient(90deg, var(--flame) 30%, var(--mode-setup))',
      }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// IntroScreen — recreates the screenshot
// ════════════════════════════════════════════════════════════════
function IntroScreen() {
  const [cold, setCold] = React.useState(0);
  return (
    <div className="sb" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 22, padding: '48px 24px',
      background: `
        radial-gradient(60% 70% at 50% 40%, rgba(60,30,90,.5) 0%, transparent 70%),
        radial-gradient(120% 80% at 50% 110%, rgba(15,8,30,.9) 0%, transparent 70%),
        #0A0814
      `,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <AnimatedFlame size={140} onColdChange={setCold} />

      <div className="sb-display" style={{
        fontSize: 26, textAlign: 'center', marginTop: 18,
        color: lerpColor('#F5C242', '#9FD8EE', cold),
        textShadow: cold < 0.5
          ? '0 0 6px rgba(245,194,66,.55), 0 0 18px rgba(245,194,66,.32), 0 0 36px rgba(245,194,66,.18)'
          : `0 0 6px rgba(159,216,238,${.55 - cold * .2}), 0 0 18px rgba(159,216,238,${.32 - cold * .12})`,
        letterSpacing: '.04em',
      }}>
        Soundboard of Storytelling
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="sb-mono is-italic" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          A tool for Game-Masters
        </span>
        <span className="sb-mono is-italic" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          and other creative Creatures
        </span>
      </div>

      <button
        style={{
          marginTop: 24,
          minWidth: 220, padding: '12px 24px',
          background: 'transparent',
          border: `1px solid ${lerpColor('#2A8A4F', '#5BAFD8', cold)}`,
          color: lerpColor('#3FD083', '#9FD8EE', cold),
          fontFamily: 'var(--font-ui)', fontSize: 16,
          letterSpacing: '.16em',
          cursor: 'pointer',
          transition: 'border-color .15s, color .15s',
        }}
      >
        {cold > 0.85 ? 'TAP TO THAW' : 'TAP TO START'}
      </button>

      {cold > 0.05 && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-mute)', letterSpacing: '.14em',
          opacity: Math.min(1, cold * 4),
          pointerEvents: 'none',
        }}>
          <span style={{ color: lerpColor('#E8821E', '#5BAFD8', cold) }}>
            {cold < 0.5 ? 'WARM · GAME' : 'COLD · SETUP'}
          </span>
          <ColdMeter cold={cold} />
          <span>{Math.round(cold * 100)}%</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HomeScreenWithFlame
// ════════════════════════════════════════════════════════════════
function HomeScreenWithFlame() {
  return (
    <div className="sb" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 6 }}>
        <AnimatedFlame size={84} />
      </div>
      <div className="sb-display" style={{ fontSize: 22, textAlign: 'center', marginTop: 16, marginBottom: 8 }}>
        Soundboard of Storytelling
      </div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span className="sb-mono is-italic" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          // a tool for game-masters and other creative creatures
        </span>
      </div>

      <div style={{
        width: '100%', maxWidth: 820,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <MenuRow icon="flame" title="BOARD"          sub="Board 1" active />
        <MenuRow icon="book"  title="LIBRARY"        sub="Audio · pads · boards · icons" />
        <MenuRow icon="cog"   title="SETTINGS"       sub="Controls · audio · display" />
        <MenuRow icon="bulb"  title="TIPS & TRICKS"  sub="Shortcuts and key bindings" />
        <MenuRow icon="info"  title="ABOUT"          sub="What this is and how it works" />
        <MenuRow icon="save"  title="EXPORT BACKUP"  sub="3 days since last export" danger />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// FlameTuneArtboard — five stages + try-it + effects legend
// ════════════════════════════════════════════════════════════════
function FlameTuneArtboard() {
  const STAGES = [
    { cold: 0.0,  label: 'WARM · GAME',     desc: 'Full flicker · sway + breath · embers · spark on tap' },
    { cold: 0.25, label: 'WANING',          desc: 'Movement softens · halo dims · still ember-flow' },
    { cold: 0.5,  label: 'TURNING',         desc: 'Colour halfway · facets faintly visible · halo lilac' },
    { cold: 0.75, label: 'FREEZING',        desc: 'Crystals visible · tip almost still · halo cyan' },
    { cold: 1.0,  label: 'FROZEN · SETUP',  desc: 'Crystallised · glitter sparkles · icicles · chips on tap' },
  ];
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>Animated Flame · Warm → Cold</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // tap warm to spark · tap frozen to chip ice · idle to thaw.<br/>
          // warm flame = GAME mode; frozen ice = SETUP mode.
        </div>
      </div>

      <SectionLabel glyph="flame">FIVE STAGES — frozen captures of the cold value</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {STAGES.map((s) => (
          <div key={s.cold} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: `2px solid ${lerpColor('#E8821E', '#5BAFD8', s.cold)}`,
            padding: 14,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <div style={{ background: 'var(--night)', padding: 12, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <AnimatedFlame size={70} interactive={false} initialCold={s.cold} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
              cold = {s.cold.toFixed(2)}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: lerpColor('#F5C242', '#9FD8EE', s.cold), letterSpacing: '.1em', textAlign: 'center' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.45, textAlign: 'center' }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="sparkle">TRY IT — tap the flame</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'center', marginBottom: 18 }}>
        <div style={{ background: 'var(--night)', padding: 40, display: 'flex', justifyContent: 'center', minHeight: 280 }}>
          <AnimatedFlame size={160} />
        </div>
        <div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            <b style={{ color: 'var(--gold)' }}>WARM TAPS</b> spawn <b>9–13 sparks</b> per click. Sparks rise upward and outward with buoyancy + drag — they fade white-hot, cool to gold, then go out.<br/><br/>
            <b style={{ color: 'var(--mode-setup)' }}>FROZEN TAPS</b> spawn <b>5–7 ice chips</b> per click. Chips fly out from random surface pixels, rotate as they tumble, fall under gravity, and fade.<br/><br/>
            ▸ Each tap also bumps <code>cold</code> by 0.18 (~6 taps to freeze).<br/>
            ▸ After 1.6 s of no taps, cold decays at 0.45 / s — full thaw ~2.2 s.<br/>
            ▸ Tongue licks: random asymmetric flame extensions when warm, ~120 ms each.<br/>
            ▸ Body sway: ±0.4 px horizontal (sine, 1.4 Hz) + vertical breath ±3 %.<br/>
            ▸ Continuous embers: two pixel streams rise from the flame core.<br/>
            ▸ Frozen glitter: white sparkle pixels appear randomly on the ice, ~3/s.<br/>
            ▸ Halo: orange → soft purple bridge → cyan, pulsing with the flicker.
          </div>
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="star">EFFECTS LEGEND</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          ['Sparks',          'warm-tap',   'Burst of 9–13 hot pixels in an upward cone.'],
          ['Ice chips',       'frozen-tap', 'Rotating pixel chunks fall under gravity.'],
          ['Tongue licks',    'warm-idle',  'Asymmetric ~120 ms flame extension every few seconds.'],
          ['Tip flicker',     'warm-idle',  'Top pixels appear/disappear at 12 fps.'],
          ['Continuous embers','warm-idle', 'Two pixel streams rise from the flame core.'],
          ['Body sway+breath','warm-idle',  'Subtle horizontal sine wobble + vertical breath.'],
          ['Halo pulse',      'warm-idle',  'Halo opacity oscillates with the flicker rhythm.'],
          ['Frozen glitter',  'frozen-idle','White sparkle pixels appear and fade on the ice.'],
          ['Frost vignette',  'transition', 'Edge mist that intensifies as cold rises.'],
          ['Crystal facets',  'transition', 'Crystalline slashes fade in from cold ≥ 0.5.'],
        ].map(([name, when, desc]) => (
          <div key={name} style={{
            padding: '8px 12px',
            background: 'var(--raised)',
            borderLeft: `3px solid ${when.includes('frozen') ? 'var(--mode-setup)' : when.includes('warm') ? 'var(--gold)' : 'var(--border-strong)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.08em' }}>{name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{when}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
          </div>
        ))}
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="moon">MODE LINK</SectionLabel>
      <div style={{
        padding: 16, background: 'var(--raised)', borderLeft: '3px solid var(--gold)',
        marginBottom: 16,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          ▸ <span style={{ color: 'var(--gold)' }}>WARM</span> = GAME mode — "the fire is on, we're playing"<br/>
          ▸ <span style={{ color: 'var(--mode-setup)' }}>COLD</span> = SETUP mode — "everything held still for editing"<br/>
          <br/>
          On the IntroScreen this is decorative — but tapping the flame fully cold could open the app directly into SETUP mode, otherwise GAME. A small thing, but reads as intent.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AnimatedFlame, ColdMeter, IntroScreen, HomeScreenWithFlame, FlameTuneArtboard,
  WARM_FLAME: WARM, COLD_FLAME: COLD,
});
