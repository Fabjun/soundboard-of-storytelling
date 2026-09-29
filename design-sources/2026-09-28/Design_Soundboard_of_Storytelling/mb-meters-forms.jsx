// mb-meters-forms.jsx — weitere Pegelformen. Lädt NACH mb-meters.jsx.
// Alle nutzen die Kern-Helfer (useMultiSignal, mixColors, colorVar,
// effLayers, spline, useSize …) und unterstützen Mono/Multi + Optik-Opts.

const { useRef: useFRef } = React;

// gemeinsamer Helfer: kombinierte Energie über alle Layer bei Sample i
function energyAt(sig, eff, i, n, t) {
  let s = 0; for (let li = 0; li < eff.length; li++) { const v = sig.level(li, i, n, t); s += v * v; }
  return Math.min(1, Math.sqrt(s));
}
function colorAt(sig, eff, i, n, t, sat) {
  const Ls = eff.map((_, li) => sig.level(li, i, n, t));
  return mixColors(eff, Ls, sat);
}

// ════════════════════════════════════════════════════════════════════
// MIRROR — fluide Fläche, symmetrisch um die Mittellinie (VU-Stil)
// ════════════════════════════════════════════════════════════════════
function MirrorField({ n, sample, color, opts, layerMode, className = '' }) {
  const areaRef = useFRef(null); const sm = useFRef({});
  useMeterRAF((t) => {
    const a = areaRef.current; if (!a) return;
    const vals = []; let sum = 0; let col = null;
    for (let i = 0; i < n; i++) {
      const s = sample(i, n, t); let v = s.v; if (s.color) col = s.color;
      if (opts.smooth) { const p = sm.current[i] ?? v; v = p + (v - p) * (v > p ? 0.5 : 0.14); }
      sm.current[i] = v; sum += v; vals.push(v);
    }
    const X = (i) => (n === 1 ? 50 : i / (n - 1) * 100);
    const top = vals.map((v, i) => [X(i), 50 - Math.min(1, v) * 47]);
    const bot = vals.map((v, i) => [X(i), 50 + Math.min(1, v) * 47]).reverse();
    const dTop = spline(top), dBot = spline(bot);
    a.setAttribute('d', dTop + ' L ' + bot[0][0].toFixed(2) + ' ' + bot[0][1].toFixed(2) + dBot.replace(/^M[^C]*/, '') + ' Z');
    if (col) a.style.fill = col;
    if (layerMode) a.style.opacity = opts.intensity ? (0.14 + 0.86 * Math.min(1, sum / n * 2)) : 0.6;
  });
  return (
    <svg className={`mtr-flow-svg ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path ref={areaRef} className="mtr-flow-area" style={{ fill: color }} />
    </svg>
  );
}
function MeterMirror({ layers = [], mode = 'multi', pulse, master = 100, bars = 24, separate = true, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const wrap = useFRef(null); const w = useSize(wrap);
  const small = w > 0 && w < 110;
  const useAvg = small || !separate || eff.length === 0 || mode === 'mono';
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const n = small ? Math.max(6, Math.round(w / 8)) : Math.max(12, bars);
  const cls = ['mtr', 'mtr-flow']; if (opts.sat && !useAvg) cls.push('mtr-sat');
  return (
    <div className={cls.join(' ')} ref={wrap} aria-hidden="true">
      {useAvg
        ? <MirrorField n={n} opts={opts} color={mode === 'mono' ? colorVar('mono') : undefined}
            sample={(i, nn, t) => (mode === 'mono' ? { v: energyAt(sig, eff, i, nn, t) } : { v: energyAt(sig, eff, i, nn, t), color: colorAt(sig, eff, i, nn, t, opts.sat) })} />
        : eff.map((l, li) => <MirrorField key={l.type} n={n} color={colorVar(l.type)} opts={opts} layerMode className="mtr-blend-layer"
            sample={(i, nn, t) => ({ v: sig.level(li, i, nn, t) })} />)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RING — konzentrische Bögen, ein Ring pro Typ; Füllung ∝ Pegel
// ════════════════════════════════════════════════════════════════════
function MeterRing({ layers = [], mode = 'multi', pulse, master = 100, separate = true, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const ringRefs = useFRef([]);
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const sm = useFRef({}); const pk = useFRef({});
  const L = Math.max(1, eff.length);
  useMeterRAF((t) => {
    for (let li = 0; li < eff.length; li++) {
      const el = ringRefs.current[li]; if (!el) continue;
      let v = 0; for (let i = 0; i < 6; i++) v = Math.max(v, sig.level(li, i, 6, t));
      if (opts.smooth) { const p = sm.current[li] ?? v; v = p + (v - p) * (v > p ? 0.5 : 0.12); }
      sm.current[li] = v;
      const r = parseFloat(el.getAttribute('r')); const circ = 2 * Math.PI * r;
      el.style.strokeDasharray = circ;
      el.style.strokeDashoffset = circ * (1 - Math.min(1, v));
    }
  });
  const cls = ['mtr', 'mtr-ring']; if (opts.sat && mode !== 'mono') cls.push('mtr-sat');
  return (
    <div className={cls.join(' ')} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {eff.map((l, li) => {
          const r = 44 - li * (32 / L) - 4;
          return (
            <g key={l.type}>
              <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={Math.max(2, 26 / L)} />
              <circle ref={(e) => { ringRefs.current[li] = e; }} cx="50" cy="50" r={r} fill="none"
                stroke={colorVar(l.type)} strokeWidth={Math.max(2, 26 / L)} strokeLinecap="round"
                transform="rotate(-90 50 50)" style={{ filter: opts.tip ? 'drop-shadow(0 0 1.5px currentColor)' : 'none' }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RADIAL — Strahlen aus dem Zentrum, Länge ∝ Pegel, Farbe gemischt
// ════════════════════════════════════════════════════════════════════
function MeterRadial({ layers = [], mode = 'multi', pulse, master = 100, bars = 28, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const rayRefs = useFRef([]);
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const sm = useFRef({});
  const n = Math.max(10, bars);
  useMeterRAF((t) => {
    for (let i = 0; i < n; i++) {
      const el = rayRefs.current[i]; if (!el) continue;
      let v = energyAt(sig, eff, i, n, t);
      if (opts.smooth) { const p = sm.current[i] ?? v; v = p + (v - p) * (v > p ? 0.5 : 0.14); }
      sm.current[i] = v;
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r0 = 12, r1 = 12 + Math.min(1, v) * 36;
      el.setAttribute('x1', (50 + Math.cos(ang) * r0).toFixed(2));
      el.setAttribute('y1', (50 + Math.sin(ang) * r0).toFixed(2));
      el.setAttribute('x2', (50 + Math.cos(ang) * r1).toFixed(2));
      el.setAttribute('y2', (50 + Math.sin(ang) * r1).toFixed(2));
      el.style.stroke = mode === 'mono' ? 'var(--gold)' : colorAt(sig, eff, i, n, t, opts.sat);
    }
  });
  return (
    <div className="mtr mtr-radial" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: n }).map((_, i) => (
          <line key={i} ref={(e) => { rayRefs.current[i] = e; }} strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LED — Punkt-Matrix, füllt von unten (klassischer Hardware-Pegel)
// ════════════════════════════════════════════════════════════════════
const LED_ROWS = 9;
function MeterLED({ layers = [], mode = 'multi', pulse, master = 100, bars = 16, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const cellRefs = useFRef([]);
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const sm = useFRef({}); const pk = useFRef({});
  const cols = Math.max(4, bars);
  useMeterRAF((t) => {
    for (let c = 0; c < cols; c++) {
      let v = energyAt(sig, eff, c, cols, t);
      if (opts.smooth) { const p = sm.current[c] ?? v; v = p + (v - p) * (v > p ? 0.55 : 0.16); }
      sm.current[c] = v;
      let peak = pk.current[c] ?? 0; peak = v > peak ? v : Math.max(v, peak - 0.012); pk.current[c] = peak;
      const lit = Math.round(v * LED_ROWS);
      const peakRow = Math.round(peak * LED_ROWS);
      const col = mode === 'mono' ? 'var(--gold)' : colorAt(sig, eff, c, cols, t, opts.sat);
      for (let r = 0; r < LED_ROWS; r++) {
        const cell = cellRefs.current[c * LED_ROWS + r]; if (!cell) continue;
        const fromBottom = r + 1; // Spalte ist column-reverse → r=0 sitzt unten
        const on = fromBottom <= lit;
        const isPeak = opts.peak && fromBottom === peakRow && peakRow > 0;
        cell.style.background = (on || isPeak) ? col : 'rgba(255,255,255,.06)';
        cell.style.opacity = on ? (opts.intensity ? (0.5 + 0.5 * (fromBottom / LED_ROWS)) : 1) : (isPeak ? 1 : 1);
      }
    }
  });
  return (
    <div className="mtr mtr-led" aria-hidden="true">
      {Array.from({ length: cols }).map((_, c) => (
        <div className="mtr-led-col" key={c}>
          {Array.from({ length: LED_ROWS }).map((_, r) => (
            <i key={r} ref={(e) => { cellRefs.current[c * LED_ROWS + r] = e; }} className="mtr-led-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PARTICLE — Punktwolke, Helligkeit/Größe ∝ Pegel + Funkeln
// ════════════════════════════════════════════════════════════════════
function MeterParticle({ layers = [], mode = 'multi', pulse, master = 100, bars = 18, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const rows = 7;
  const cellRefs = useFRef([]);
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const cols = Math.max(5, bars);
  useMeterRAF((t) => {
    for (let c = 0; c < cols; c++) {
      const v = energyAt(sig, eff, c, cols, t);
      const col = mode === 'mono' ? 'var(--gold)' : colorAt(sig, eff, c, cols, t, opts.sat);
      for (let r = 0; r < rows; r++) {
        const cell = cellRefs.current[c * rows + r]; if (!cell) continue;
        const fromBottom = (r + 1) / rows;
        const noise = (Math.sin(t * 3 + c * 1.7 + r * 2.3) + 1) / 2;
        let a = Math.max(0, v - fromBottom + 0.3) * (0.6 + 0.4 * noise);
        a = Math.min(1, a * 2.4);
        cell.style.background = col;
        cell.style.opacity = a < 0.04 ? '0' : Math.max(0.35, a).toFixed(3);
        cell.style.transform = `scale(${(0.5 + a * 0.7).toFixed(2)})`;
        cell.style.boxShadow = a > 0.5 ? `0 0 4px ${col}` : 'none';
      }
    }
  });
  return (
    <div className="mtr mtr-particle" aria-hidden="true">
      {Array.from({ length: cols }).map((_, c) => (
        <div className="mtr-led-col" key={c}>
          {Array.from({ length: rows }).map((_, r) => (
            <i key={r} ref={(e) => { cellRefs.current[c * rows + r] = e; }} className="mtr-particle-dot" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// WAVE — Oszilloskop-Linie, Amplitude ∝ Pegel (nicht gefüllt)
// ════════════════════════════════════════════════════════════════════
function WaveLine({ n, sample, color, opts, className = '' }) {
  const ref = useFRef(null); const sm = useFRef({});
  useMeterRAF((t) => {
    const el = ref.current; if (!el) return;
    const pts = []; let col = null;
    for (let i = 0; i < n; i++) {
      const s = sample(i, n, t); let amp = s.v; if (s.color) col = s.color;
      if (opts.smooth) { const p = sm.current[i] ?? amp; amp = p + (amp - p) * (amp > p ? 0.5 : 0.14); }
      sm.current[i] = amp;
      const wave = Math.sin(i * 0.6 + t * 6) * Math.sin(i * 0.21 + t * 2);
      pts.push([(n === 1 ? 50 : i / (n - 1) * 100), 50 - wave * amp * 44]);
    }
    el.setAttribute('d', spline(pts));
    if (col) el.style.stroke = col;
  });
  return (
    <svg className={`mtr-flow-svg ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path ref={ref} fill="none" style={{ stroke: color }} strokeWidth={opts.tip ? 2 : 1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MeterWave({ layers = [], mode = 'multi', pulse, master = 100, bars = 40, separate = true, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const useAvg = !separate || eff.length === 0 || mode === 'mono';
  const n = Math.max(20, bars);
  const cls = ['mtr', 'mtr-wave']; if (opts.sat && !useAvg) cls.push('mtr-sat');
  return (
    <div className={cls.join(' ')} aria-hidden="true">
      {useAvg
        ? <WaveLine n={n} opts={opts} color={mode === 'mono' ? colorVar('mono') : undefined}
            sample={(i, nn, t) => (mode === 'mono' ? { v: energyAt(sig, eff, i, nn, t) } : { v: energyAt(sig, eff, i, nn, t), color: colorAt(sig, eff, i, nn, t, opts.sat) })} />
        : eff.map((l, li) => <WaveLine key={l.type} n={n} color={colorVar(l.type)} opts={opts} className="mtr-blend-layer"
            sample={(i, nn, t) => ({ v: sig.level(li, i, nn, t) })} />)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// STACKED — Typ-Flächen gestapelt (Summe; zeigt Beiträge klar)
// ════════════════════════════════════════════════════════════════════
function MeterStacked({ layers = [], mode = 'multi', pulse, master = 100, bars = 24, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const pathRefs = useFRef([]);
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const sm = useFRef({});
  const n = Math.max(12, bars);
  useMeterRAF((t) => {
    // kumulierte Basislinien je Sample
    const base = new Array(n).fill(0);
    for (let li = 0; li < eff.length; li++) {
      const el = pathRefs.current[li]; if (!el) continue;
      const topPts = [], botPts = [];
      for (let i = 0; i < n; i++) {
        let v = sig.level(li, i, n, t);
        const key = li * 256 + i;
        if (opts.smooth) { const p = sm.current[key] ?? v; v = p + (v - p) * (v > p ? 0.5 : 0.14); }
        sm.current[key] = v;
        const x = n === 1 ? 50 : i / (n - 1) * 100;
        const b = base[i]; const tp = Math.min(1, b + v * 0.5);
        botPts.push([x, 100 - b * 100]); topPts.push([x, 100 - tp * 100]);
        base[i] = tp;
      }
      const dTop = spline(topPts); const dBot = spline(botPts.slice().reverse());
      el.setAttribute('d', dTop + ' L ' + botPts[n - 1][0].toFixed(2) + ' ' + botPts[n - 1][1].toFixed(2) + dBot.replace(/^M[^C]*/, '') + ' Z');
      el.style.fill = colorVar(eff[li].type);
      el.style.opacity = opts.intensity ? 0.85 : 0.8;
    }
  });
  return (
    <div className="mtr mtr-stacked" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {eff.map((l, li) => <path key={l.type} ref={(e) => { pathRefs.current[li] = e; }} />)}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HEAT — kompakter Streifen, Zelle = Mischfarbe, Helligkeit ∝ Pegel
// ════════════════════════════════════════════════════════════════════
function MeterHeat({ layers = [], mode = 'multi', pulse, master = 100, bars = 28, opts = DEFAULT_OPTS }) {
  const eff = effLayers(layers, mode);
  const cellRefs = useFRef([]);
  const sig = useMultiSignal({ layers: eff, pulse, master });
  const sm = useFRef({});
  const cols = Math.max(6, bars);
  useMeterRAF((t) => {
    for (let c = 0; c < cols; c++) {
      let v = energyAt(sig, eff, c, cols, t);
      if (opts.smooth) { const p = sm.current[c] ?? v; v = p + (v - p) * (v > p ? 0.5 : 0.14); }
      sm.current[c] = v;
      const cell = cellRefs.current[c]; if (!cell) continue;
      cell.style.background = mode === 'mono' ? 'var(--gold)' : colorAt(sig, eff, c, cols, t, opts.sat);
      cell.style.opacity = (0.12 + 0.88 * Math.min(1, v)).toFixed(3);
    }
  });
  return (
    <div className="mtr mtr-heat" aria-hidden="true">
      {Array.from({ length: cols }).map((_, c) => <i key={c} ref={(e) => { cellRefs.current[c] = e; }} className="mtr-heat-cell" />)}
    </div>
  );
}

// ── Registry füllen (Reihenfolge = Anzeige in der Galerie) ──────────
MB_METERS.push(
  { id: 'bars', name: 'Bars', desc: 'Balken vom Boden. Mono = ein kombiniertes Signal; Multi = pro Typ (getrennt/Mittelwert).', Comp: MeterBlend, defaults: { bars: 14 } },
  { id: 'flow', name: 'Flow · fluide Flächen', desc: 'Weich interpolierte Flächen (SVG-Spline).', Comp: MeterFlow, defaults: { bars: 24 } },
  { id: 'mirror', name: 'Mirror · Spiegel (VU)', desc: 'Fluide Fläche symmetrisch um die Mittellinie — sofort als „Audio" lesbar.', Comp: MeterMirror, defaults: { bars: 24 } },
  { id: 'ring', name: 'Ring · konzentrisch', desc: 'Ein Bogen pro Typ, Füllung ∝ Pegel. Ideal für quadratische Slots (Pad-Hintergrund).', Comp: MeterRing, defaults: {} },
  { id: 'radial', name: 'Radial · Strahlen', desc: 'Strahlen aus dem Zentrum, Länge ∝ Pegel, Farbe gemischt. Dramatisch.', Comp: MeterRadial, defaults: { bars: 28 } },
  { id: 'led', name: 'LED · Matrix', desc: 'Punkt-Raster, füllt von unten. Sehr robust auch winzig. Mit Peak-Punkt.', Comp: MeterLED, defaults: { bars: 16 } },
  { id: 'particle', name: 'Particle · Punktwolke', desc: 'Funkelnde Punkte, Helligkeit/Größe ∝ Pegel. Organisch.', Comp: MeterParticle, defaults: { bars: 18 } },
  { id: 'wave', name: 'Wave · Oszilloskop', desc: 'Durchgehende schwingende Linie (nicht gefüllt). Technisch/präzise.', Comp: MeterWave, defaults: { bars: 40 } },
  { id: 'stacked', name: 'Stacked · gestapelt', desc: 'Typ-Flächen stapeln sich (Summe) — zeigt klar, wer wie viel beiträgt.', Comp: MeterStacked, defaults: { bars: 24 } },
  { id: 'heat', name: 'Heat · Streifen', desc: 'Kompakter Streifen, Zelle = Mischfarbe, Helligkeit ∝ Pegel. Top für schmale Leisten.', Comp: MeterHeat, defaults: { bars: 28 } },
);

Object.assign(window, { MeterMirror, MeterRing, MeterRadial, MeterLED, MeterParticle, MeterWave, MeterStacked, MeterHeat });
