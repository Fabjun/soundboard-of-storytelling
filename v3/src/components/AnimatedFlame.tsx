// ─────────────────────────────────────────────────────────────────────────────
// AnimatedFlame — interactive pixel fire (StartScreen)
//
// Source: SoS_DESIGN_25052026/v13-animated-flame.jsx <AnimatedFlame /> (lines 76–407),
// imported 1:1: same grid, timings, particle physics and colour values.
// Import record: docs/design/imports/animated-flame.md
//
// Tap → freeze (cold builds with each tap) and sparks / ice chips; idle → thaw.
// Warm flame = GAME colour family · frozen ice = SETUP.
//
// Colours come from design tokens (--flame-*, --ice-*), read once at mount;
// per-frame blends are computed at runtime and applied inline (Path C).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  CHIP_SOURCES,
  CORE_FLICKER_FPS,
  RING_GLOW_FPS,
  RING_GLOW_STRENGTH,
  SPARK_LIFE_SCALE,
  FLAME_BODY,
  FLAME_TIP,
  GLITTER_POS,
  ICE_FACETS,
  ICICLES,
  HEART_CORNER_DIM,
  HEART_NEIGHBOURS,
  HEART_PIXELS,
  colorAt,
  coreFlickerColor,
  flickerNoise,
  smoothNoise,
  sparkColorAt,
  sparkOpacityAt,
  frostColorAt,
  haloColorAt,
  lerp,
  lerpColor,
  type FlamePalette,
  type FlamePixel,
} from '../lib/flameMath';

type Particle = {
  kind: 'spark' | 'chip';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  /** spark only */
  warmth: number;
  /** chip only */
  rot: number;
  /** chip only */
  spin: number;
};

type Glitter = { x: number; y: number; life: number; maxLife: number };

type AnimatedFlameProps = {
  size?: number;
  interactive?: boolean;
  thawSeconds?: number;
  freezePerTap?: number;
  initialCold?: number;
  onColdChange?: (cold: number) => void;
};

function readPalette(): FlamePalette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string): string => cs.getPropertyValue(name).trim();
  return {
    warm: {
      outer: v('--flame-outer'),
      mid: v('--flame-mid'),
      core: v('--flame-core'),
      heart: v('--flame-heart'),
    },
    cold: {
      outer: v('--ice-outer'),
      mid: v('--ice-mid'),
      core: v('--ice-core'),
      heart: v('--ice-heart'),
    },
    haloWarm: v('--flame'),
    haloTurn: v('--flame-halo-turn'),
    haloCold: v('--ice-mid'),
    frost: v('--ice-frost'),
    highlight: v('--flame-highlight'),
    smoke: v('--flame-smoke'),
  };
}

