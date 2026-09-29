// mb-meters.jsx — MODULARE PEGELANZEIGEN-BIBLIOTHEK
// ════════════════════════════════════════════════════════════════════
// Jede Pegelanzeige ist eine Komponente mit DERSELBEN Schnittstelle und
// füllt immer ihren Container (skaliert dynamisch in jeder Größe).
//
// Gemeinsame Props:
//   active : number          – Anzahl aktiver Pads (einfarbige Meter)
//   layers : [{type,active}] – aktive Pads pro Typ (Mehr-Ebenen-Meter)
//   pulse  : number          – zählt bei jedem "Feuern" → kurzer Ausschlag
//   master : number          – 0..100, skaliert den Pegel
//   color  : string          – Basisfarbe (einfarbige Meter)
//   bars   : number          – Auflösung
//   separate : bool          – getrennte Typ-Ebenen (sonst Mittelwert)
//   opts   : { smooth, peak, idle, tip, sat, anchor }  – Optik-Schalter
//
// OPTIK-OPTIONEN (im Grundgerüst, gelten für alle Designs):
//   1 smooth  – Bewegungs-Glättung (Attack/Decay)
//   2 peak    – Peak-Hold-Marker (hält Spitze, sinkt langsam)
//   3 idle    – leises Glimmen an der Basis bei Stille
//   4 tip     – heller Kanten-Highlight an der Balkenspitze
//   5 sat     – Sättigung gegen Ausbleichen beim additiven Mischen
//   6 anchor  – dezenter Verlauf an der Basis (verankert die Balken)
// ════════════════════════════════════════════════════════════════════

const { useRef: useMRef, useEffect: useMEffect, useState: useMState } = React;

const DEFAULT_OPTS = { smooth: true, peak: true, tip: true, sat: true, anchor: true, intensity: true };

// ── rAF-Helfer: EIN gemeinsamer Ticker (~30fps) für alle Meter ──────
// Statt pro Meter eine eigene rAF-Schleife: ein zentraler Ticker mit
// FPS-Deckel. Spart Overhead bei vielen gleichzeitigen Anzeigen.
const _tick = { subs: new Set(), raf: 0, last: 0 };
function _loop(t) {
  _tick.raf = requestAnimationFrame(_loop);
  if (t - _tick.last < 33) return;       // ~30fps Deckel
  _tick.last = t;
  const sec = t / 1000;
  _tick.subs.forEach((fn) => { try { fn(sec); } catch (e) { /* ignore */ } });
}
function useMeterRAF(cb) {
  const ref = useMRef(cb); ref.current = cb;
  useMEffect(() => {
    const fn = (sec) => ref.current(sec);
    _tick.subs.add(fn);
    if (!_tick.raf) _tick.raf = requestAnimationFrame(_loop);
    return () => { _tick.subs.delete(fn); if (_tick.subs.size === 0) { cancelAnimationFrame(_tick.raf); _tick.raf = 0; } };
  }, []);
}

// Feuer-Boost zeitbasiert (kein per-Frame-decay nötig → über mehrere
// Felder konsistent). Klingt in ~0.8s ab.
function boostNow(pulseAt) { return Math.max(0, Math.exp(-((performance.now() - pulseAt) / 1000) * 3.2)); }

// ── Einfarbiges Signal ──────────────────────────────────────────────
function useSignal({ active = 0, pulse = 0, master = 100 }) {
  const st = useMRef({ pulseAt: -999, active, master });
  st.current.active = active; st.current.master = master;
  useMEffect(() => { st.current.pulseAt = performance.now(); }, [pulse]);
  const api = useMRef(null);
  if (!api.current) {
    const ph = [], fr = [];
    api.current = {
      level(i, n, t) {
        if (ph[i] === undefined) { ph[i] = i * 0.7 + (i % 3); fr[i] = 2 + (i % 5) * 0.6; }
        const s = st.current; const gain = (s.master ?? 100) / 100;
        const src = s.active > 0 ? Math.min(1, 0.5 + s.active * 0.12) : 0.04;
        const osc = (Math.sin(t * fr[i] + ph[i]) + 1) / 2;
        const v = (src * (0.5 + osc * 0.5) + boostNow(s.pulseAt) * 0.5) * gain;
        return Math.max(0, Math.min(1.15, v));
      },
    };
  }
  return api.current;
}

