// mb-harness.jsx — responsive preview shell ("Größen-Harness").
// Renders the ONE board (MBPhoneBoard) at a chosen logical size: device
// presets (letterboxed + scaled to fit) or "Frei" (fills the window, drag
// the preview to reflow). The board detects portrait/landscape itself; the
// harness only sizes it and reports the current dimensions.
const { useState: useHa, useRef: useHaRef, useEffect: useHaEf, useLayoutEffect: useHaLayout } = React;

const MBH_PRESETS = [
  { id: 'p390',  group: 'Handy · Hochkant',   label: '390 × 844',   w: 390,  h: 844 },
  { id: 'p360',  group: 'Handy · Hochkant',   label: '360 × 800',   w: 360,  h: 800 },
  { id: 'l844',  group: 'Handy · Quer',       label: '844 × 390',   w: 844,  h: 390 },
  { id: 't820',  group: 'Tablet · Hochkant',  label: '820 × 1180',  w: 820,  h: 1180 },
  { id: 't1180', group: 'Tablet · Quer',      label: '1180 × 820',  w: 1180, h: 820 },
  { id: 'd1440', group: 'Desktop',            label: '1440 × 900',  w: 1440, h: 900 },
  { id: 'd1920', group: 'Desktop',            label: '1920 × 1080', w: 1920, h: 1080 },
  { id: 'm1080', group: 'Monitor · Hochkant', label: '1080 × 1920', w: 1080, h: 1920 },
  { id: 'free',  group: 'Frei',               label: 'Fenster füllen', w: 0, h: 0 },
];

function MBHarness() {
  const [presetId, setPresetId] = useHa(() => {
    try { return localStorage.getItem('mb-harness-preset') || 'p390'; } catch (_) { return 'p390'; }
  });
  const preset = MBH_PRESETS.find((p) => p.id === presetId) || MBH_PRESETS[0];
  const free = preset.id === 'free';

  const stageRef = useHaRef(null);
  const [scale, setScale] = useHa(1);
  const [stageSize, setStageSize] = useHa({ w: 0, h: 0 });

  useHaEf(() => { try { localStorage.setItem('mb-harness-preset', presetId); } catch (_) {} }, [presetId]);

  // fit the logical frame into the stage (letterbox); never upscale past 1×.
  // ResizeObserver delivery is unreliable in some embedded previews, so we
  // also recompute on window resize (fires reliably) and on preset change.
  useHaLayout(() => {
    const el = stageRef.current; if (!el) return;
    const compute = () => {
      const aw = el.clientWidth, ah = el.clientHeight;
      setStageSize({ w: aw, h: ah });
      setScale(free ? 1 : Math.min(1, aw / preset.w, ah / preset.h));
    };
    const ro = new ResizeObserver(compute);
    ro.observe(el); compute();
    window.addEventListener('resize', compute);
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); };
  }, [presetId]);

  const fw = free ? stageSize.w : preset.w;
  const fh = free ? stageSize.h : preset.h;
  // AXIS 1 · the harness knows the logical size, so it is the authoritative
  // source of orientation — passed down to the board as a prop. 5% dead-zone
  // around 1:1 avoids flip-flop while dragging the free view near square.
  const orient = fw > fh * 1.05 ? 'landscape' : 'portrait';

  // grouped <optgroup> list
  const groups = [];
  MBH_PRESETS.forEach((p) => {
    let g = groups.find((x) => x.name === p.group);
    if (!g) { g = { name: p.group, items: [] }; groups.push(g); }
    g.items.push(p);
  });

  return (
    <div className="mbh-root">
      <div className="mbh-bar">
        <div className="mbh-brand">Soundboard <span>· responsive board</span></div>

        <label className="mbh-field">
          <span>Größe</span>
          <select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {groups.map((g) => (
              <optgroup key={g.name} label={g.name}>
                {g.items.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="mbh-readout">
          {Math.round(fw)} × {Math.round(fh)}
          {!free && scale < 1 && <em> · {Math.round(scale * 100)}%</em>}
          <span className={`mbh-orient is-${orient}`}><i />{orient === 'landscape' ? 'Quer' : 'Hochkant'}</span>
        </div>
      </div>

      <div className="mbh-stage" ref={stageRef}>
        <div className={`mbh-framewrap${free ? ' is-free' : ''}`}
          style={free ? null : { width: preset.w * scale, height: preset.h * scale }}>
          <div className="mbh-frame"
            style={free ? null : { width: preset.w, height: preset.h, transform: `scale(${scale})` }}>
            <MBPhoneBoard orient={orient} dims={{ w: Math.round(fw), h: Math.round(fh) }} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MBHarness, MBH_PRESETS });
