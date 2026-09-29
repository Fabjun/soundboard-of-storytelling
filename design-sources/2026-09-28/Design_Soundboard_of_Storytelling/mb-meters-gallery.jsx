// mb-meters-gallery.jsx — Galerie/Testumgebung für die Pegelanzeigen.
// Zeigt jede registrierte Anzeige live in mehreren Größen + globale
// Steuerung (aktive Pads / Master / Feuern), damit Skalierbarkeit und
// Dynamik sofort sichtbar sind.

const { useState: useGState, useRef: useGRef, useEffect: useGEffect } = React;

// Größen-Matrix: deckt die echten Einsatz-Kontexte + freie Formate ab.
const SIZES = [
  { label: 'Leiste · 80×16',     w: 80,  h: 16 },
  { label: 'Pad-BG · 120×90',    w: 120, h: 90 },
  { label: 'Master · 240×54',    w: 240, h: 54 },
  { label: 'Hoch · 60×140',      w: 60,  h: 140 },
];

function Swatch({ color, on, onClick }) {
  return <button className={`gx-swatch${on ? ' is-on' : ''}`} style={{ background: color }} onClick={onClick} />;
}

function MeterCard({ meter, active, layers, pulse, master, color, density, separate, opts, mode }) {
  const { Comp, defaults = {} } = meter;
  const ref = useGRef(null);
  const [vis, setVis] = useGState(true);
  useGEffect(() => {
    const el = ref.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => es.forEach((e) => setVis(e.isIntersecting)), { rootMargin: '300px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div className="gx-card" ref={ref}>
      <div className="gx-card-head">
        <h3>{meter.name}</h3>
        <code>#{meter.id}</code>
      </div>
      <p className="gx-desc">{meter.desc}</p>
      <div className="gx-sizes">
        {SIZES.map((s) => {
          // Auflösung dichtebasiert an Breite koppeln (echte Skalierung)
          const bars = Math.max(3, Math.round((s.w / 100) * density));
          return (
            <div className="gx-size" key={s.label}>
              <div className="gx-box" style={{ width: s.w, height: s.h }}>
                {vis ? <Comp active={active} layers={layers} pulse={pulse} master={master} color={color} separate={separate} opts={opts} mode={mode} {...defaults} bars={bars} /> : null}
              </div>
              <span className="gx-size-label">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetersGallery() {
  const [active, setActive] = useGState(2);
  const [master, setMaster] = useGState(85);
  const [pulse, setPulse] = useGState(0);
  const [density, setDensity] = useGState(12); // Balken pro 100px Breite
  const [color, setColor] = useGState('var(--gold)');
  const [separate, setSeparate] = useGState(true); // getrennte Typ-Ebenen (nur Multi)
  const [meterMode, setMeterMode] = useGState('multi'); // 'mono' | 'multi'
  const [opts, setOpts] = useGState({ smooth: true, peak: true, tip: true, sat: true, anchor: true, intensity: true });
  const setOpt = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  const OPT_LABELS = [
    ['smooth', '1 · Glättung'],
    ['peak', '2 · Peak-Hold'],
    ['tip', '3 · Tip-Highlight'],
    ['sat', '4 · Sättigung'],
    ['anchor', '5 · Basis-Verlauf'],
    ['intensity', '6 · Intensitäts-Gewichtung'],
  ];
  // aktive Pads PRO TYP (für die Mehr-Ebenen-Anzeigen)
  const [byType, setByType] = useGState({ single: 1, loop: 1, playlist: 0, combo: 0 });
  const TYPES = [['single', 'SINGLE'], ['loop', 'LOOP'], ['playlist', 'PLAYLIST'], ['combo', 'COMBO']];
  const layers = TYPES.filter(([t]) => byType[t] > 0).map(([t]) => ({ type: t, active: byType[t] }));
  const totalActive = TYPES.reduce((a, [t]) => a + byType[t], 0);
  const setType = (t, v) => setByType((b) => ({ ...b, [t]: v }));

  const COLORS = [
    ['var(--gold)', 'Gold'],
    ['var(--mode-setup)', 'Teal'],
    ['var(--pad-loop)', 'Loop'],
    ['var(--pad-playlist)', 'Playlist'],
    ['var(--blood-bright)', 'Clip'],
  ];

  return (
    <div className="gx">
      <header className="gx-top">
        <div>
          <div className="gx-kicker">Modulare Pegelanzeigen · Testumgebung</div>
          <h1 className="gx-h1">Pegelanzeigen</h1>
          <p className="gx-sub">Jede Anzeige live in mehreren Größen — so siehst du sofort, ob sie dynamisch skaliert. Neue Designs in <code>mb-meters.jsx</code> registrieren; sie erscheinen hier automatisch.</p>
        </div>
      </header>

      <div className="gx-controls">
        <label className="gx-ctl">
          <span>MASTER<b>{master}</b></span>
          <input type="range" min="0" max="100" step="1" value={master} onChange={(e) => setMaster(+e.target.value)} />
        </label>
        <label className="gx-ctl">
          <span>DICHTE<b>{density}/100px</b></span>
          <input type="range" min="4" max="30" step="1" value={density} onChange={(e) => setDensity(+e.target.value)} />
        </label>
        <button className="gx-fire" onClick={() => setPulse((p) => p + 1)}>FEUERN ▸ Puls</button>
        <button className={`gx-toggle${separate ? ' is-on' : ''}`} onClick={() => setSeparate((s) => !s)}>
          <i className="gx-toggle-box">{separate ? '✓' : ''}</i>
          GETRENNTE DARSTELLUNG
        </button>
        <div className="gx-seg" role="group">
          <button className={meterMode === 'mono' ? 'is-on' : ''} onClick={() => setMeterMode('mono')}>MONO</button>
          <button className={meterMode === 'multi' ? 'is-on' : ''} onClick={() => setMeterMode('multi')}>MULTI</button>
        </div>
        <label className="gx-ctl">
          <span>EINFARBIG (Bars)<b>{color === 'var(--gold)' ? 'Gold' : '…'}</b></span>
          <div className="gx-colors">
            {COLORS.map(([c]) => <Swatch key={c} color={c} on={color === c} onClick={() => setColor(c)} />)}
          </div>
        </label>
      </div>

      <div className="gx-controls gx-bytype">
        <span className="gx-bytype-title">AKTIVE PADS PRO TYP · speist die Mehr-Ebenen-Anzeigen (max. 4 Ebenen)</span>
        <div className="gx-bytype-row">
          {TYPES.map(([t, label]) => (
            <label className="gx-typ" key={t}>
              <span className="gx-typ-head"><i className="gx-typ-dot" style={{ background: `var(--pad-${t})` }} />{label}<b>{byType[t]}</b></span>
              <input type="range" min="0" max="4" step="1" value={byType[t]}
                onChange={(e) => setType(t, +e.target.value)}
                style={{ accentColor: `var(--pad-${t})` }} />
            </label>
          ))}
        </div>
      </div>

      <div className="gx-controls gx-bytype">
        <span className="gx-bytype-title">OPTIK · Grundgerüst-Optionen (gelten für alle Anzeigen)</span>
        <div className="gx-opts">
          {OPT_LABELS.map(([k, label]) => (
            <button key={k} className={`gx-toggle${opts[k] ? ' is-on' : ''}`} onClick={() => setOpt(k)}>
              <i className="gx-toggle-box">{opts[k] ? '✓' : ''}</i>{label}
            </button>
          ))}
        </div>
      </div>

      <div className="gx-grid">
        {MB_METERS.map((m) => (
          <MeterCard key={m.id} meter={m} active={totalActive} layers={layers} pulse={pulse} master={master} color={color} density={density} separate={separate} opts={opts} mode={meterMode} />
        ))}
        {MB_METERS.length === 1 && (
          <div className="gx-empty">
            + Weitere Designs in <code>mb-meters.jsx</code> (siehe VORLAGE-Block) registrieren — sie erscheinen automatisch hier.
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MetersGallery />);