// ════════════════════════════════════════════════════════════════════
// MEHR-EBENEN (pro Pad-TYP)
// ════════════════════════════════════════════════════════════════════
let _typeColorCache = null;
function typeColors() {
  if (_typeColorCache) return _typeColorCache;
  const probe = document.createElement('span');
  probe.style.position = 'absolute'; probe.style.opacity = '0'; document.body.appendChild(probe);
  _typeColorCache = {};
  ['single', 'loop', 'playlist', 'combo'].forEach((t) => {
    probe.style.color = `var(--pad-${t})`;
    const m = (getComputedStyle(probe).color.match(/\d+/g) || [200, 200, 200]).map(Number);
    _typeColorCache[t] = [m[0], m[1], m[2]];
  });
  probe.remove();
  _typeColorCache.mono = (function () {
    const p = document.createElement('span'); p.style.position = 'absolute'; p.style.opacity = '0'; p.style.color = 'var(--gold)';
    document.body.appendChild(p); const m = (getComputedStyle(p).color.match(/\d+/g) || [212, 178, 92]).map(Number); p.remove();
    return [m[0], m[1], m[2]];
  })();
  return _typeColorCache;
}
// Farbe pro "Typ" (mono = Markengold)
function colorVar(type) { return type === 'mono' ? 'var(--gold)' : `var(--pad-${type})`; }
function sumActive(layers) { return layers.reduce((a, l) => a + (l.active || 0), 0); }
// In Mono wird alles zu EINER kombinierten Quelle; in Multi pro Typ.
function effLayers(layers, mode) { return mode === 'mono' ? [{ type: 'mono', active: sumActive(layers) }] : layers; }
// gewichteter Mittelwert der Typ-Farben → 'rgb(...)'. sat=true erhöht
// die Sättigung, damit Mischungen nicht ins Graue/Weiße ausbleichen.
function mixColors(layers, weights, sat = false) {
  const tc = typeColors();
  let r = 0, g = 0, b = 0, sum = 0;
  layers.forEach((l, i) => {
    const w = weights[i] || 0; const c = tc[l.type] || [200, 200, 200];
    r += c[0] * w; g += c[1] * w; b += c[2] * w; sum += w;
  });
  if (sum <= 0.001) return 'rgba(120,120,140,.25)';
  r /= sum; g /= sum; b /= sum;
  if (sat) {
    const avg = (r + g + b) / 3, k = 1.45;
    r = Math.max(0, Math.min(255, avg + (r - avg) * k));
    g = Math.max(0, Math.min(255, avg + (g - avg) * k));
    b = Math.max(0, Math.min(255, avg + (b - avg) * k));
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function useSize(ref) {
  const [w, setW] = useMState(0);
  useMEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return w;
}

function useMultiSignal({ layers = [], pulse = 0, master = 100 }) {
  const st = useMRef({ pulseAt: -999 });
  st.current.layers = layers; st.current.master = master;
  useMEffect(() => { st.current.pulseAt = performance.now(); }, [pulse]);
  const api = useMRef(null);
  if (!api.current) {
    const ph = {}, fr = {};
    api.current = {
      level(li, i, n, t) {
        const key = li * 256 + i;
        if (ph[key] === undefined) { ph[key] = li * 1.3 + i * 0.7 + (i % 3); fr[key] = 2 + ((i + li) % 5) * 0.6; }
        const s = st.current; const layer = s.layers[li]; if (!layer) return 0;
        const act = layer.active || 0; if (act <= 0) return 0;
        const gain = (s.master ?? 100) / 100;
        const src = Math.min(1, 0.45 + act * 0.16);
        const osc = (Math.sin(t * fr[key] + ph[key]) + 1) / 2;
        const v = (src * (0.45 + osc * 0.55) + boostNow(s.pulseAt) * 0.5) * gain;
        return Math.max(0, Math.min(1.1, v));
      },
    };
  }
  return api.current;
}

// ════════════════════════════════════════════════════════════════════
// GETEILTER BALKEN-RENDERER — trägt alle 6 Optik-Optionen.
// sample(i, n, tSec) → { v: 0..1, color?: string }
// ════════════════════════════════════════════════════════════════════
function MeterBarField({ count, sample, color, opts = DEFAULT_OPTS, className = '', layerMode = false }) {
  const fillRefs = useMRef([]);
  const peakRefs = useMRef([]);
  const sm = useMRef({});   // geglättete Werte
  const pk = useMRef({});   // Peak-Werte
  useMeterRAF((t) => {
    for (let i = 0; i < count; i++) {
      const f = fillRefs.current[i]; if (!f) continue;
      const s = sample(i, count, t);
      let v = s.v;
      // 1 — Glättung (Attack schnell, Decay langsam)
      if (opts.smooth) {
        const prev = sm.current[i] ?? v;
        const rate = v > prev ? 0.5 : 0.14;
        v = prev + (v - prev) * rate;
      }
      sm.current[i] = v;
      const h = v;
      f.style.height = (Math.max(0.015, h) * 100) + '%';
      if (s.color) f.style.background = s.color;
      // Intensitäts-Gewichtung: Deckkraft pro Balken ∝ Pegel (nur Blend-Ebenen),
      // damit die lauteste Quelle die Mischfarbe dominiert statt Weiß.
      if (layerMode) f.style.opacity = opts.intensity ? (0.16 + 0.84 * Math.min(1, v)) : 0.6;
      // 2 — Peak-Hold
      const pkEl = peakRefs.current[i];
      if (pkEl) {
        if (opts.peak) {
          let p = pk.current[i] ?? 0;
          p = h > p ? h : Math.max(h, p - 0.011);
          pk.current[i] = p;
          pkEl.style.display = 'block';
          pkEl.style.bottom = `calc(${Math.min(100, p * 100)}% - 1.5px)`;
          if (s.color) pkEl.style.background = s.color;
          if (layerMode) pkEl.style.opacity = opts.intensity ? (0.3 + 0.7 * Math.min(1, p)) : 0.85;
        } else { pkEl.style.display = 'none'; }
      }
    }
  });
  const cls = ['mtr-bars'];
  if (opts.tip) cls.push('mtr-tip');
  if (opts.anchor) cls.push('mtr-anchor');
  if (className) cls.push(className);
  return (
    <div className={cls.join(' ')} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="mtr-col" key={i}>
          <i className="mtr-fill" ref={(el) => { fillRefs.current[i] = el; }} style={{ background: color }} />
          <u className="mtr-peak" ref={(el) => { peakRefs.current[i] = el; }} style={{ background: color }} />
        </div>
      ))}
    </div>
  );
}

