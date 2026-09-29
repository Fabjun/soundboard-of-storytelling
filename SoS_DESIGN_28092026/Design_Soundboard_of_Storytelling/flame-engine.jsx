// flame-engine.jsx — Canvas-Engine für die animierten Flammen.
// Gemeinsame Basis: Pixel-Body, ein zentraler Ticker, Partikel-System.
// Die vier Theme-Persönlichkeiten leben in flame-themes.jsx.

const { useRef: useFR, useEffect: useFE, useState: useFS } = React;

// ── Pixel-Flamme (16×17), drei Layer pro Pixel: 0=außen 1=mitte 2=kern ──
const FLAME_TIP = [[7,0,2],[8,0,2],[7,1,1],[8,1,1]];
const FLAME_BODY = [
  [6,2,0],[7,2,2],[8,2,2],[9,2,0],
  [6,3,0],[7,3,2],[8,3,2],[9,3,0],
  [5,4,0],[6,4,1],[7,4,2],[8,4,2],[9,4,1],[10,4,0],
  [5,5,0],[6,5,1],[7,5,2],[8,5,2],[9,5,1],[10,5,0],
  [4,6,0],[5,6,1],[6,6,2],[7,6,2],[8,6,2],[9,6,2],[10,6,1],[11,6,0],
  [4,7,0],[5,7,1],[6,7,2],[7,7,2],[8,7,2],[9,7,2],[10,7,1],[11,7,0],
  [3,8,0],[4,8,1],[5,8,2],[6,8,2],[7,8,2],[8,8,2],[9,8,2],[10,8,2],[11,8,1],[12,8,0],
  [3,9,0],[4,9,1],[5,9,2],[6,9,2],[7,9,2],[8,9,2],[9,9,2],[10,9,2],[11,9,1],[12,9,0],
  [3,10,0],[4,10,1],[5,10,2],[6,10,2],[7,10,2],[8,10,2],[9,10,2],[10,10,2],[11,10,1],[12,10,0],
  [4,11,0],[5,11,1],[6,11,2],[7,11,2],[8,11,2],[9,11,2],[10,11,1],[11,11,0],
  [4,12,0],[5,12,1],[6,12,2],[7,12,2],[8,12,2],[9,12,2],[10,12,1],[11,12,0],
  [5,13,0],[6,13,1],[7,13,2],[8,13,2],[9,13,1],[10,13,0],
  [5,14,0],[6,14,0],[7,14,1],[8,14,1],[9,14,0],[10,14,0],
  [6,15,0],[7,15,0],[8,15,0],[9,15,0],
];
const FLAME_PIX = FLAME_TIP.concat(FLAME_BODY);
// Tanz-Pixel über der Spitze (erscheinen bei hohem Flacker-Rauschen)
const TIP_DANCE = [[7,-1,2],[8,-1,2],[7,-2,2],[6,0,1],[9,0,1]];
// Randpixel je Zeile (für seitliches Züngeln)
const FLAME_EDGE = {};
(function () {
  const byRow = {};
  for (const [x, y] of FLAME_PIX) {
    if (!byRow[y]) byRow[y] = { min: x, max: x };
    else { byRow[y].min = Math.min(byRow[y].min, x); byRow[y].max = Math.max(byRow[y].max, x); }
  }
  for (const [x, y] of FLAME_PIX) {
    const r = byRow[y];
    if ((x === r.min || x === r.max) && r.max > r.min) FLAME_EDGE[x + ',' + y] = true;
  }
})();

// ── Feld-Geometrie ──────────────────────────────────────────────────
const FW = 32, FH = 40, OX = 8, OY = 12, UNIT = 10;
const TIPX = OX + 7.5, TIPY = OY + 0, BASEY = OY + 15;