export function AnimatedFlame({
  size = 120,
  interactive = true,
  thawSeconds = 1.6,
  freezePerTap = 0.18,
  initialCold = 0,
  onColdChange,
}: AnimatedFlameProps): JSX.Element {
  const [palette] = useState<FlamePalette>(readPalette);
  const [cold, setCold] = useState(initialCold);
  const [time, setTime] = useState(0);
  const lastTapRef = useRef(performance.now() - thawSeconds * 1000 - 1000);
  const coldRef = useRef(cold);

  // Particle systems live in refs so they don't trigger re-renders.
  // setTime() already re-renders 60fps; we mutate the refs in the same loop.
  const particlesRef = useRef<Particle[]>([]); // sparks (kind:'spark') + chips (kind:'chip')
  const glitterRef = useRef<Glitter[]>([]); // brief sparkles on the ice
  const glitterTimerRef = useRef(0);
  const lickRef = useRef({ side: 0, until: 0 }); // tongue-lick burst

  useEffect(() => {
    coldRef.current = cold;
    if (onColdChange) onColdChange(cold);
  }, [cold, onColdChange]);

  // ── Animation loop ────────────────────────────────────────
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number): void => {
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
          p.vy += 26 * dt; // gravity
          p.rot += p.spin * dt;
          p.vx *= 1 - dt * 0.25; // mild drag
        } else {
          p.vy -= 4 * dt; // buoyancy — sparks rise
          p.vx *= 1 - dt * 0.6;
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
  const handleTap = (e: MouseEvent): void => {
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
        const life = (0.7 + Math.random() * 0.7) * SPARK_LIFE_SCALE; // longer: smoke phase
        particlesRef.current.push({
          kind: 'spark',
          x: 8 + (Math.random() - 0.5) * 3,
          y: 4 + Math.random() * 3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size: 0.45 + Math.random() * 0.7,
          warmth: Math.random(),
          rot: 0,
          spin: 0,
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
          x: px + 0.5,
          y: py + 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          life,
          maxLife: life,
          size: 0.7 + Math.random() * 0.7,
          warmth: 0,
          rot: Math.random() * 360,
          spin: (Math.random() - 0.5) * 700,
        });
      }
    }

    setCold((prev) => Math.min(1, prev + freezePerTap));
  };

  // ── Visuals derived from time + cold ──────────────────────
  const flicker = Math.max(0, 1 - cold * 1.4);

  // Subtle horizontal sway + vertical breath when burning
  const swayPx = Math.sin(time * 1.4) * 0.4 * flicker;
  const breathY = 1 + Math.sin(time * 2.3) * 0.03 * flicker;

  // Tip flicker — y=0 always animated, y=1 mostly, plus occasional y=-1 extension.
  // The tip animation runs at 12fps so it reads as discrete flicker, not smooth motion.
  const tipFrame = Math.floor(time * 12) % 16;
  const tipPixels: FlamePixel[] = [];
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
      if (ext === 1) {
        tipPixels.push([7, -1, 2]);
        tipPixels.push([8, -1, 1]);
      }
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
  const ember2Phase = (time * 0.7 + 0.5) % 1;
  const ember1 = flicker > 0.25;
  const ember2 = flicker > 0.4;

  // Core heart pulse
  const heart = 0.7 + 0.3 * Math.sin(time * 4) * flicker;
  const heartColor = lerpColor(palette.warm.heart, palette.cold.heart, cold);

  // Core flicker (V3 addition, not in the design): the core ring and the heart flicker
  // subtly in a discrete rhythm, slower than the 12fps tip; fades out as the flame freezes.
  const flickerFrame = Math.floor(time * CORE_FLICKER_FPS);
  const ringGlowPos = time * RING_GLOW_FPS; // core ring glides smoothly between targets
  const coreColor = colorAt(2, cold, palette);
  const midColor = colorAt(1, cold, palette);
  const heartJitter = 1 + (flickerNoise(flickerFrame, 997) - 0.5) * 0.3 * flicker;
  const neighbourNoise = flickerNoise(flickerFrame, 991);
  // One heart corner shines a little less — breaks the square shape (changes each frame)
  const dimCorner = Math.floor(flickerNoise(flickerFrame, 971) * HEART_PIXELS.length);
  const heartNeighbour =
    flicker > 0.4 && neighbourNoise > 0.78
      ? HEART_NEIGHBOURS[Math.floor(flickerNoise(flickerFrame, 983) * HEART_NEIGHBOURS.length)]
      : null;

  // Halo
  const haloColor = haloColorAt(cold, palette);
  const haloPulse = 1 + Math.sin(time * 3) * 0.06 * flicker;
  const haloIntensity = lerp(0.55, 0.22, cold) * haloPulse;

  const height = size * (17 / 16);

  return (
    <div
      class="sb-animated-flame"
      onClick={handleTap}
      style={{ width: size, height, cursor: interactive ? 'pointer' : 'default' }}
    >
      {/* Halo */}
      <div
        class="sb-animated-flame-halo"
        style={{
          inset: -size * 0.32,
          background: `radial-gradient(circle, ${haloColor} 0%, transparent 60%)`,
          opacity: haloIntensity,
        }}
      />

      <svg
        class="sb-animated-flame-svg"
        width={size}
        height={height}
        viewBox="0 0 16 17"
        shape-rendering="crispEdges"
      >
        {/* BODY — sways + breathes when warm */}
        <g
          style={{
            transform: `translate(${swayPx}px, 0) scaleY(${breathY})`,
            transformOrigin: '8px 16px',
          }}
        >
          {/* outer / mid / core layers, painted in order */}
          {[0, 1, 2].map((layer) => (
            <g key={layer}>
              {FLAME_BODY.filter(([, , l]) => l === layer).map(([x, y], i) => (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="1"
                  height="1"
                  fill={
                    layer === 2
                      ? coreFlickerColor(
                          coreColor,
                          heartColor,
                          midColor,
                          smoothNoise(ringGlowPos, i),
                          flicker,
                          RING_GLOW_STRENGTH,
                        )
                      : colorAt(layer, cold, palette)
                  }
                />
              ))}
            </g>
          ))}

          {/* Core heart — pulses bright when warm. Drawn as four pixels (V3 addition:
              the design uses one 2×2 rect) so one random corner can shine a little less. */}
          {cold < 0.85 &&
            HEART_PIXELS.map(([x, y], i) => (
              <rect
                key={`heart-${i}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={heartColor}
                opacity={
                  Math.min(1, heart * heartJitter) *
                  (1 - cold) *
                  (i === dimCorner ? 1 - HEART_CORNER_DIM : 1)
                }
              />
            ))}

          {/* Heart neighbour — a pixel next to the heart briefly lights up (V3 addition) */}
          {heartNeighbour && cold < 0.85 && (
            <rect
              x={heartNeighbour[0]}
              y={heartNeighbour[1]}
              width="1"
              height="1"
              fill={heartColor}
              opacity={0.55 * heart * (1 - cold)}
            />
          )}

          {/* Tip flicker + extension + lick */}
          {tipPixels.map(([x, y, l], i) => (
            <rect
              key={`tip-${i}-${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={colorAt(l, cold, palette)}
            />
          ))}

          {/* Continuous body embers — gentle stream rising from the flame */}
          {ember1 && (
            <rect
              x={7 + Math.sin(time * 2) * 1.2}
              y={4 - ember1Phase * 5}
              width="0.6"
              height="0.6"
              fill={colorAt(2, cold, palette)}
              opacity={(1 - ember1Phase) * flicker * 0.85}
            />
          )}
          {ember2 && (
            <rect
              x={8 + Math.cos(time * 1.8) * 1.0}
              y={3 - ember2Phase * 6}
              width="0.5"
              height="0.5"
              fill={lerpColor(palette.warm.mid, palette.highlight, ember2Phase * 0.4)}
              opacity={(1 - ember2Phase) * flicker * 0.7}
            />
          )}

          {/* Ice facets — fade in when freezing */}
          {cold > 0.5 &&
            ICE_FACETS.map(([x, y], i) => (
              <rect
                key={`fa-${i}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={
                  i < 11 ? lerpColor(palette.cold.core, palette.highlight, 0.3) : palette.highlight
                }
                opacity={Math.max(0, (cold - 0.5) * 2) * (i < 11 ? 0.85 : 1)}
              />
            ))}

          {/* Icicles below the base when fully frozen */}
          {cold > 0.7 &&
            ICICLES.map(([x, y], i) => (
              <rect
                key={`ic-${i}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={lerpColor(palette.cold.mid, palette.highlight, 0.4)}
                opacity={Math.max(0, (cold - 0.7) * 3.3)}
              />
            ))}

          {/* Frozen-idle glitter */}
          {glitterRef.current.map((g, i) => {
            const t = g.life / g.maxLife;
            // Triangle envelope so each glitter fades in + out
            const brightness = 1 - Math.abs(t - 0.5) * 2;
            return (
              <rect
                key={`gl-${i}-${g.x}-${g.y}`}
                x={g.x}
                y={g.y}
                width="1"
                height="1"
                fill={palette.highlight}
                opacity={brightness}
              />
            );
          })}
        </g>

        {/* PARTICLES — outside the body transform so they fly free of the sway */}
        {particlesRef.current.map((p, i) => {
          const t = Math.max(0, p.life / p.maxLife);
          if (p.kind === 'spark') {
            // White-hot → ember → black smoke (V3 addition: the design only faded out)
            const color = sparkColorAt(t, p.warmth, palette);
            return (
              <rect
                key={`sp-${i}`}
                x={p.x - p.size / 2}
                y={p.y - p.size / 2}
                width={p.size}
                height={p.size}
                fill={color}
                opacity={sparkOpacityAt(t)}
              />
            );
          }
          // Ice chip — square with rotation
          const color = lerpColor(palette.cold.core, palette.highlight, 0.35);
          return (
            <g key={`ch-${i}`} transform={`translate(${p.x},${p.y}) rotate(${p.rot})`}>
              <rect
                x={-p.size / 2}
                y={-p.size / 2}
                width={p.size}
                height={p.size}
                fill={color}
                opacity={Math.min(1, t * 1.4)}
              />
              {/* tiny inner highlight */}
              <rect
                x={-p.size / 4}
                y={-p.size / 4}
                width={p.size / 3}
                height={p.size / 3}
                fill={palette.highlight}
                opacity={Math.min(1, t * 1.6)}
              />
            </g>
          );
        })}
      </svg>

      {/* Frost vignette — deviation from the design: the design's
          `radial-gradient(circle, transparent 50%, frost 100%)` fills the corners of the
          rectangular root and shows as a light box when frozen. Here the frost is a soft
          round ring that fades out again before the edge (closest-side). */}
      {cold > 0.3 && (
        <div
          class="sb-animated-flame-frost"
          style={{
            background: `radial-gradient(circle closest-side, transparent 50%, ${frostColorAt(cold, palette)} 85%, transparent 100%)`,
          }}
        />
      )}
    </div>
  );
}
