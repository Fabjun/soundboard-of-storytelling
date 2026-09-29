// flame-themes.jsx — die vier Flammen-Persönlichkeiten. Lädt NACH flame-engine.jsx.
// Jede: { palette, chargePerTap, thawRate, init?, onTap?, draw }.
// draw(ctx, st, t, dt, cfg) komponiert alles (Body + Partikel + Specials).

// ── Paletten (outer/mid/core/heart) pro Theme + Geladen-Zustand ─────
const PAL = {
  hearth: {
    warm: ['#C46818', '#E8881E', '#F5C242', '#FFE8A0'],
    cold: ['#3F88B8', '#5BAFD8', '#9FD8EE', '#E8F8FF'],
  },
  verdant: { warm: ['#B8631F', '#D8893A', '#F2C24F', '#FFE8A0'], spore: '#A8E063', sporeCore: '#EAFFC4' },
  neon:    { warm: ['#B81E6B', '#FF3D8B', '#FF8FC0', '#FFD8EC'], elec: '#6EF0FF', elecCore: '#FFFFFF' },
  crimson: { warm: ['#7A1A1A', '#B5302E', '#E85C3A', '#FFC2A0'], blood: ['#2E0606', '#5A0E0E', '#8A1818'] },
};

function layerColor(arr, layer) { return arr[layer] || arr[1]; }

// precompute hearth "Gefrier-Schwelle" pro Pixel: NIEDRIG am Rand/oben
// (friert zuerst), HOCH im Kern unten-Mitte (zuletzt). Beim Auftauen
// kehrt sich das um → Wärme breitet sich von innen nach außen aus.
const HEARTH_THRESH = {};
(function () {
  for (const [x, y] of window.FLAME_PIX) {
    const edge = Math.abs(x - 7.5) / 4.5;        // 0 mitte … 1 rand
    // niedrig = friert zuerst. Rand & Spitze niedrig; Wurzel unten-mitte am höchsten.
    HEARTH_THRESH[x + ',' + y] = (1 - edge) * 0.5 + (y / 15) * 0.28;
  }
})();

