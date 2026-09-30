// ─────────────────────────────────────────────────────────────────────────────
// AnimatedFlame — interactive pixel fire (StartScreen), hybrid of two designs
//
// Idle:   design-sources/2026-05-25/v13-animated-flame.jsx (tip flicker 12fps, sway,
//         breath, tongue lick, embers, heart pulse) + V3 additions (core-ring glow,
//         heart flicker with a dimmer corner).
// Freeze: design-sources/2026-09-28/…/flame-engine.jsx + flame-themes.jsx "Hearth":
//         idle → transform → hold (4 s) → revert; frost creeps in from the edge,
//         falling frost, cracks, glinting facets, ice shards, steam, drips, re-ignite.
//         Idle crackle and rare embers from Hearth as well.
// Drawn on a canvas (Hearth engine); glow is a drop-shadow that follows the pixel
// silhouette. Colours come from design tokens, read once at mount.
// Import record: docs/design/imports/animated-flame.md
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  CELL,
  CORE_FLICKER_FPS,
  FIELD_H,
  FIELD_OX,
  FIELD_OY,
  FIELD_W,
  FLAME_BODY,
  FLAME_TIP,
  HEART_CORNER_DIM,
  HEART_NEIGHBOURS,
  HEART_PIXELS,
  HEARTH_FACETS,
  RING_GLOW_FPS,
  SHARD_EDGES,
  coreFlickerColor,
  flameEmit,
  flickerNoise,
  glowBlurAt,
  glowColorAt,
  initialFlameState,
  layerOf,
  lerpColor,
  particleAlpha,
  pixelFreeze,
  smoothNoise,
  stepFlameState,
  tapFlameState,
  updateParticles,
  type FlamePalette,
  type FlamePixel,
  type FlameState,
  type Particle,
} from '../lib/flameMath';

type AnimatedFlameProps = {
  /** Width of the flame itself (16 cells) in CSS px; the canvas field around it is larger. */
  size?: number;
  interactive?: boolean;
};

type CrackLine = { pts: [number, number][]; life: number; max: number };

type Runtime = {
  st: FlameState;
  particles: Particle[];
  cracks: CrackLine[];
  crackleNext: number;
  holdJolted: boolean;
  reignited: boolean;
  lickSide: number;
  lickUntil: number;
  lastFilter: string;
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
    glowWarm: v('--flame'),
    glowCold: v('--ice-glow'),
    steam: v('--flame-steam'),
    highlight: v('--flame-highlight'),
  };
}

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

function makeParticle(p: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y'>): Particle {
  const maxLife = p.maxLife ?? 1;
  return {
    vx: 0,
    vy: 0,
    g: 0,
    fade: 0.3,
    color: '',
    s: 1,
    rot: 0,
    spin: 0,
    steamDrift: false,
    seed: p.x * 13.7 + p.y * 7.3,
    ...p,
    maxLife,
    life: maxLife,
  };
}