// ── Farb-Helfer ─────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return `rgb(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))})`;
}
function rgba(hex, a) { const c = hexToRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function noise(i, t) { return (Math.sin(t * 7.1 + i * 1.3) + Math.sin(t * 3.3 + i * 2.7) + Math.sin(t * 11.7 + i * 0.7)) / 3; }
function rnd(a, b) { return a + Math.random() * (b - a); }

// ── Zentraler Ticker (~45fps Deckel) ────────────────────────────────
const _ft = { subs: new Set(), raf: 0, last: 0 };
function _floop(t) {
  _ft.raf = requestAnimationFrame(_floop);
  const dms = t - _ft.last; if (dms < 22) return;
  _ft.last = t;
  const sec = t / 1000, dt = Math.min(0.05, dms / 1000);
  _ft.subs.forEach((fn) => { try { fn(sec, dt); } catch (e) {} });
}
function useFlameTicker(cb) {
  const ref = useFR(cb); ref.current = cb;
  useFE(() => {
    const fn = (s, dt) => ref.current(s, dt);
    _ft.subs.add(fn);
    if (!_ft.raf) _ft.raf = requestAnimationFrame(_floop);
    return () => { _ft.subs.delete(fn); if (!_ft.subs.size) { cancelAnimationFrame(_ft.raf); _ft.raf = 0; } };
  }, []);
}

// ── Pixel-Body zeichnen ─────────────────────────────────────────────
// colorAt(x,y,layer) → Farbstring oder null (Pixel überspringen)
// yoffAt(x,y) → zusätzlicher Y-Versatz in Zellen (für Schmelze)
function drawFlameBody(ctx, t, {
  colorAt, yoffAt, swayAmp = 0.55, gust = 0, dx = 0, alpha = 1,
  composite = null, tipFlicker = true, scaleY = 1, jitterX = 0, freeze = 0,
}) {
  if (composite) ctx.globalCompositeOperation = composite;
  const liveSway = swayAmp * (1 - freeze);          // erstarrt mit freeze
  const liveTip = tipFlicker && freeze < 0.55;
  const drawPix = (x, y, layer, extraA) => {
    const up = (16 - y) / 16;
    const sx = Math.sin(t * 1.7 + (15 - y) * 0.22) * liveSway * up + gust * up
             + (jitterX ? (Math.random() - 0.5) * jitterX : 0);
    let a = alpha * (extraA == null ? 1 : extraA);
    if (liveTip && y <= 1) {
      const f = (noise(x * 3 + y, t) + 1) / 2;
      if (f < 0.32) return; a *= 0.55 + f * 0.45;
    }
    const col = colorAt(x, y, layer); if (!col) return;
    const yo = yoffAt ? yoffAt(x, y) : 0;
    const X = Math.round((OX + x + sx + dx) * UNIT);
    const Y = Math.round((OY + (y * scaleY) + yo) * UNIT);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = col;
    ctx.fillRect(X, Y, UNIT, UNIT);
  };
  for (const [x, y, l] of FLAME_PIX) drawPix(x, y, l);
  if (liveTip) {
    for (const [x, y, l] of TIP_DANCE) {
      const f = (noise(x * 5 + y * 2, t) + 1) / 2;
      if (f > 0.62) drawPix(x, y, l, (f - 0.62) * 2.6);
    }
  }
  ctx.globalAlpha = 1;
  if (composite) ctx.globalCompositeOperation = 'source-over';
}


// ── Partikel-System ─────────────────────────────────────────────────
function spawn(st, p) {
  p.life = p.life ?? p.maxLife ?? 1; p.maxLife = p.maxLife ?? p.life;
  p.vx = p.vx || 0; p.vy = p.vy || 0; p.g = p.g || 0; p.a = p.a ?? 1; p.s = p.s ?? 1;
  st.particles.push(p);
}
function updateParticles(st, dt) {
  const ps = st.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.life -= dt; if (p.life <= 0) { ps.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.spin != null) p.rot = (p.rot || 0) + p.spin * dt;
    if (p.onUpd) p.onUpd(p, dt);
  }
}
function drawParticles(ctx, st) {
  for (const p of st.particles) {
    const lifeT = p.life / p.maxLife;
    let a = p.a * Math.min(1, lifeT < 0.25 ? lifeT / 0.25 : (lifeT > 0.85 ? 1 : 1));
    if (lifeT > 0.8) a *= (1 - (lifeT - 0.8) / 0.2) * 0 + 1; // (kept simple)
    a = p.a * Math.min(1, p.life / (p.fade || 0.3));
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    const X = p.x * UNIT, Y = p.y * UNIT, S = UNIT * p.s;
    switch (p.kind) {
      case 'ember':
        ctx.fillStyle = p.color; ctx.fillRect(Math.round(X), Math.round(Y), S, S); break;
      case 'frost':
        ctx.fillStyle = p.color; ctx.fillRect(Math.round(X), Math.round(Y), S, S);
        ctx.globalAlpha *= 0.6; ctx.fillRect(Math.round(X - S), Math.round(Y), S, S); ctx.fillRect(Math.round(X + S), Math.round(Y), S, S); break;
      case 'spore': {
        ctx.globalCompositeOperation = 'lighter';
        const pulse = 0.6 + 0.4 * Math.sin((p.maxLife - p.life) * 6 + p.x);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, Math.min(1, a * pulse));
        ctx.fillRect(Math.round(X), Math.round(Y), S, S);
        ctx.fillStyle = p.core || '#fff'; ctx.globalAlpha = Math.max(0, Math.min(1, a * pulse * 0.8));
        ctx.fillRect(Math.round(X + S * 0.25), Math.round(Y + S * 0.25), Math.max(2, S * 0.5), Math.max(2, S * 0.5));
        ctx.globalCompositeOperation = 'source-over'; break;
      }
      case 'spark': {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.color; ctx.lineWidth = UNIT * (p.s * 0.5);
        ctx.beginPath(); ctx.moveTo(X, Y);
        ctx.lineTo(X - p.vx * 0.03 * UNIT, Y - p.vy * 0.03 * UNIT); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; break;
      }
      case 'drip':
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(X), Math.round(Y), UNIT, Math.round(UNIT * (1 + Math.min(2, p.vy * 0.05))));
        break;
      case 'steam': {
        const baseA = Math.max(0, Math.min(1, a * 0.3));    // durchscheinender (Dampf, kein Rauch)
        if (p.seed == null) p.seed = p.x * 13.7 + p.y * 7.3;
        const grow = 1 + (p.maxLife - p.life) * 0.18;       // quillt nur leicht auf
        const rise = (p.maxLife - p.life) * 0.5;            // franst nach oben aus
        ctx.fillStyle = p.color;
        // wenige pixelige Rechtecke unterschiedlicher Größe (dünner Dampf)
        const lobes = [[0, 0, 0.9], [0.7, -0.5, 0.6], [-0.6, -0.2, 0.5]];
        for (let k = 0; k < lobes.length; k++) {
          const lo = lobes[k];
          const sz = lo[2] * (0.8 + 0.5 * ((Math.sin(p.seed * 1.7 + k * 2.3) + 1) / 2));   // Varianz
          const w = Math.max(2, Math.round(S * sz * grow));
          const h = Math.max(2, Math.round(S * sz * grow * (0.7 + 0.3 * ((Math.sin(p.seed + k) + 1) / 2))));
          const ox = Math.round((lo[0] + Math.sin(p.seed + k) * 0.25) * S);
          const oy = Math.round((lo[1] - rise) * S * 0.5);
          ctx.globalAlpha = baseA * (1 - k * 0.22);
          ctx.fillRect(Math.round(X) + ox, Math.round(Y) + oy, w, h);
        }
        break;
      }
      case 'ash':
        ctx.fillStyle = p.color; ctx.fillRect(Math.round(X), Math.round(Y), Math.max(2, S * 0.6), Math.max(2, S * 0.6)); break;
      case 'shard': {
        ctx.save();
        ctx.translate(X + S / 2, Y + S / 2);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-S / 2, -S * 0.4, S, S * 0.8);          // länglicher Eis-Splitter
        const tw = (Math.sin((p.maxLife - p.life) * 16 + p.x * 3) + 1) / 2;
        if (tw > 0.55) {                                       // Glitzern
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-Math.max(1, S * 0.18), -Math.max(1, S * 0.18), Math.max(2, S * 0.36), Math.max(2, S * 0.36));
        }
        ctx.restore(); break;
      }
      default:
        ctx.fillStyle = p.color || '#fff'; ctx.fillRect(Math.round(X), Math.round(Y), S, S);
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