// ════════════════════════════════════════════════════════════════════
// 🔥 HEARTH — gemütliches Feuer; Frost kriecht von außen herein,
//    Funken kippen zu fallendem Frost, Auftauen mit Dampf.
// ════════════════════════════════════════════════════════════════════
// statische Pixel-Textur (fix über die Zeit) — bricht die Monotonie und
// gibt Tiefe, OHNE zu animieren (also kein Blinken).
function hearthTexture(x, y) { return ((x * 7 + y * 13) % 11) / 11; }   // 0..1 fix
// kleine, desynchrone Mini-Flammen — enge driftende Lichtpunkte (kein Flächen-Blink).
function hearthAccent(x, y, t) {
  let m = 0;
  const cfg = [[0.37, 0.0], [0.53, 2.3], [0.29, 4.1]];
  for (let k = 0; k < 3; k++) {
    const sp = cfg[k][0], ph = cfg[k][1];
    const ax = 7.5 + Math.sin(t * sp * 1.3 + ph) * 2.2;
    const ay = 9 + Math.sin(t * sp + ph * 1.7) * 5;
    let d = Math.hypot((x - ax) * 0.85, (y - ay) * 0.55);
    let v = Math.max(0, 1 - d / 1.5);
    m = Math.max(m, v * v);                                 // enge, weiche Spitze
  }
  return m;
}
// stabile Facetten für den glänzenden Eiskristall (Verharren-Phase)
const HEARTH_FACETS = [[5,5],[10,5],[7,3],[4,9],[11,9],[6,8],[9,8],[7,11],[5,13],[10,13],[8,6]];
// top-gewichtete Emissions-Position über das GANZE Feuer (Spitze am
// häufigsten, nach unten abnehmend), mit Varianz.
function flameEmit() {
  const pix = window.FLAME_PIX;
  for (let tries = 0; tries < 8; tries++) {
    const e = pix[Math.floor(Math.random() * pix.length)];
    if (Math.random() < 1 - (e[1] / 17)) return [e[0], e[1]];
  }
  return [7, 3];
}
// Anschlag-Feedback: Funken ∝ Wärme (1−Ladung), Dampf ∝ Kälte (Ladung).
// burst skaliert die Menge (Klick = kräftig, Auftauen = sanft & kontinuierlich).
function hearthStrike(st, charge, burst) {
  const W = PAL.hearth.warm;
  const warmth = 1 - charge;
  const nSpark = Math.round(burst * (1 + warmth * 7));   // viel bei warm, fast 0 nahe Hold
  const nSteam = Math.round(burst * (0.7 + charge * 5)); // wenig bei warm, viel nahe Hold
  for (let i = 0; i < nSpark; i++) {
    const e = flameEmit();
    spawn(st, { kind: 'ember', x: OX + e[0] + rnd(-0.5, 0.5), y: OY + e[1] + rnd(-0.5, 0.5),
      vx: rnd(-3.5, 3.5), vy: rnd(-11, -6.5), g: 6, maxLife: rnd(0.7, 1.4), fade: 0.35,
      color: Math.random() < 0.5 ? W[2] : W[3], s: rnd(0.6, 1.1) });
  }
  for (let i = 0; i < nSteam; i++) {
    const e = flameEmit();
    spawn(st, { kind: 'steam', x: OX + e[0] + rnd(-0.6, 0.6), y: OY + e[1] + rnd(-0.6, 0.6),
      vx: rnd(-0.7, 0.7), vy: rnd(-4.2, -2.6), g: -0.1, maxLife: rnd(1.3, 2.3), fade: 0.9,
      color: '#e2eef4', s: rnd(0.7, 1.3),
      onUpd: (p, dt) => { p.s += dt * 0.4; p.vx += Math.sin((p.maxLife - p.life) * 1.6 + p.x) * dt * 0.8; } });
  }
}
const Hearth = {
  chargePerTap: 0.15, thawRate: 0.34, holdDur: 4.0,
  onTap(st) { st.shiver = 1; hearthStrike(st, st.charge, 1); },
  // Klick im Verharren-Zustand → glitzernde Eissplitter platzen ab (mit Varianz)
  onHoldTap(st) {
    st.shiver = 0.7;
    const C = PAL.hearth.cold;
    const edges = [[3,8],[4,6],[4,9],[5,5],[11,6],[12,8],[12,10],[11,9],[10,5],[5,13],[10,13],[7,2]];
    const n = 5 + Math.floor(Math.random() * 8);   // 5–12 Splitter
    for (let i = 0; i < n; i++) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      const ang = rnd(-Math.PI * 0.92, -Math.PI * 0.08);   // nach oben/außen
      const sp = rnd(7, 17);
      spawn(st, { kind: 'shard', x: OX + e[0] + rnd(-0.6, 0.6), y: OY + e[1] + rnd(-0.6, 0.6),
        vx: Math.cos(ang) * sp + (e[0] - 7.5) * 0.8, vy: Math.sin(ang) * sp, g: 17,
        rot: rnd(0, 6.28), spin: rnd(-13, 13), maxLife: rnd(0.8, 1.6), fade: 0.45,
        color: i % 2 ? C[2] : C[3], s: rnd(0.8, 1.5) });
    }
  },
  draw(ctx, st, t, dt, cfg) {
    const W = PAL.hearth.warm, C = PAL.hearth.cold;
    const charge = st.charge, phase = cfg.phase;
    if (!st.crackLines) st.crackLines = [];

    // #1 + #10 — Glow folgt dem Zustand (warm→kalt), KONSTANT (kein Puls/Blink)
    {
      const gr = Math.round(lerp(232, 120, charge)), gg = Math.round(lerp(130, 180, charge)), gb = Math.round(lerp(30, 224, charge));
      const blur = 12 + charge * 4;
      if (ctx.canvas) ctx.canvas.style.filter = `drop-shadow(0 0 ${blur.toFixed(1)}px rgba(${gr},${gg},${gb},0.5))`;
    }

    // #7 — einmaliges "Setzen" beim Eintritt ins Verharren; Reset-Flags
    if (phase === 'hold') { if (!st.holdJolted) { st.shiver = 0.5; st.holdJolted = true; } }
    else st.holdJolted = false;
    if (phase !== 'revert') st.reignited = false;

    // ── Partikel & Effekte nach Phase ──
    if (!cfg.reduce) {
      if (phase === 'idle') {
        if (Math.random() < 0.018) { const e = flameEmit(); spawn(st, { kind: 'ember', x: OX + e[0] + rnd(-0.5, 0.5), y: OY + e[1] + rnd(-0.5, 0.5), vx: rnd(-1.2, 1.2), vy: rnd(-5, -3), g: 1.5, maxLife: rnd(0.5, 1.0), fade: 0.4, color: Math.random() < 0.5 ? W[2] : W[3], s: rnd(0.6, 1) }); }
        // #2 — Knistern: selten 1–2 Extra-Funken
        if (t > (st.sched.crackNext || 0)) {
          st.sched.crackNext = t + rnd(3.5, 7);
          const m = 1 + Math.floor(Math.random() * 2);
          for (let i = 0; i < m; i++) { const e = flameEmit(); spawn(st, { kind: 'ember', x: OX + e[0], y: OY + e[1], vx: rnd(-2.5, 2.5), vy: rnd(-8, -5), g: 5, maxLife: rnd(0.5, 1.1), fade: 0.35, color: Math.random() < 0.5 ? W[2] : W[3], s: rnd(0.7, 1.1) }); }
        }
      }
      if (phase === 'transform') {
        if (Math.random() < charge * 0.45) spawn(st, { kind: 'frost', x: rnd(OX + 3, OX + 12), y: rnd(OY + 1, OY + 6), vx: rnd(-1, 1), vy: rnd(1.5, 3.5), g: 5, maxLife: rnd(1.4, 2.4), fade: 0.5, color: Math.random() < 0.5 ? C[2] : C[3], s: rnd(0.6, 1) });
        // #4 — Frost-Knacken: kurzer weißer Riss über die Oberfläche
        if (Math.random() < 0.07) {
          const cx = rnd(4, 11), cy = rnd(3, 12), dir = Math.random() < 0.5 ? 1 : -1;
          const pts = []; let x = cx, y = cy;
          for (let k = 0; k < 4; k++) { pts.push([x, y]); x += dir * rnd(0.6, 1.4); y += rnd(-1, 1); }
          st.crackLines.push({ pts, life: 0.2, max: 0.2 });
        }
      }
      if (phase === 'revert') {
        if (Math.random() < 0.4) hearthStrike(st, charge, 0.32);
        // #8 — Schmelz-Tropfen vom Kristall
        if (charge > 0.45 && Math.random() < 0.05) {
          const f = HEARTH_FACETS[Math.floor(Math.random() * HEARTH_FACETS.length)];
          spawn(st, { kind: 'drip', x: OX + f[0], y: OY + f[1], vx: rnd(-0.3, 0.3), vy: rnd(0.5, 1.5), g: 13, maxLife: rnd(2.2, 3.2), fade: 0.3, color: C[2], s: 0.9 });
        }
        // #9 — Wieder-Entzünden von unten, wenn Wärme zurückkehrt
        if (charge < 0.25 && !st.reignited) {
          st.reignited = true;
          for (let i = 0; i < 7; i++) { const ex = 6 + Math.random() * 4; spawn(st, { kind: 'ember', x: OX + ex, y: OY + 13 + rnd(-1, 1), vx: rnd(-2.5, 2.5), vy: rnd(-9, -5), g: 6, maxLife: rnd(0.6, 1.2), fade: 0.35, color: Math.random() < 0.5 ? W[2] : W[3], s: rnd(0.7, 1.2) }); }
        }
      }
    }

    const sh = st.shiver ? Math.sin(t * 40) * st.shiver * 0.3 : 0;

    drawFlameBody(ctx, t, {
      swayAmp: 0.5, dx: sh, freeze: charge,
      colorAt: (x, y, l) => {
        const globalCool = charge * 0.7;
        const thr = HEARTH_THRESH[x + ',' + y] ?? 0.4;
        const front = Math.max(0, Math.min(1, (charge - thr) * 2.4));
        const amt = Math.min(1, globalCool + front * 0.6);
        return lerpColor(layerColor(W, l), layerColor(C, l), amt);
      },
    });

    // (Reif-Saum #5 entfernt — Frost-Front-Umfärbung + fallender Frost + Knack-Linien
    //  erzählen den Übergang bereits; separate Reif-Punkte wirkten zu kontrastreich.)


    // #4 — Frost-Knack-Linien zeichnen
    if (st.crackLines.length) {
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, UNIT * 0.4);
      for (let i = st.crackLines.length - 1; i >= 0; i--) {
        const cl = st.crackLines[i]; cl.life -= dt; if (cl.life <= 0) { st.crackLines.splice(i, 1); continue; }
        ctx.globalAlpha = cl.life / cl.max;
        ctx.beginPath(); ctx.moveTo((OX + cl.pts[0][0]) * UNIT, (OY + cl.pts[0][1]) * UNIT);
        for (const [px, py] of cl.pts) ctx.lineTo((OX + px) * UNIT, (OY + py) * UNIT);
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    // ── Eiskristall: stabile Facetten + #6 driftendes Glitzern ──
    if (charge > 0.5) {
      const hold = phase === 'hold';
      const sweepX = 3 + (Math.sin(t * 0.6) * 0.5 + 0.5) * 9;     // wandernder Lichtreflex
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y] of HEARTH_FACETS) {
        const tw = (Math.sin(t * 2.2 + x * 1.7 + y * 0.9) + 1) / 2;
        const near = 1 - Math.min(1, Math.abs(x - sweepX) / 3.5);
        let a = ((hold ? 0.55 : 0.3) * tw + (hold ? near * 0.6 : near * 0.3)) * Math.min(1, (charge - 0.5) / 0.4);
        if (a < 0.04) continue;
        if (a > 1) a = 1;
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = a;
        const X = Math.round((OX + x) * UNIT), Y = Math.round((OY + y) * UNIT);
        ctx.fillRect(X, Y, UNIT, UNIT);
        if (hold && (tw > 0.75 || near > 0.7)) {                    // Funkel-Kreuz
          ctx.globalAlpha = a * 0.7;
          ctx.fillRect(X - UNIT, Y, UNIT, UNIT); ctx.fillRect(X + UNIT, Y, UNIT, UNIT);
          ctx.fillRect(X, Y - UNIT, UNIT, UNIT); ctx.fillRect(X, Y + UNIT, UNIT, UNIT);
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    updateParticles(st, dt); drawParticles(ctx, st);
  },
};

// ════════════════════════════════════════════════════════════════════
// 🌿 VERDANT — Sporen. Spitze löst sich in eine Sporenwolke auf,
//    sinkt zurück und keimt die Flamme neu. Idle: einzelne Sporen.
// ════════════════════════════════════════════════════════════════════
const Verdant = {
  chargePerTap: 0.24, thawRate: 0.32,
  spawnSpore(st, x, y, burst) {
    const S = PAL.verdant;
    spawn(st, { kind: 'spore', x, y, vx: rnd(-1.6, 1.6), vy: rnd(-3.2, -1.2) * (burst ? 1.4 : 1),
      g: rnd(0.4, 1.2), maxLife: rnd(1.2, 2.4), fade: 0.7, color: S.spore, core: S.sporeCore, s: rnd(0.7, 1.3),
      onUpd: (p, dt) => { if (p.life < p.maxLife * 0.45 && p.vy < 2.5) p.vy += 3 * dt; } }); // sinkt später zurück
  },
  onTap(st) { for (let i = 0; i < 14; i++) this.spawnSpore(st, TIPX + rnd(-2, 2), TIPY + rnd(0, 4), true); },
  draw(ctx, st, t, dt, cfg) {
    const W = PAL.verdant.warm;
    const charge = st.charge;
    const gust = Math.sin(t * 0.7) * 0.5 + Math.sin(t * 1.9) * 0.25;
    // idle Sporen
    if (!cfg.reduce && Math.random() < 0.05) this.spawnSpore(st, TIPX + rnd(-1.5, 1.5), TIPY + rnd(-1, 3), false);
    const dissThresh = charge * 11.5; // von oben her auflösen
    drawFlameBody(ctx, t, {
      swayAmp: 0.7, gust,
      colorAt: (x, y, l) => {
        if (y <= dissThresh) return null;          // aufgelöst → Sporen
        if (y <= dissThresh + 1.5) return lerpColor(layerColor(W, l), PAL.verdant.spore, 0.6); // Saum grün
        return layerColor(W, l);
      },
    });
    updateParticles(st, dt); drawParticles(ctx, st);
  },
};

// ════════════════════════════════════════════════════════════════════
// ⚡ NEON — Idle-Glitch (Scanlines, RGB-Split). Tap: Kurzschluss →
//    Blitz + Flash + Elektro-Funken → heller Surge zurück.
// ════════════════════════════════════════════════════════════════════
function makeBolt(fromX, fromY, dirX, dirY, len, seg) {
  const pts = [[fromX, fromY]]; let x = fromX, y = fromY;
  for (let i = 0; i < seg; i++) {
    x += dirX * (len / seg) + rnd(-1.2, 1.2);
    y += dirY * (len / seg) + rnd(-1.2, 1.2);
    pts.push([x, y]);
    if (Math.random() < 0.3) pts.push([x + rnd(-2, 2), y + rnd(-1, 1)]); // Verästelung
  }
  return pts;
}
const Neon = {
  chargePerTap: 0.22, thawRate: 0.5,
  onTap(st, t) {
    st.flash = 1; st.surge = 1; st.blackUntil = (performance.now() / 1000) + 0.05;
    st.bolts = [];
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) st.bolts.push({ pts: makeBolt(TIPX, TIPY + 2, rnd(-0.6, 0.6), -1, rnd(7, 12), 6), life: 0.22, max: 0.22 });
    st.bolts.push({ pts: makeBolt(OX + 6, OY + 7, -1, rnd(-0.4, 0.4), 8, 5), life: 0.18, max: 0.18 });
    st.bolts.push({ pts: makeBolt(OX + 9, OY + 7, 1, rnd(-0.4, 0.4), 8, 5), life: 0.18, max: 0.18 });
    const E = PAL.neon;
    for (let i = 0; i < 16; i++) {
      const ang = rnd(-Math.PI, 0), sp = rnd(10, 22);
      spawn(st, { kind: 'spark', x: TIPX + rnd(-2, 2), y: OY + rnd(2, 8),
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 8, maxLife: rnd(0.18, 0.4), fade: 0.18,
        color: Math.random() < 0.5 ? E.elec : E.elecCore, s: rnd(0.8, 1.4) });
    }
  },
  draw(ctx, st, t, dt, cfg) {
    const W = PAL.neon.warm, E = PAL.neon;
    const glitching = !cfg.reduce && (st.sched.glUntil || 0) > t;
    if (!cfg.reduce && t > (st.sched.glNext || 0)) {       // Idle-Glitch planen
      st.sched.glNext = t + rnd(0.6, 2.2); st.sched.glUntil = t + rnd(0.06, 0.16);
      st.sched.glOff = rnd(-1.2, 1.2);
    }
    const black = (performance.now() / 1000) < st.blackUntil;
    const surgeA = 1 + st.surge * 0.7;
    const buzz = 0.85 + 0.15 * Math.sin(t * 30);
    if (!black) {
      const baseOpts = {
        swayAmp: 0.45 + st.surge * 0.4, scaleY: 1 - st.surge * 0.06,
        alpha: Math.min(1, buzz * surgeA),
        colorAt: (x, y, l) => st.surge > 0.4 ? lerpColor(layerColor(W, l), '#ffffff', st.surge * 0.4) : layerColor(W, l),
      };
      drawFlameBody(ctx, t, baseOpts);
      if (glitching) {                                     // RGB-Split-Pässe
        drawFlameBody(ctx, t, { ...baseOpts, dx: -0.7 + st.sched.glOff, alpha: 0.5, composite: 'lighter', colorAt: () => '#ff2d80' });
        drawFlameBody(ctx, t, { ...baseOpts, dx: 0.7 + st.sched.glOff, alpha: 0.5, composite: 'lighter', colorAt: () => E.elec });
      }
    }
    // Scanlines (immer dezent, beim Glitch stärker)
    ctx.globalAlpha = glitching ? 0.22 : 0.08; ctx.fillStyle = '#000';
    for (let y = 0; y < FH; y += 2) ctx.fillRect(0, y * UNIT, FW * UNIT, UNIT);
    ctx.globalAlpha = 1;
    // Blitze
    if (st.bolts && st.bolts.length) {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      for (let i = st.bolts.length - 1; i >= 0; i--) {
        const b = st.bolts[i]; b.life -= dt; if (b.life <= 0) { st.bolts.splice(i, 1); continue; }
        const a = b.life / b.max;
        ctx.globalAlpha = a; ctx.strokeStyle = E.elec; ctx.lineWidth = UNIT * 1.4;
        ctx.beginPath(); ctx.moveTo(b.pts[0][0] * UNIT, b.pts[0][1] * UNIT);
        for (const [px, py] of b.pts) ctx.lineTo(px * UNIT, py * UNIT); ctx.stroke();
        ctx.globalAlpha = a; ctx.strokeStyle = E.elecCore; ctx.lineWidth = UNIT * 0.5;
        ctx.beginPath(); ctx.moveTo(b.pts[0][0] * UNIT, b.pts[0][1] * UNIT);
        for (const [px, py] of b.pts) ctx.lineTo(px * UNIT, py * UNIT); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    updateParticles(st, dt); drawParticles(ctx, st);
    // Flash
    if (st.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(TIPX * UNIT, (OY + 7) * UNIT, 0, TIPX * UNIT, (OY + 7) * UNIT, 18 * UNIT);
      g.addColorStop(0, rgba(E.elec, 0.5 * st.flash)); g.addColorStop(1, rgba(E.elec, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, FW * UNIT, FH * UNIT);
      ctx.globalCompositeOperation = 'source-over';
    }
  },
};

// ════════════════════════════════════════════════════════════════════
// 🩸 CRIMSON — Blut. Tap: gerinnen → von oben zerlaufen, Tropfen +
//    wachsende Lache → lodert aus der Lache neu hoch. Idle: zäh, Herzschlag.
// ════════════════════════════════════════════════════════════════════
const Crimson = {
  chargePerTap: 0.28, thawRate: 0.26,
  onTap(st) {
    st.pool = Math.min(1, st.pool + 0.28);
    const B = PAL.crimson.blood;
    for (let i = 0; i < 7; i++) spawn(st, { kind: 'drip', x: rnd(OX + 5, OX + 10), y: rnd(OY + 2, OY + 9),
      vx: rnd(-0.4, 0.4), vy: rnd(1, 3), g: 14, maxLife: rnd(0.8, 1.6), fade: 0.5, color: i % 2 ? B[2] : B[1], s: 1,
      onUpd: (p) => { if (p.y > BASEY + 2) { st.pool = Math.min(1, st.pool + 0.012); p.life = 0; } } });
  },
  draw(ctx, st, t, dt, cfg) {
    const W = PAL.crimson.warm, B = PAL.crimson.blood;
    const charge = st.charge;
    st.pool = Math.max(0, st.pool - dt * 0.12);   // versickert
    // idle: zähe Blutperle an der Spitze
    if (!cfg.reduce && Math.random() < 0.018) {
      spawn(st, { kind: 'drip', x: TIPX + rnd(-1, 1), y: TIPY + rnd(0, 2), vx: 0, vy: rnd(0.5, 1.2), g: 10,
        maxLife: rnd(1, 1.8), fade: 0.5, color: B[2], s: 1,
        onUpd: (p) => { if (p.y > BASEY + 2) { st.pool = Math.min(1, st.pool + 0.01); p.life = 0; } } });
    }
    // Lache (hinter der Flamme)
    if (st.pool > 0.01) {
      const rx = (3 + st.pool * 9) * UNIT, ry = (1 + st.pool * 2) * UNIT;
      ctx.globalAlpha = Math.min(0.9, 0.4 + st.pool * 0.5); ctx.fillStyle = B[1];
      ctx.beginPath(); ctx.ellipse(TIPX * UNIT, (BASEY + 2) * UNIT, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = Math.min(1, 0.5 + st.pool * 0.5); ctx.fillStyle = B[2];
      ctx.beginPath(); ctx.ellipse(TIPX * UNIT, (BASEY + 1.6) * UNIT, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const beat = 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(t * 2.2)), 6); // Herzschlag
    drawFlameBody(ctx, t, {
      swayAmp: 0.35 + 0.12 * beat,
      yoffAt: (x, y) => charge * (0.5 + (15 - y) / 15 * 4),   // schmilzt: oben sackt mehr
      colorAt: (x, y, l) => {
        const base = lerpColor(layerColor(W, l), layerColor(B, l), charge);
        return base;
      },
    });
    updateParticles(st, dt); drawParticles(ctx, st);
  },
};

// onTap braucht bei Neon den Zeitstempel — wrappen
const NeonWrapped = { ...Neon, onTap(st) { Neon.onTap(st); } };

window.FLAME_THEMES = {
  hearth: Hearth,
  verdant: Object.assign(Verdant, { spawnSpore: Verdant.spawnSpore.bind(Verdant) }),
  neon: NeonWrapped,
  crimson: Crimson,
};
window.FLAME_PALETTES = PAL;