export function AnimatedFlame({ size = 120, interactive = true }: AnimatedFlameProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef<FlamePalette | null>(null);
  const rtRef = useRef<Runtime>({
    st: initialFlameState(),
    particles: [],
    cracks: [],
    crackleNext: 0,
    holdJolted: false,
    reignited: false,
    lickSide: 0,
    lickUntil: 0,
    lastFilter: '',
  });

  // ── Hearth spawners ─────────────────────────────────────────
  // Tap feedback: sparks ∝ warmth (1 − charge), steam ∝ cold (charge); burst scales.
  const strike = (charge: number, burst: number): void => {
    const pal = paletteRef.current;
    if (!pal) return;
    const ps = rtRef.current.particles;
    const warmth = 1 - charge;
    const nSpark = Math.round(burst * (1 + warmth * 7));
    const nSteam = Math.round(burst * (0.7 + charge * 5));
    for (let i = 0; i < nSpark; i++) {
      const e = flameEmit();
      ps.push(
        makeParticle({
          kind: 'ember',
          x: FIELD_OX + e[0] + rnd(-0.5, 0.5),
          y: FIELD_OY + e[1] + rnd(-0.5, 0.5),
          vx: rnd(-3.5, 3.5),
          vy: rnd(-11, -6.5),
          g: 6,
          maxLife: rnd(0.7, 1.4),
          fade: 0.35,
          color: Math.random() < 0.5 ? pal.warm.core : pal.warm.heart,
          s: rnd(0.6, 1.1),
        }),
      );
    }
    for (let i = 0; i < nSteam; i++) {
      const e = flameEmit();
      ps.push(
        makeParticle({
          kind: 'steam',
          x: FIELD_OX + e[0] + rnd(-0.6, 0.6),
          y: FIELD_OY + e[1] + rnd(-0.6, 0.6),
          vx: rnd(-0.7, 0.7),
          vy: rnd(-4.2, -2.6),
          g: -0.1,
          maxLife: rnd(1.3, 2.3),
          fade: 0.9,
          color: pal.steam,
          s: rnd(0.7, 1.3),
          steamDrift: true,
        }),
      );
    }
  };

  // Tap while frozen solid → glittering ice shards break off (5–12)
  const shards = (): void => {
    const pal = paletteRef.current;
    if (!pal) return;
    const n = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < n; i++) {
      const e = SHARD_EDGES[Math.floor(Math.random() * SHARD_EDGES.length)];
      const ang = rnd(-Math.PI * 0.92, -Math.PI * 0.08);
      const sp = rnd(7, 17);
      rtRef.current.particles.push(
        makeParticle({
          kind: 'shard',
          x: FIELD_OX + e[0] + rnd(-0.6, 0.6),
          y: FIELD_OY + e[1] + rnd(-0.6, 0.6),
          vx: Math.cos(ang) * sp + (e[0] - 7.5) * 0.8,
          vy: Math.sin(ang) * sp,
          g: 17,
          rot: rnd(0, 6.28),
          spin: rnd(-13, 13),
          maxLife: rnd(0.8, 1.6),
          fade: 0.45,
          color: i % 2 ? pal.cold.core : pal.cold.heart,
          s: rnd(0.8, 1.5),
        }),
      );
    }
  };

  // ── One frame ───────────────────────────────────────────────
  const draw = (ctx: CanvasRenderingContext2D, t: number, dt: number): void => {
    const pal = paletteRef.current;
    const cv = canvasRef.current;
    if (!pal || !cv) return;
    const rt = rtRef.current;
    const st = rt.st;
    const charge = st.charge;
    const phase = st.phase;
    const W = pal.warm;
    const C = pal.cold;

    // Glow follows the state warm → cold, constant (Hearth #1/#10). Only write on change.
    const filter = `drop-shadow(0 0 ${glowBlurAt(charge).toFixed(1)}px ${glowColorAt(charge, pal)})`;
    if (filter !== rt.lastFilter) {
      cv.style.filter = filter;
      rt.lastFilter = filter;
    }

    // One-time "settle" jolt when entering hold; reset flags (Hearth #7, #9)
    if (phase === 'hold') {
      if (!rt.holdJolted) {
        st.shiver = 0.5;
        rt.holdJolted = true;
      }
    } else rt.holdJolted = false;
    if (phase !== 'revert') rt.reignited = false;

    // ── Particles & effects by phase (Hearth, per-frame probabilities @ ~45fps) ──
    const ps = rt.particles;
    if (phase === 'idle') {
      if (Math.random() < 0.018) {
        const e = flameEmit();
        ps.push(
          makeParticle({
            kind: 'ember',
            x: FIELD_OX + e[0] + rnd(-0.5, 0.5),
            y: FIELD_OY + e[1] + rnd(-0.5, 0.5),
            vx: rnd(-1.2, 1.2),
            vy: rnd(-5, -3),
            g: 1.5,
            maxLife: rnd(0.5, 1.0),
            fade: 0.4,
            color: Math.random() < 0.5 ? W.core : W.heart,
            s: rnd(0.6, 1),
          }),
        );
      }
      // Crackle: every 3.5–7 s, 1–2 extra sparks
      if (t > rt.crackleNext) {
        rt.crackleNext = t + rnd(3.5, 7);
        const m = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < m; i++) {
          const e = flameEmit();
          ps.push(
            makeParticle({
              kind: 'ember',
              x: FIELD_OX + e[0],
              y: FIELD_OY + e[1],
              vx: rnd(-2.5, 2.5),
              vy: rnd(-8, -5),
              g: 5,
              maxLife: rnd(0.5, 1.1),
              fade: 0.35,
              color: Math.random() < 0.5 ? W.core : W.heart,
              s: rnd(0.7, 1.1),
            }),
          );
        }
      }
    }
    if (phase === 'transform') {
      if (Math.random() < charge * 0.45) {
        ps.push(
          makeParticle({
            kind: 'frost',
            x: rnd(FIELD_OX + 3, FIELD_OX + 12),
            y: rnd(FIELD_OY + 1, FIELD_OY + 6),
            vx: rnd(-1, 1),
            vy: rnd(1.5, 3.5),
            g: 5,
            maxLife: rnd(1.4, 2.4),
            fade: 0.5,
            color: Math.random() < 0.5 ? C.core : C.heart,
            s: rnd(0.6, 1),
          }),
        );
      }
      // Frost crack: a short white line across the surface
      if (Math.random() < 0.07) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const pts: [number, number][] = [];
        let x = rnd(4, 11);
        let y = rnd(3, 12);
        for (let k = 0; k < 4; k++) {
          pts.push([x, y]);
          x += dir * rnd(0.6, 1.4);
          y += rnd(-1, 1);
        }
        rt.cracks.push({ pts, life: 0.2, max: 0.2 });
      }
    }
    if (phase === 'revert') {
      if (Math.random() < 0.4) strike(charge, 0.32);
      // Melt drips from the crystal
      if (charge > 0.45 && Math.random() < 0.05) {
        const f = HEARTH_FACETS[Math.floor(Math.random() * HEARTH_FACETS.length)];
        ps.push(
          makeParticle({
            kind: 'drip',
            x: FIELD_OX + f[0],
            y: FIELD_OY + f[1],
            vx: rnd(-0.3, 0.3),
            vy: rnd(0.5, 1.5),
            g: 13,
            maxLife: rnd(2.2, 3.2),
            fade: 0.3,
            color: C.core,
            s: 0.9,
          }),
        );
      }
      // Re-ignite from below when warmth returns
      if (charge < 0.25 && !rt.reignited) {
        rt.reignited = true;
        for (let i = 0; i < 7; i++) {
          ps.push(
            makeParticle({
              kind: 'ember',
              x: FIELD_OX + 6 + Math.random() * 4,
              y: FIELD_OY + 13 + rnd(-1, 1),
              vx: rnd(-2.5, 2.5),
              vy: rnd(-9, -5),
              g: 6,
              maxLife: rnd(0.6, 1.2),
              fade: 0.35,
              color: Math.random() < 0.5 ? W.core : W.heart,
              s: rnd(0.7, 1.2),
            }),
          );
        }
      }
    }

    // ── Body (v13 idle motion + Hearth per-pixel freeze front) ──
    const flicker = Math.max(0, 1 - charge * 1.4);
    const sway = Math.sin(t * 1.4) * 0.4 * flicker;
    const breathY = 1 + Math.sin(t * 2.3) * 0.03 * flicker;
    const shiver = st.shiver ? Math.sin(t * 40) * st.shiver * 0.3 : 0;
    const px = (x: number): number => Math.round((FIELD_OX + x + sway + shiver) * CELL);
    const py = (y: number): number => Math.round((FIELD_OY + 16 + (y - 16) * breathY) * CELL);
    const ph = Math.ceil(CELL * breathY);
    const frozen = (warm: string, cold: string, x: number, y: number): string =>
      lerpColor(warm, cold, pixelFreeze(charge, x, y));

    const flickerFrame = Math.floor(t * CORE_FLICKER_FPS);
    const ringGlowPos = t * RING_GLOW_FPS;
    ctx.globalAlpha = 1;
    FLAME_BODY.forEach(([x, y, l], i) => {
      const warm =
        l === 2
          ? coreFlickerColor(W.core, W.heart, W.mid, smoothNoise(ringGlowPos, i), flicker)
          : layerOf(W, l);
      ctx.fillStyle = frozen(warm, layerOf(C, l), x, y);
      ctx.fillRect(px(x), py(y), CELL, ph);
    });

    // Tip flicker (v13) — 12fps discrete, plus the reach-up extension
    const tipFrame = Math.floor(t * 12) % 16;
    const tip: FlamePixel[] = [];
    if (charge < 0.88) {
      FLAME_TIP.forEach(([x, y, l], i) => {
        const seed = (tipFrame * 11 + i * 17) % 13;
        const threshold = y === 0 ? 0.4 : 0.6;
        if (seed / 13 < threshold + flicker * 0.4) tip.push([x, y, l]);
      });
      if (flicker > 0.4) {
        const ext = Math.floor(t * 4) % 5;
        if (ext === 0) tip.push([7, -1, 2]);
        if (ext === 1) tip.push([7, -1, 2], [8, -1, 1]);
        if (ext === 2) tip.push([8, -1, 2]);
      }
    } else {
      tip.push([7, 0, 2], [8, 0, 2], [7, 1, 1], [8, 1, 1]);
    }
    // Tongue lick (v13) — brief asymmetric bulge while warm
    const nowMs = t * 1000;
    if (charge < 0.55 && nowMs > rt.lickUntil && Math.random() < dt * 1.6) {
      rt.lickSide = Math.random() < 0.5 ? -1 : 1;
      rt.lickUntil = nowMs + 80 + Math.random() * 140;
    }
    if (nowMs < rt.lickUntil && charge < 0.55) {
      const baseX = rt.lickSide > 0 ? 11 : 4;
      tip.push([baseX, 5, 0], [baseX + rt.lickSide, 6, 0]);
    }
    for (const [x, y, l] of tip) {
      ctx.fillStyle = frozen(layerOf(W, l), layerOf(C, l), x, y);
      ctx.fillRect(px(x), py(y), CELL, ph);
    }

    // Heart (v13 pulse + V3 flicker, dim corner, lit neighbour)
    if (charge < 0.85) {
      const heartColor = lerpColor(W.heart, C.heart, charge);
      const heart = 0.7 + 0.3 * Math.sin(t * 4) * flicker;
      const jitter = 1 + (flickerNoise(flickerFrame, 997) - 0.5) * 0.3 * flicker;
      const base = Math.min(1, heart * jitter) * (1 - charge);
      const dim = Math.floor(flickerNoise(flickerFrame, 971) * HEART_PIXELS.length);
      ctx.fillStyle = heartColor;
      HEART_PIXELS.forEach(([x, y], i) => {
        ctx.globalAlpha = base * (i === dim ? 1 - HEART_CORNER_DIM : 1);
        ctx.fillRect(px(x), py(y), CELL, ph);
      });
      if (flicker > 0.4 && flickerNoise(flickerFrame, 991) > 0.78) {
        const [nx, ny] =
          HEART_NEIGHBOURS[Math.floor(flickerNoise(flickerFrame, 983) * HEART_NEIGHBOURS.length)];
        ctx.globalAlpha = 0.55 * heart * (1 - charge);
        ctx.fillRect(px(nx), py(ny), CELL, ph);
      }
      ctx.globalAlpha = 1;
    }

    // Rising embers (v13) — two small pixels drifting up while warm
    const e1 = (t * 0.7) % 1;
    const e2 = (t * 0.7 + 0.5) % 1;
    if (flicker > 0.25) {
      ctx.globalAlpha = (1 - e1) * flicker * 0.85;
      ctx.fillStyle = lerpColor(W.core, C.core, charge);
      ctx.fillRect(
        Math.round((FIELD_OX + 7 + Math.sin(t * 2) * 1.2 + sway) * CELL),
        Math.round((FIELD_OY + 4 - e1 * 5) * CELL),
        Math.round(CELL * 0.6),
        Math.round(CELL * 0.6),
      );
    }
    if (flicker > 0.4) {
      ctx.globalAlpha = (1 - e2) * flicker * 0.7;
      ctx.fillStyle = lerpColor(W.mid, pal.highlight, e2 * 0.4);
      ctx.fillRect(
        Math.round((FIELD_OX + 8 + Math.cos(t * 1.8) * 1.0 + sway) * CELL),
        Math.round((FIELD_OY + 3 - e2 * 6) * CELL),
        Math.round(CELL * 0.5),
        Math.round(CELL * 0.5),
      );
    }
    ctx.globalAlpha = 1;

    // Frost cracks (Hearth #4)
    if (rt.cracks.length) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = Math.max(1, CELL * 0.4);
      for (let i = rt.cracks.length - 1; i >= 0; i--) {
        const cl = rt.cracks[i];
        cl.life -= dt;
        if (cl.life <= 0) {
          rt.cracks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = cl.life / cl.max;
        ctx.beginPath();
        ctx.moveTo((FIELD_OX + cl.pts[0][0]) * CELL, (FIELD_OY + cl.pts[0][1]) * CELL);
        for (const [cx, cy] of cl.pts) ctx.lineTo((FIELD_OX + cx) * CELL, (FIELD_OY + cy) * CELL);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Ice crystal: stable facets + drifting glint, sparkle crosses when frozen (Hearth #6)
    if (charge > 0.5) {
      const hold = phase === 'hold';
      const sweepX = 3 + (Math.sin(t * 0.6) * 0.5 + 0.5) * 9;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = pal.highlight;
      for (const [x, y] of HEARTH_FACETS) {
        const tw = (Math.sin(t * 2.2 + x * 1.7 + y * 0.9) + 1) / 2;
        const near = 1 - Math.min(1, Math.abs(x - sweepX) / 3.5);
        let a =
          ((hold ? 0.55 : 0.3) * tw + (hold ? near * 0.6 : near * 0.3)) *
          Math.min(1, (charge - 0.5) / 0.4);
        if (a < 0.04) continue;
        if (a > 1) a = 1;
        ctx.globalAlpha = a;
        const X = px(x);
        const Y = py(y);
        ctx.fillRect(X, Y, CELL, CELL);
        if (hold && (tw > 0.75 || near > 0.7)) {
          ctx.globalAlpha = a * 0.7;
          ctx.fillRect(X - CELL, Y, CELL, CELL);
          ctx.fillRect(X + CELL, Y, CELL, CELL);
          ctx.fillRect(X, Y - CELL, CELL, CELL);
          ctx.fillRect(X, Y + CELL, CELL, CELL);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Particles (Hearth engine)
    updateParticles(ps, dt);
    for (const p of ps) {
      const a = particleAlpha(p);
      ctx.globalAlpha = a;
      const X = p.x * CELL;
      const Y = p.y * CELL;
      const S = CELL * p.s;
      ctx.fillStyle = p.color;
      switch (p.kind) {
        case 'ember':
          ctx.fillRect(Math.round(X), Math.round(Y), S, S);
          break;
        case 'frost':
          ctx.fillRect(Math.round(X), Math.round(Y), S, S);
          ctx.globalAlpha = a * 0.6;
          ctx.fillRect(Math.round(X - S), Math.round(Y), S, S);
          ctx.fillRect(Math.round(X + S), Math.round(Y), S, S);
          break;
        case 'steam': {
          // Thin, translucent vapour: a few pixel lobes of varying size
          const baseA = Math.max(0, Math.min(1, a * 0.3));
          const grow = 1 + (p.maxLife - p.life) * 0.18;
          const rise = (p.maxLife - p.life) * 0.5;
          const lobes: [number, number, number][] = [
            [0, 0, 0.9],
            [0.7, -0.5, 0.6],
            [-0.6, -0.2, 0.5],
          ];
          for (let k = 0; k < lobes.length; k++) {
            const lo = lobes[k];
            const sz = lo[2] * (0.8 + 0.5 * ((Math.sin(p.seed * 1.7 + k * 2.3) + 1) / 2));
            const w = Math.max(2, Math.round(S * sz * grow));
            const h = Math.max(
              2,
              Math.round(S * sz * grow * (0.7 + 0.3 * ((Math.sin(p.seed + k) + 1) / 2))),
            );
            const ox = Math.round((lo[0] + Math.sin(p.seed + k) * 0.25) * S);
            const oy = Math.round((lo[1] - rise) * S * 0.5);
            ctx.globalAlpha = baseA * (1 - k * 0.22);
            ctx.fillRect(Math.round(X) + ox, Math.round(Y) + oy, w, h);
          }
          break;
        }
        case 'shard': {
          ctx.save();
          ctx.translate(X + S / 2, Y + S / 2);
          ctx.rotate(p.rot);
          ctx.fillRect(-S / 2, -S * 0.4, S, S * 0.8);
          const tw = (Math.sin((p.maxLife - p.life) * 16 + p.x * 3) + 1) / 2;
          if (tw > 0.55) {
            ctx.fillStyle = pal.highlight;
            const g = Math.max(1, S * 0.18);
            ctx.fillRect(-g, -g, Math.max(2, S * 0.36), Math.max(2, S * 0.36));
          }
          ctx.restore();
          break;
        }
        case 'drip':
          ctx.fillRect(
            Math.round(X),
            Math.round(Y),
            CELL,
            Math.round(CELL * (1 + Math.min(2, p.vy * 0.05))),
          );
          break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // Latest draw() for the ticker (it reads refs only; the ref avoids re-subscribing).
  const drawRef = useRef(draw);
  drawRef.current = draw;

  // ── Ticker (~45fps cap, like the Hearth engine) ─────────────
  useEffect(() => {
    paletteRef.current = readPalette();
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    const frame = (t: number, dt: number): void => {
      stepFlameState(rtRef.current.st, t, dt);
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawRef.current(ctx, t, dt);
    };
    // First frame immediately (also without a rAF tick)
    frame(performance.now() / 1000, 0.022);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      raf = requestAnimationFrame(tick);
      const dms = now - last;
      if (dms < 22) return;
      last = now;
      frame(now / 1000, Math.min(0.05, dms / 1000));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Tap ─────────────────────────────────────────────────────
  const handlePointerDown = (e: PointerEvent): void => {
    if (!interactive) return;
    e.preventDefault();
    const st = rtRef.current.st;
    const result = tapFlameState(st, performance.now() / 1000);
    if (result === 'hold-tap') shards();
    else strike(st.charge, 1);
  };

  const unit = size / 16; // CSS px per cell
  return (
    <div class="sb-animated-flame" style={{ width: `${size}px`, height: `${size * (17 / 16)}px` }}>
      <canvas
        ref={canvasRef}
        class="sb-animated-flame-canvas"
        role="img"
        aria-label="Animated flame"
        width={FIELD_W * CELL}
        height={FIELD_H * CELL}
        onPointerDown={handlePointerDown}
        style={{
          width: `${FIELD_W * unit}px`,
          height: `${FIELD_H * unit}px`,
          left: `${-FIELD_OX * unit}px`,
          top: `${-FIELD_OY * unit}px`,
          cursor: interactive ? 'pointer' : 'default',
        }}
      />
    </div>
  );
}
