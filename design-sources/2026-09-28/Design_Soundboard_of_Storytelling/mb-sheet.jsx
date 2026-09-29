// mb-sheet.jsx — SETUP DISPLAY sheet + the grip primitives it uses.
// Loaded BEFORE mb-board.jsx (board references these as globals).

const { useState: useS, useRef: useR } = React;

// ── Grip primitives ──────────────────────────────────────────────
// Summon pull-tab ("I open"). orient: 'h' (phone seam) | 'v' (tablet seam)
function GripTab({ style = 'A', orient = 'h', mode = 'setup' }) {
  const v = orient === 'v' ? ' v' : '';
  if (style === 'B') {
    return <div className={`grip-B summon${v}`}><MBIcon name={orient === 'v' ? 'chevL' : 'chevU'} size={12} color="var(--mode-setup)" /></div>;
  }
  if (style === 'C') {
    return <div className={`grip-C-summon${v}`}><MBIcon name={orient === 'v' ? 'chevL' : 'chevU'} size={11} color="#04201f" /></div>;
  }
  return <div className={`grip-A-summon${v}`}><MBIcon name={orient === 'v' ? 'chevL' : 'chevU'} size={11} color="#04201f" /></div>;
}

// Resize grip ("slide me"). Flush/recessed, never colored (except B glyph differs).
function GripResize({ style = 'A', orient = 'h' }) {
  const v = orient === 'v' ? ' v' : '';
  if (style === 'B') {
    return <div className={`grip-B${v}`}><MBIcon name="dots" size={11} color="var(--text-mute)" /></div>;
  }
  if (style === 'C') {
    return <div className={`grip-C-resize${v}`}>{[0, 1, 2, 3].map((i) => <i key={i} />)}</div>;
  }
  return <div className={`grip-A-resize${v}`}>{[0, 1, 2].map((i) => <i key={i} />)}</div>;
}

// ── A draggable track slider with live-preview activation ─────────
function MBTrack({ label, value, min, max, step = 1, fmt, onChange, onActive, accent = 'var(--mode-setup)' }) {
  const railRef = useR(null);
  const set = (clientX) => {
    const r = railRef.current.getBoundingClientRect();
    let p = (clientX - r.left) / r.width; p = Math.max(0, Math.min(1, p));
    let val = min + p * (max - min);
    val = Math.round(val / step) * step;
    onChange(Math.max(min, Math.min(max, val)));
  };
  const down = (e) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    onActive && onActive(true);
    set(e.clientX);
  };
  const move = (e) => { if (e.buttons || e.pressure) { e.preventDefault(); set(e.clientX); } };
  const up = (e) => { onActive && onActive(false); try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {} };
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-ctl">
      <div className="mb-ctl-label">
        <span>{label}<span className="mb-ctl-preview-flag">· LIVE</span></span>
        <b>{fmt ? fmt(value) : value}</b>
      </div>
      <div className="mb-track" ref={railRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="mb-track-rail" />
        <div className="mb-track-fill" style={{ width: pct + '%', background: accent }} />
        <div className="mb-track-thumb" style={{ left: pct + '%', background: accent, boxShadow: `0 0 7px ${accent}` }} />
      </div>
    </div>
  );
}

// ── The SETUP DISPLAY sheet ───────────────────────────────────────
function DisplaySheet(props) {
  const {
    open, preview, gripStyle, onClose, onToggle, orient,
    padSize, gap, colMode, fixedCols, labelSize, effectiveCols, maxFixedCols,
    setPadSize, setGap, setLabelSize, setColMode, setFixedCols,
    atmos, setAtmos, setPreview,
  } = props;

  const cls = ['mb-sheet'];
  if (!open) cls.push('is-closed');
  if (preview) cls.push('is-preview');

  // ONE arrow button — same build as Menu A's chevron — opens AND closes.
  // Direction follows orientation: ▲/▼ when docked top/bottom, ◀/▶ on the side.
  const toggleIcon = orient === 'landscape' ? (open ? 'chevR' : 'chevL') : (open ? 'chevD' : 'chevU');

  return (
    <div className={cls.join(' ')}>
      {/* the single chevron toggle (replaces the old summon tab + resize grip) */}
      <button className="mb-sheet-toggle" onClick={onToggle}
        aria-label={open ? 'Close display panel' : 'Open display panel'}>
        <MBIcon name={toggleIcon} size={13} color="var(--mode-setup)" />
      </button>

      <div className="mb-sheet-head">
        <MBIcon name="grid" size={13} color="var(--mode-setup)" />
        <span className="t">DISPLAY · this scene</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>live preview</span>
      </div>

      <div className="mb-sheet-body">
        <div className={preview === 'size' ? 'is-active' : ''}>
          <MBTrack label="PAD SIZE" value={padSize} min={64} max={150} step={2} fmt={(v) => v + 'px'}
            onChange={setPadSize} onActive={(a) => setPreview(a ? 'size' : null)} />
        </div>
        <div className={preview === 'gap' ? 'is-active' : ''}>
          <MBTrack label="GAP" value={gap} min={0} max={24} step={1} fmt={(v) => v + 'px'}
            onChange={setGap} onActive={(a) => setPreview(a ? 'gap' : null)} />
        </div>

        <div className="mb-ctl">
          <div className="mb-ctl-label"><span>COLUMNS</span>
            <b>{colMode === 'auto' ? `AUTO · ${effectiveCols}` : `${fixedCols} of ${maxFixedCols}`}</b>
          </div>
          <div className="mb-cols">
            <div className="mb-seg">
              <button className={colMode === 'auto' ? 'is-on' : ''} onClick={() => setColMode('auto')}>AUTO</button>
              <button className={colMode === 'fixed' ? 'is-on' : ''} onClick={() => setColMode('fixed')}>FIXED</button>
            </div>
            {colMode === 'fixed' && (
              <div className="mb-stepper">
                <button disabled={fixedCols <= 2} onClick={() => setFixedCols(Math.max(2, fixedCols - 1))}>−</button>
                <span className="v">{fixedCols}</span>
                <button disabled={fixedCols >= maxFixedCols} onClick={() => setFixedCols(Math.min(maxFixedCols, fixedCols + 1))}>+</button>
              </div>
            )}
            <div style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>
              {colMode === 'auto' ? 'size + gap pick the count' : `max ${maxFixedCols} · keeps pads tappable`}
            </div>
          </div>
        </div>

        <div className={preview === 'label' ? 'is-active' : ''}>
          <MBTrack label="LABEL SIZE" value={labelSize} min={9} max={18} step={1} fmt={(v) => v + 'px'}
            onChange={setLabelSize} onActive={(a) => setPreview(a ? 'label' : null)} />
        </div>

        <div className="mb-ctl" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.1em', color: 'var(--text-dim)' }}>ATMOSPHERE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-mute)', marginTop: 2 }}>hearth-glow + embers · PROVISIONAL — evaluate separately</div>
            </div>
            <div className={`sb-toggle${atmos ? ' is-on' : ''}`} onClick={() => setAtmos(!atmos)} style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GripTab, GripResize, MBTrack, DisplaySheet });