// ── Die Komponente ──────────────────────────────────────────────────
function ThemedFlame({ theme = 'hearth', size = 200, interactive = true, reduce = false }) {
  const canvasRef = useFR(null);
  const stateRef = useFR(null);
  const beh = (window.FLAME_THEMES || {})[theme];
  if (!stateRef.current) {
    stateRef.current = { charge: 0, prevCharge: 0, phase: 'idle', lastTap: -9, holdStart: 0,
      particles: [], pool: 0, t0: 0, sched: {}, bolts: [], flash: 0, surge: 0, blackUntil: 0, shiver: 0 };
    if (beh && beh.init) beh.init(stateRef.current);
  }
  useFlameTicker((t, dt) => {
    const cv = canvasRef.current; if (!cv || !beh) return;
    const ctx = cv.getContext('2d');
    const st = stateRef.current;
    st.prevCharge = st.charge;
    // ── 4-Phasen-Automat: idle → transform → hold → revert → idle ──
    const HOLD = beh.holdDur ?? 1.1, GRACE = 0.22;
    if (st.phase === 'transform') {
      if (st.charge >= 0.999) { st.phase = 'hold'; st.holdStart = t; }
      else if (t - st.lastTap > GRACE) st.phase = 'revert';
    } else if (st.phase === 'hold') {
      st.charge = 1;
      if (t - st.holdStart > HOLD) st.phase = 'revert';
    } else if (st.phase === 'revert') {
      st.charge = Math.max(0, st.charge - dt * (beh.thawRate ?? 0.45));
      if (st.charge <= 0.001) { st.charge = 0; st.phase = 'idle'; }
    }
    if (st.flash > 0) st.flash = Math.max(0, st.flash - dt * 3.2);
    if (st.surge > 0) st.surge = Math.max(0, st.surge - dt * 2.4);
    if (st.shiver > 0) st.shiver = Math.max(0, st.shiver - dt * 5);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    beh.draw(ctx, st, t, dt, { reduce, phase: st.phase });
  });
  // Ersten Frame sofort zeichnen (auch ohne rAF-Tick → Screenshot / reduced-motion)
  useFE(() => {
    const cv = canvasRef.current; if (!cv || !beh) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    try { beh.draw(ctx, stateRef.current, 0.4, 0.022, { reduce: true }); } catch (e) {}
  }, []);
  const tap = (e) => {
    if (!interactive || !beh) return;
    e.preventDefault();
    const st = stateRef.current;
    // Klick WÄHREND des Verharrens → Sondereffekt (z. B. Eissplitter), Hold auffrischen
    if (st.phase === 'hold') {
      if (beh.onHoldTap) beh.onHoldTap(st);
      st.holdStart = performance.now() / 1000;
      return;
    }
    st.charge = Math.min(1, st.charge + (beh.chargePerTap ?? 0.24));
    st.lastTap = performance.now() / 1000;
    if (st.charge >= 0.999) { st.phase = 'hold'; st.holdStart = st.lastTap; }
    else st.phase = 'transform';
    if (beh.onTap) beh.onTap(st);
  };
  return (
    <div className={'flame-wrap theme-' + theme}>
      <canvas ref={canvasRef} width={FW * UNIT} height={FH * UNIT}
        className="flame-canvas"
        style={{ width: size, height: size * FH / FW }}
        onPointerDown={tap} />
    </div>
  );
}

Object.assign(window, {
  FLAME_PIX, FLAME_TIP, FLAME_BODY, TIP_DANCE, FW, FH, OX, OY, UNIT, TIPX, TIPY, BASEY,
  lerp, lerpColor, hexToRgb, rgba, noise, rnd,
  useFlameTicker, drawFlameBody, spawn, updateParticles, drawParticles, ThemedFlame,
});
