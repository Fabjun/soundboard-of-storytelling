// flames-gallery.jsx — Vergleichs-Galerie der vier Flammen. Klickbar & live.

const { useState: useGS } = React;

const FLAME_INFO = [
  { id: 'hearth',  name: 'Hearth',  sub: 'Taverne · Anker',  accent: '#E8821E',
    idle: 'Ruhiges Atmen, Knister-Aufflackern, träge Funken.',
    tap: 'Frost kriecht von außen herein, Funken kippen zu fallendem Frost. Auftauen mit Dampf.' },
  { id: 'verdant', name: 'Verdant', sub: 'Wald · D&D',  accent: '#A8E063',
    idle: 'Einzelne Leucht-Sporen steigen auf, windiges Tanzen.',
    tap: 'Spitze löst sich in eine Sporenwolke auf — sinkt zurück und keimt die Flamme neu.' },
  { id: 'neon',    name: 'Neon',    sub: 'Sci-Fi',  accent: '#FF3D8B',
    idle: 'Glitcht von sich aus — Scanlines, RGB-Split, Neon-Brummen.',
    tap: 'Kurzschluss → Blitz + Flash → Elektro-Funken → heller Surge zurück.' },
  { id: 'crimson', name: 'Crimson', sub: 'Horror · Gotik',  accent: '#D63A3A',
    idle: 'Zäh, Blutperle an der Spitze; Glow pulsiert wie Herzschlag.',
    tap: 'Gerinnt → zerläuft von oben, Tropfen + wachsende Lache → lodert neu hoch.' },
];

function FlameCard({ info, size }) {
  return (
    <div className={'fg-card theme-' + info.id}>
      <div className="fg-card-head">
        <div>
          <h3 style={{ color: info.accent }}>{info.name}</h3>
          <span className="fg-sub">{info.sub}</span>
        </div>
        <code style={{ color: info.accent }}>#{info.id}</code>
      </div>
      <div className="fg-stage">
        <ThemedFlame theme={info.id} size={size} interactive />
        <div className="fg-tap-hint">tap ✦ mehrfach</div>
      </div>
      <div className="fg-notes">
        <p><b>Idle</b> {info.idle}</p>
        <p><b style={{ color: info.accent }}>Tap</b> {info.tap}</p>
      </div>
    </div>
  );
}

function FlamesGallery() {
  const [size, setSize] = useGS(190);
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="fg">
      <header className="fg-top">
        <div className="fg-kicker">Animierte Flamme · pro Theme eigener Charakter</div>
        <h1 className="fg-h1">Vier Flammen, ein Feuer</h1>
        <p className="fg-lead">Dieselbe Pixel-Silhouette und dieselbe Mechanik (Idle → Tap → Erholung) — aber jedes Theme bekommt seine eigene Persönlichkeit in Bewegung, Partikeln und Tap-Reaktion. <b>Klick eine Flamme</b> (am besten mehrmals schnell), um ihre Geste auszulösen. Sie erholt sich von selbst.</p>
        <label className="fg-size">
          <span>GRÖSSE<b>{size}px</b></span>
          <input type="range" min="120" max="300" step="10" value={size} onChange={(e) => setSize(+e.target.value)} />
        </label>
        {reduce && <p className="fg-reduce">⚠ „Reduzierte Bewegung" ist aktiv — Idle-Animationen sind gedämpft.</p>}
      </header>
      <div className="fg-grid">
        {FLAME_INFO.map((info) => <FlameCard key={info.id} info={info} size={size} />)}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<FlamesGallery />);