// ── REFERENZ: Bars (einfarbig) ──────────────────────────────────────
function MeterBars({ active, pulse, master = 100, color = 'var(--gold)', bars = 14, opts = DEFAULT_OPTS }) {
  const sig = useSignal({ active, pulse, master });
  return <div className="mtr"><MeterBarField count={bars} color={color} opts={opts}
    sample={(i, n, t) => ({ v: sig.level(i, n, t) })} /></div>;
}

// ── Pegel · Mehr-Ebenen (Bars): getrennt / Mittelwert, Mono / Multi ──
function MeterBlend({ layers = [], mode = 'multi', pulse, master = 100, bars = 14, separate = true, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const wrap = useMRef(null);
  const w = useSize(wrap);
  const small = w > 0 && w < 110;
  const useAvg = small || !separate || eff.length === 0 || mode === 'mono';
  const effBars = small ? Math.max(4, Math.round(w / 11)) : bars;
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const cls = ['mtr', 'mtr-blend'];
  if (opts.sat && !useAvg) cls.push('mtr-sat');
  return (
    <div className={cls.join(' ')} ref={wrap} aria-hidden="true">
      {useAvg
        ? <MeterBarField count={effBars} opts={opts} color={mode === 'mono' ? colorVar('mono') : undefined}
            sample={(i, n, t) => {
              const Ls = eff.map((_, li) => sig.level(li, i, n, t));
              const energy = Math.min(1, Math.sqrt(Ls.reduce((a, v) => a + v * v, 0)));
              return mode === 'mono' ? { v: energy } : { v: energy, color: mixColors(eff, Ls, opts.sat) };
            }} />
        : eff.map((l, li) => (
            <MeterBarField key={l.type} count={bars} color={colorVar(l.type)} opts={opts}
              className="mtr-blend-layer" layerMode
              sample={(i, n, t) => ({ v: sig.level(li, i, n, t) })} />
          ))}
    </div>
  );
}

// ── Mix · Mittelwert (eigenständig, falls direkt gebraucht) ─────────
function MeterMixAvg({ layers = [], pulse, master = 100, bars = 14, opts = DEFAULT_OPTS }) {
  const sig = useMultiSignal({ layers, pulse, master });
  return <div className="mtr"><MeterBarField count={bars} opts={opts}
    sample={(i, n, t) => {
      const Ls = layers.map((_, li) => sig.level(li, i, n, t));
      const energy = Math.min(1, Math.sqrt(Ls.reduce((a, v) => a + v * v, 0)));
      return { v: energy, color: mixColors(layers, Ls, opts.sat) };
    }} /></div>;
}

// ── Glatte Spline (Catmull-Rom → Bézier) durch Punkte [[x,y],…] ─────
function spline(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

// ── Fluides Flächenfeld (SVG) — trägt dieselben Optik-Optionen ──────
function MeterFlowField({ n, sample, color, opts = DEFAULT_OPTS, className = '', layerMode = false }) {
  const areaRef = useMRef(null), topRef = useMRef(null), peakRef = useMRef(null);
  const sm = useMRef({}); const pk = useMRef({});
  useMeterRAF((t) => {
    const area = areaRef.current; if (!area) return;
    const vals = [], peaks = []; let sumv = 0; let col = null;
    for (let i = 0; i < n; i++) {
      const s = sample(i, n, t); let v = s.v; if (s.color) col = s.color;
      if (opts.smooth) { const prev = sm.current[i] ?? v; v = prev + (v - prev) * (v > prev ? 0.5 : 0.14); }
      sm.current[i] = v; sumv += v; vals.push(v);
      let p = pk.current[i] ?? 0; p = v > p ? v : Math.max(v, p - 0.011); pk.current[i] = p; peaks.push(p);
    }
    const X = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
    const Y = (v) => 100 - Math.max(0.01, Math.min(1, v)) * 100;
    const pts = vals.map((v, i) => [X(i), Y(v)]);
    const top = spline(pts);
    area.setAttribute('d', `M 0 100 L ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}` + top.replace(/^M[^C]*/, '') + ` L 100 100 Z`);
    if (col) area.style.fill = col;
    if (layerMode) area.style.opacity = opts.intensity ? (0.14 + 0.86 * Math.min(1, sumv / n * 2)) : 0.6;
    const topEl = topRef.current;
    if (topEl) { topEl.style.display = opts.tip ? '' : 'none'; if (opts.tip) topEl.setAttribute('d', top); }
    const pkEl = peakRef.current;
    if (pkEl) { pkEl.style.display = opts.peak ? '' : 'none'; if (opts.peak) pkEl.setAttribute('d', spline(peaks.map((v, i) => [X(i), Y(v)]))); }
  });
  const cls = ['mtr-flow-svg'];
  if (opts.anchor) cls.push('mtr-flow-anchor');
  if (className) cls.push(className);
  return (
    <svg className={cls.join(' ')} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path ref={areaRef} className="mtr-flow-area" style={{ fill: color }} />
      <path ref={peakRef} className="mtr-flow-peak" fill="none" style={{ stroke: color }} vectorEffect="non-scaling-stroke" />
      <path ref={topRef} className="mtr-flow-top" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── Flow: fluide Flächen (getrennt / Mittelwert, Mono / Multi) ──────
function MeterFlow({ layers = [], mode = 'multi', pulse, master = 100, bars = 24, separate = true, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const wrap = useMRef(null);
  const w = useSize(wrap);
  const small = w > 0 && w < 110;
  const useAvg = small || !separate || eff.length === 0 || mode === 'mono';
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const n = small ? Math.max(6, Math.round(w / 8)) : Math.max(12, bars);
  const cls = ['mtr', 'mtr-flow'];
  if (opts.sat && !useAvg) cls.push('mtr-sat');
  return (
    <div className={cls.join(' ')} ref={wrap} aria-hidden="true">
      {useAvg
        ? <MeterFlowField n={n} opts={opts} color={mode === 'mono' ? colorVar('mono') : undefined}
            sample={(i, nn, t) => {
              const Ls = eff.map((_, li) => sig.level(li, i, nn, t));
              const energy = Math.min(1, Math.sqrt(Ls.reduce((a, v) => a + v * v, 0)));
              return mode === 'mono' ? { v: energy } : { v: energy, color: mixColors(eff, Ls, opts.sat) };
            }} />
        : eff.map((l, li) => (
            <MeterFlowField key={l.type} n={n} color={colorVar(l.type)} opts={opts}
              className="mtr-blend-layer" layerMode
              sample={(i, nn, t) => ({ v: sig.level(li, i, nn, t) })} />
          ))}
    </div>
  );
}

// ── Registry (Formen werden in mb-meters-forms.jsx ergänzt) ─────────
const MB_METERS = [];

Object.assign(window, { useSignal, useMultiSignal, useMeterRAF, useSize, typeColors, mixColors, colorVar, sumActive, effLayers, spline, MeterBarField, MeterFlowField, MeterBlend, MeterFlow, MeterMixAvg, MB_METERS, DEFAULT_OPTS });
