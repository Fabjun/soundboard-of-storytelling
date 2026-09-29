// v10-clock-themes.jsx — Clock widget + per-theme ornament packs.
// Two ideas in one file because they compose: each theme picks its own
// clock style + its own decorative vocabulary. SciFi gets a digital
// readout + circuit traces, not candles. Horror gets a gothic
// pendulum + cobwebs. Fantasy keeps its pocket watch + candles.

// ════════════════════════════════════════════════════════════════
// SECTION A · CLOCK COMPONENTS
// Every clock is pixel-art, drawn with SVG <rect>s. Each supports
// two modes:
//   mode="live"      — shows current time, hands sweep normally
//   mode="countdown" — counts down; when it hits 0 it fires a PAD
// The countdown mode shows: target time, progress arc, a PAD chip
// indicating which pad fires on zero, plus a red "danger" tint
// when < 30s remain.
// ════════════════════════════════════════════════════════════════

// ── A1 · POCKET WATCH (Hearth — default fantasy) ───────────────
function PocketWatch({ mode = 'live', remaining = 240, total = 600, padName = 'BELL TOLL', size = 110 }) {
  // For demo: live mode shows 8:42; countdown shows remaining seconds
  const minutes = mode === 'live' ? 8  : Math.floor(remaining / 60);
  const seconds = mode === 'live' ? 42 : remaining % 60;
  const hourAngle = mode === 'live' ? (8 * 30 + 42 * 0.5) : 0;
  const minAngle  = mode === 'live' ? (42 * 6) : (seconds * 6);
  const progress  = mode === 'countdown' ? 1 - (remaining / total) : 0;
  const danger    = mode === 'countdown' && remaining < 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Chain pendant */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: -4 }}>
        <PixelIcon name="diamond" size={6} color="var(--gold)" />
        <div style={{ width: 2, height: 8, background: 'var(--gold-dim)' }} />
        <div style={{ width: 10, height: 4, background: 'var(--gold)', borderRadius: 0 }} />
      </div>

      <div style={{ position: 'relative', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.4))' }}>
        <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
          {/* Outer brass ring — pixel circle */}
          {pixelCircle(32, 32, 30, 'var(--gold-dim)', 2)}
          {pixelCircle(32, 32, 28, 'var(--gold)', 1)}
          {/* Inner face */}
          <rect x="4" y="4" width="56" height="56" fill="var(--sunk)" />
          {pixelCircle(32, 32, 26, 'var(--surface)', null, true)}

          {/* Hour ticks — cardinal thick, others thin */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
            const a = (h * 30 - 90) * Math.PI / 180;
            const r = 24;
            const x = Math.round(32 + Math.cos(a) * r);
            const y = Math.round(32 + Math.sin(a) * r);
            const cardinal = h % 3 === 0;
            return (
              <rect key={h}
                x={x - (cardinal ? 1 : 0)}
                y={y - (cardinal ? 1 : 0)}
                width={cardinal ? 3 : 1}
                height={cardinal ? 3 : 1}
                fill={danger && cardinal ? 'var(--blood-bright)' : 'var(--gold-bright)'}
              />
            );
          })}

          {/* Countdown progress arc (only in countdown mode) */}
          {mode === 'countdown' && (
            <g style={{ opacity: .85 }}>
              {pixelArc(32, 32, 22, -90, -90 + progress * 360,
                danger ? 'var(--blood)' : 'var(--gold-bright)')}
            </g>
          )}

          {/* Hour hand */}
          <g transform={`rotate(${hourAngle} 32 32)`}>
            <rect x="31" y="16" width="2" height="17" fill={danger ? 'var(--blood-bright)' : 'var(--text)'} />
          </g>
          {/* Minute hand */}
          <g transform={`rotate(${minAngle} 32 32)`}>
            <rect x="31" y="10" width="2" height="23" fill={danger ? 'var(--blood-bright)' : 'var(--gold-bright)'} />
          </g>
          {/* Center pin */}
          <rect x="30" y="30" width="4" height="4" fill="var(--gold)" />
          <rect x="31" y="31" width="2" height="2" fill="var(--gold-bright)" />
        </svg>

        {/* Live digital readout overlaid bottom of face */}
        <div style={{
          position: 'absolute', bottom: '22%', left: 0, right: 0, textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 8,
          color: 'var(--text-mute)',
          letterSpacing: '.1em',
          pointerEvents: 'none',
        }}>
          {mode === 'countdown'
            ? <span style={{ color: danger ? 'var(--blood-bright)' : 'var(--gold-bright)' }}>{String(minutes).padStart(1, '0')}:{String(seconds).padStart(2, '0')}</span>
            : <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          }
        </div>
      </div>

      {/* PAD that fires when timer hits 0 */}
      {mode === 'countdown' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 8px',
          background: danger ? 'rgba(160,40,40,.18)' : 'var(--raised)',
          border: `1px solid ${danger ? 'var(--blood)' : 'var(--gold-dim)'}`,
          borderLeft: `3px solid var(--pad-single)`,
        }}>
          <PixelIcon name="play" size={9} color="var(--pad-single)" />
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 9,
            color: danger ? 'var(--blood-bright)' : 'var(--gold)',
            letterSpacing: '.08em',
          }}>↳ {padName}</span>
        </div>
      )}
    </div>
  );
}

// ── A2 · STANDING CLOCK (Verdant — wooden grandfather) ─────────
function StandingClock({ mode = 'live', remaining = 180, padName = 'WOLF HOWL', height = 220 }) {
  const danger = mode === 'countdown' && remaining < 30;
  const minutes = mode === 'live' ? 8 : Math.floor(remaining / 60);
  const seconds = mode === 'live' ? 42 : remaining % 60;
  const w = 56;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{
        display: 'block',
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.4))',
      }}>
        {/* Wooden case — slightly wider than tall */}
        <rect x="2" y="14" width={w - 4} height={height - 28} fill="var(--gold-dim)" />
        <rect x="4" y="16" width={w - 8} height={height - 32} fill="#3a2818" />

        {/* Crown / cornice */}
        <rect x="0" y="8"  width={w}      height="6" fill="var(--gold-dim)" />
        <rect x="4" y="2"  width={w - 8}  height="6" fill="var(--gold-dim)" />
        <rect x="8" y="0"  width={w - 16} height="2" fill="var(--gold)" />

        {/* Foot */}
        <rect x="0" y={height - 14} width={w} height="6" fill="var(--gold-dim)" />
        <rect x="6" y={height - 8}  width={w - 12} height="6" fill="var(--gold-dim)" />

        {/* Clock face — circle inset */}
        {pixelCircle(w / 2, 30, 13, 'var(--gold)', 1, true)}
        {pixelCircle(w / 2, 30, 12, 'var(--sunk)',  null, true)}
        {[0, 3, 6, 9].map((h) => {
          const a = (h * 30 - 90) * Math.PI / 180;
          const x = Math.round(w / 2 + Math.cos(a) * 10);
          const y = Math.round(30   + Math.sin(a) * 10);
          return <rect key={h} x={x - 1} y={y - 1} width="2" height="2" fill="var(--gold-bright)" />;
        })}
        {/* Hands */}
        <g transform={`rotate(${mode === 'live' ? 250 : (seconds * 6)} ${w / 2} 30)`}>
          <rect x={w / 2 - 0.5} y="22" width="1" height="8" fill={danger ? 'var(--blood-bright)' : 'var(--gold-bright)'} />
        </g>
        <g transform={`rotate(${mode === 'live' ? 60 : (minutes * 30)} ${w / 2} 30)`}>
          <rect x={w / 2 - 1} y="24" width="2" height="6" fill="var(--text)" />
        </g>
        <rect x={w / 2 - 1} y="29" width="2" height="2" fill="var(--gold)" />

        {/* Digital readout below face for countdown */}
        {mode === 'countdown' && (
          <g>
            <rect x={w / 2 - 14} y="46" width="28" height="8" fill="var(--sunk)" stroke="var(--gold-dim)" />
            <text x={w / 2} y="52" fontFamily="monospace" fontSize="6"
              fill={danger ? 'var(--blood-bright)' : 'var(--gold-bright)'}
              textAnchor="middle" letterSpacing=".5">
              {String(minutes).padStart(1, '0')}:{String(seconds).padStart(2, '0')}
            </text>
          </g>
        )}

        {/* Pendulum window — vertical slot */}
        <rect x={w / 2 - 8} y="62" width="16" height={height - 92} fill="var(--sunk)" stroke="#1f1408" />
        {/* Pendulum rod + bob (swings via CSS animation on parent group) */}
        <g style={{ transformOrigin: `${w / 2}px 62px`, animation: 'sb-pendulum 2s ease-in-out infinite' }}>
          <rect x={w / 2 - 0.5} y="62" width="1" height={height - 110} fill="var(--gold)" />
          <circle cx={w / 2} cy={height - 48} r="6" fill="var(--gold)" />
          <circle cx={w / 2} cy={height - 48} r="3" fill="var(--gold-bright)" />
        </g>

        {/* Carved decoration mid-case */}
        <rect x={w / 2 - 6} y={height / 2 + 10} width="12" height="2" fill="var(--gold-dim)" />
        <rect x={w / 2 - 4} y={height / 2 + 14} width="8"  height="2" fill="var(--gold-dim)" />
        <rect x={w / 2 - 2} y={height / 2 + 18} width="4"  height="2" fill="var(--gold-dim)" />
      </svg>

      <style>{`@keyframes sb-pendulum { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }`}</style>

      {mode === 'countdown' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', background: 'var(--raised)',
          border: `1px solid ${danger ? 'var(--blood)' : 'var(--gold-dim)'}`,
          borderLeft: `3px solid var(--pad-single)`,
        }}>
          <PixelIcon name="play" size={9} color="var(--pad-single)" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: danger ? 'var(--blood-bright)' : 'var(--gold)' }}>↳ {padName}</span>
        </div>
      )}
    </div>
  );
}

// ── A3 · DIGITAL READOUT (Neon — sci-fi) ───────────────────────
function DigitalClock({ mode = 'live', remaining = 200, padName = 'SYS ALERT' }) {
  const minutes = mode === 'live' ? 20 : Math.floor(remaining / 60);
  const seconds = mode === 'live' ? 42 : remaining % 60;
  const danger = mode === 'countdown' && remaining < 30;

  return (
    <div style={{
      width: 132, padding: 10,
      background: 'var(--sunk)',
      border: '1px solid var(--gold)',
      boxShadow: '0 0 12px var(--gold-dim) inset',
      fontFamily: 'var(--font-mono)',
      position: 'relative',
    }}>
      {/* Status LED */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          width: 6, height: 6,
          background: mode === 'countdown' ? (danger ? 'var(--blood-bright)' : 'var(--gold-bright)') : 'var(--gold-bright)',
          boxShadow: '0 0 6px currentColor',
          color: mode === 'countdown' ? (danger ? 'var(--blood-bright)' : 'var(--gold-bright)') : 'var(--gold-bright)',
          animation: 'sb-led-blink 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.16em' }}>
          {mode === 'countdown' ? 'T-MINUS' : 'LOCAL'}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: 'var(--gold)' }}>{mode === 'live' ? 'sync' : `${Math.floor((1 - remaining / 600) * 100)}%`}</span>
      </div>

      {/* Big readout */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        color: danger ? 'var(--blood-bright)' : 'var(--gold-bright)',
        letterSpacing: '.05em',
        textShadow: '0 0 6px currentColor, 0 0 14px currentColor',
        lineHeight: 1,
        padding: '6px 0',
      }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      {/* Progress bar */}
      {mode === 'countdown' && (
        <div style={{ height: 4, background: 'rgba(255,255,255,.05)', marginTop: 6 }}>
          <div style={{
            width: `${(1 - remaining / 600) * 100}%`, height: '100%',
            background: danger ? 'var(--blood-bright)' : 'var(--gold)',
            boxShadow: '0 0 6px currentColor',
          }} />
        </div>
      )}

      {/* Scrolling status text */}
      <div style={{
        marginTop: 6, padding: '2px 4px',
        background: 'rgba(255,255,255,.03)',
        fontSize: 8, color: 'var(--text-mute)', letterSpacing: '.08em',
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        ▸ {mode === 'live' ? 'NTP locked · 48 kHz ·  bus stable' : `T-${minutes * 60 + seconds}s · ALERT QUEUED`}
      </div>

      {mode === 'countdown' && (
        <div style={{
          marginTop: 6, padding: '3px 6px',
          background: 'var(--surface)',
          border: '1px solid var(--gold-dim)',
          borderLeft: '3px solid var(--pad-single)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <PixelIcon name="play" size={9} color="var(--pad-single)" />
          <span style={{ fontSize: 9, color: 'var(--gold)' }}>EXEC ↳ {padName}</span>
        </div>
      )}

      <style>{`@keyframes sb-led-blink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }`}</style>
    </div>
  );
}

// ── A4 · GOTHIC CLOCK (Crimson — horror pendulum) ──────────────
function GothicClock({ mode = 'live', remaining = 90, padName = 'HEART STOP', height = 220 }) {
  const danger = mode === 'countdown' && remaining < 30;
  const minutes = mode === 'live' ? 11 : Math.floor(remaining / 60);
  const seconds = mode === 'live' ? 13 : remaining % 60;
  const w = 64;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.7))',
      }}>
        {/* Gothic spire crown */}
        <polygon points={`${w / 2 - 6},14 ${w / 2},2 ${w / 2 + 6},14`} fill="var(--blood)" />
        <rect x={w / 2 - 1} y="0" width="2" height="4" fill="var(--blood-bright)" />
        {/* Side spires */}
        <polygon points="6,18 10,8 14,18" fill="var(--blood)" />
        <polygon points={`${w - 14},18 ${w - 10},8 ${w - 6},18`} fill="var(--blood)" />

        {/* Case — darker wood/iron */}
        <rect x="2" y="18" width={w - 4} height={height - 32} fill="#3a1414" />
        <rect x="4" y="20" width={w - 8} height={height - 36} fill="#1a0808" />

        {/* Foot */}
        <rect x="0" y={height - 14} width={w}     height="6" fill="var(--blood)" />
        <rect x="6" y={height - 8}  width={w - 12} height="6" fill="#3a1414" />

        {/* Face — darker, with red roman numerals */}
        {pixelCircle(w / 2, 36, 16, 'var(--blood)', 1, true)}
        {pixelCircle(w / 2, 36, 15, 'var(--sunk)',  null, true)}
        {[0, 3, 6, 9].map((h) => {
          const a = (h * 30 - 90) * Math.PI / 180;
          const x = Math.round(w / 2 + Math.cos(a) * 12);
          const y = Math.round(36   + Math.sin(a) * 12);
          return <rect key={h} x={x - 1} y={y - 1} width="2" height="2" fill="var(--blood-bright)" />;
        })}
        {/* Hands — bone white */}
        <g transform={`rotate(${mode === 'live' ? 78 : (seconds * 6)} ${w / 2} 36)`}>
          <rect x={w / 2 - 0.5} y="26" width="1" height="10" fill={danger ? 'var(--blood-bright)' : 'var(--text)'} />
        </g>
        <g transform={`rotate(${mode === 'live' ? 330 : (minutes * 30)} ${w / 2} 36)`}>
          <rect x={w / 2 - 1} y="28" width="2" height="8" fill="var(--text-dim)" />
        </g>
        <rect x={w / 2 - 1} y="35" width="2" height="2" fill="var(--blood-bright)" />

        {/* Pendulum window */}
        <rect x={w / 2 - 10} y="62" width="20" height={height - 92} fill="var(--sunk)" stroke="#0a0202" />
        <g style={{ transformOrigin: `${w / 2}px 62px`, animation: 'sb-pendulum-slow 2.6s ease-in-out infinite' }}>
          <rect x={w / 2 - 0.5} y="62" width="1" height={height - 112} fill="var(--blood)" />
          {/* Pendulum bob — blade-like */}
          <polygon points={`${w / 2 - 5},${height - 56} ${w / 2 + 5},${height - 56} ${w / 2},${height - 40}`} fill="var(--blood)" />
          <polygon points={`${w / 2 - 3},${height - 56} ${w / 2 + 3},${height - 56} ${w / 2},${height - 44}`} fill="var(--blood-bright)" />
        </g>

        {/* Carved gargoyle motif mid-case */}
        <rect x={w / 2 - 4} y={height / 2 + 8} width="2" height="2" fill="var(--blood)" />
        <rect x={w / 2 + 2} y={height / 2 + 8} width="2" height="2" fill="var(--blood)" />
        <rect x={w / 2 - 3} y={height / 2 + 12} width="6" height="1" fill="var(--blood)" />

        {/* Digital countdown panel */}
        {mode === 'countdown' && (
          <g>
            <rect x={w / 2 - 16} y="56" width="32" height="9" fill="var(--sunk)" stroke="var(--blood)" />
            <text x={w / 2} y="63" fontFamily="monospace" fontSize="7"
              fill={danger ? 'var(--blood-bright)' : 'var(--text)'}
              textAnchor="middle" letterSpacing=".5">
              {String(minutes).padStart(1, '0')}:{String(seconds).padStart(2, '0')}
            </text>
          </g>
        )}
      </svg>

      <style>{`@keyframes sb-pendulum-slow { 0%, 100% { transform: rotate(-16deg); } 50% { transform: rotate(16deg); } }`}</style>

      {mode === 'countdown' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', background: 'var(--raised)',
          border: `1px solid ${danger ? 'var(--blood-bright)' : 'var(--blood)'}`,
          borderLeft: `3px solid var(--blood)`,
        }}>
          <PixelIcon name="skull" size={9} color="var(--blood-bright)" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--blood-bright)' }}>↳ {padName}</span>
        </div>
      )}
    </div>
  );
}

// ── Helpers — pixel circles & arcs ─────────────────────────────
function pixelCircle(cx, cy, r, fill, width, filled) {
  const rects = [];
  for (let y = -r - 1; y <= r + 1; y++) {
    for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.hypot(x, y);
      const onRing = width ? (d >= r - width / 2 && d <= r + width / 2) : (d >= r - .6 && d <= r + .4);
      const inFilled = filled && d <= r + .4;
      if (onRing || inFilled) {
        rects.push(<rect key={`${x}-${y}`} x={cx + x} y={cy + y} width="1" height="1" fill={fill} />);
      }
    }
  }
  return rects;
}
function pixelArc(cx, cy, r, startDeg, endDeg, fill) {
  const rects = [];
  for (let deg = startDeg; deg <= endDeg; deg += 4) {
    const rad = deg * Math.PI / 180;
    const x = Math.round(cx + Math.cos(rad) * r);
    const y = Math.round(cy + Math.sin(rad) * r);
    rects.push(<rect key={deg} x={x - 0.5} y={y - 0.5} width="1.5" height="1.5" fill={fill} />);
  }
  return rects;
}

// ════════════════════════════════════════════════════════════════
// SECTION B · COUNTDOWN CONFIG PANEL
// The UI shown when you tap "configure countdown" — lets you set
// duration and pick which PAD fires on zero.
// ════════════════════════════════════════════════════════════════
function CountdownConfigPanel() {
  return (
    <div style={{
      width: 280,
      background: 'var(--raised)',
      border: '2px solid var(--gold)',
      boxShadow: 'var(--shadow-pop)',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <PixelIcon name="hourglass" size={14} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.14em' }}>SET COUNTDOWN</span>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.1em', marginBottom: 6 }}>DURATION</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {['1m', '3m', '5m', '10m', '30m'].map((t, i) => (
              <span key={t} style={{
                padding: '4px 8px',
                background: i === 2 ? 'rgba(212,178,92,.18)' : 'transparent',
                border: '1px solid ' + (i === 2 ? 'var(--gold)' : 'var(--border)'),
                color: i === 2 ? 'var(--gold)' : 'var(--text-dim)',
                fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.08em',
                cursor: 'pointer',
              }}>{t}</span>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
            or <span className="sb-num">04:30</span> custom
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.1em', marginBottom: 6 }}>FIRE PAD ON ZERO</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px',
            background: 'var(--surface)',
            border: '1px solid var(--gold)',
            borderLeft: '3px solid var(--pad-single)',
          }}>
            <PixelIcon name="play" size={12} color="var(--pad-single)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}>Bell Toll</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>single · 0:06 · F8</div>
            </div>
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 6px' }}>↻</button>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 4 }}>
            // none = silent timer · combo = chain reveal
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.1em', marginBottom: 6 }}>WARNING</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sb-pill is-on" style={{ fontSize: 9 }}>30s pulse</span>
            <span className="sb-pill" style={{ fontSize: 9 }}>10s pulse</span>
            <span className="sb-pill" style={{ fontSize: 9 }}>silent</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ flex: 1 }}>CANCEL</button>
          <button className="sb-btn sb-btn-sm sb-btn-filled" style={{ flex: 1 }}>
            <PixelIcon name="play" size={10} /> START
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION C · DECORATION PICKER — the sidebar "slot" UI
// Replaces the always-on candles strip with a user-selectable
// decoration slot. Theme-aware: only options that suit the
// current theme are shown.
// ════════════════════════════════════════════════════════════════
function DecorationPicker({ theme = 'hearth', selected = 'pocket-watch' }) {
  const OPTIONS = {
    hearth: [
      { id: 'none',         glyph: 'diamond',  label: 'None'           },
      { id: 'candles',      glyph: 'flame',    label: 'Candles'        },
      { id: 'pocket-watch', glyph: 'hourglass', label: 'Pocket watch'  },
      { id: 'tall-clock',   glyph: 'hourglass', label: 'Standing clock'},
    ],
    verdant: [
      { id: 'none',         glyph: 'diamond',  label: 'None'           },
      { id: 'vines',        glyph: 'sparkle',  label: 'Hanging vines'  },
      { id: 'mushrooms',    glyph: 'potion',   label: 'Mushroom cluster' },
      { id: 'cuckoo',       glyph: 'hourglass', label: 'Cuckoo clock'  },
      { id: 'tall-clock',   glyph: 'hourglass', label: 'Standing clock'},
    ],
    neon: [
      { id: 'none',         glyph: 'diamond',  label: 'None'           },
      { id: 'circuits',     glyph: 'sparkle',  label: 'Circuit traces' },
      { id: 'leds',         glyph: 'star',     label: 'LED panel'      },
      { id: 'digital',      glyph: 'hourglass', label: 'Digital readout' },
    ],
    crimson: [
      { id: 'none',         glyph: 'diamond',  label: 'None'           },
      { id: 'cobwebs',      glyph: 'sparkle',  label: 'Cobwebs'        },
      { id: 'cracks',       glyph: 'rune',     label: 'Cracked glass'  },
      { id: 'wax',          glyph: 'potion',   label: 'Dripping wax'   },
      { id: 'gothic-clock', glyph: 'skull',    label: 'Gothic pendulum'},
    ],
  };
  return (
    <div style={{
      padding: 10,
      background: 'var(--deep)',
      border: '1px solid var(--border-soft)',
    }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.16em', marginBottom: 8 }}>
        DECORATION SLOT
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {OPTIONS[theme].map((o) => (
          <div key={o.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px',
            background: o.id === selected ? 'var(--top)' : 'transparent',
            borderLeft: o.id === selected ? '2px solid var(--gold)' : '2px solid transparent',
            cursor: 'pointer',
          }}>
            <PixelIcon name={o.glyph} size={11} color={o.id === selected ? 'var(--gold)' : 'var(--text-dim)'} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: o.id === selected ? 'var(--gold)' : 'var(--text-dim)', letterSpacing: '.04em' }}>{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION D · PER-THEME EDGE ORNAMENTS
// Small decorative atoms unique to each theme. Used as right/left
// edge accents on the workspace.
// ════════════════════════════════════════════════════════════════

// ── Verdant: hanging vine ───────────────────────────────────────
function HangingVine({ height = 200 }) {
  return (
    <svg width="24" height={height} viewBox={`0 0 24 ${height}`} style={{ display: 'block' }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const y = 10 + i * (height / 9);
        const x = 12 + Math.sin(i * 0.7) * 4;
        return <rect key={i} x={x - 1} y={y - 1} width="2" height="3" fill="#4FA67A" />;
      })}
      {/* Leaves along the way */}
      {[40, 90, 140, 180].map((y, i) => {
        const x = 12 + Math.sin(y * 0.05) * 4;
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <rect x="-4" y="-2" width="2" height="2" fill="#5fc88f" />
            <rect x="-6" y="0"  width="2" height="2" fill="#4FA67A" />
            <rect x="-4" y="2"  width="2" height="2" fill="#4FA67A" />
            <rect x="3"  y="-1" width="2" height="2" fill="#5fc88f" />
            <rect x="5"  y="1"  width="2" height="2" fill="#4FA67A" />
          </g>
        );
      })}
    </svg>
  );
}

// ── Verdant: mushroom cluster ──────────────────────────────────
function MushroomCluster() {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40">
      {/* Big mushroom */}
      <ellipse cx="20" cy="18" rx="12" ry="6" fill="#a04040" />
      <rect x="14" y="14" width="2" height="2" fill="#fff" />
      <rect x="22" y="16" width="2" height="2" fill="#fff" />
      <rect x="26" y="13" width="2" height="2" fill="#fff" />
      <rect x="16" y="22" width="8" height="12" fill="#e8d8a8" />
      <rect x="16" y="32" width="8" height="2" fill="#9c8868" />
      {/* Small mushroom */}
      <ellipse cx="42" cy="26" rx="7" ry="4" fill="#a04040" />
      <rect x="40" y="24" width="2" height="2" fill="#fff" />
      <rect x="44" y="25" width="2" height="2" fill="#fff" />
      <rect x="39" y="28" width="6" height="8" fill="#e8d8a8" />
      <rect x="39" y="35" width="6" height="2" fill="#9c8868" />
    </svg>
  );
}

// ── Neon: vertical circuit trace ───────────────────────────────
function CircuitTrace({ height = 200 }) {
  return (
    <svg width="22" height={height} viewBox={`0 0 22 ${height}`} style={{ display: 'block' }}>
      {/* Main vertical line */}
      <rect x="10" y="0" width="2" height={height} fill="var(--gold-dim)" />
      {/* Branches */}
      {[30, 80, 130, 170].map((y) => (
        <g key={y}>
          <rect x={y % 60 === 30 ? 4 : 12} y={y} width="8" height="2" fill="var(--gold-dim)" />
          <rect x={y % 60 === 30 ? 2 : 18} y={y - 2} width="4" height="6" fill="var(--gold)" />
          <rect x={y % 60 === 30 ? 3 : 19} y={y - 1} width="2" height="4" fill="var(--gold-bright)" style={{
            animation: 'sb-circuit-blink 2s ease-in-out infinite',
            animationDelay: `${y * 0.01}s`,
          }} />
        </g>
      ))}
      <style>{`@keyframes sb-circuit-blink { 0%, 100% { opacity: .4; } 50% { opacity: 1; } }`}</style>
    </svg>
  );
}

// ── Neon: LED panel ─────────────────────────────────────────────
function LEDPanel() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(8, 8px)', gap: 2,
      padding: 6, background: 'var(--sunk)', border: '1px solid var(--gold-dim)',
    }}>
      {Array.from({ length: 24 }).map((_, i) => {
        const lit = i % 3 !== 0;
        const hue = i < 8 ? 'var(--gold)' : i < 16 ? 'var(--pad-loop)' : 'var(--pad-playlist)';
        return (
          <div key={i} style={{
            width: 8, height: 8,
            background: lit ? hue : 'var(--border-soft)',
            boxShadow: lit ? `0 0 4px ${hue}` : 'none',
            animation: lit ? `sb-led-flicker 1.${i % 9}s ease-in-out infinite` : 'none',
          }} />
        );
      })}
      <style>{`@keyframes sb-led-flicker { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
    </div>
  );
}

// ── Crimson: cobweb in corner ──────────────────────────────────
function Cobweb({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ opacity: .5 }}>
      {/* Radial lines from corner (0,0) */}
      {[0, 22, 45, 68, 90].map((deg) => {
        const rad = deg * Math.PI / 180;
        const x2 = Math.cos(rad) * 56;
        const y2 = Math.sin(rad) * 56;
        return <line key={deg} x1="0" y1="0" x2={x2} y2={y2} stroke="var(--text-mute)" strokeWidth="0.5" />;
      })}
      {/* Arcs */}
      {[18, 30, 44].map((r) => (
        <g key={r}>
          {[10, 33, 55, 78].map((deg) => {
            const a1 = deg * Math.PI / 180;
            const a2 = (deg + 22) * Math.PI / 180;
            return <line key={deg} x1={Math.cos(a1) * r} y1={Math.sin(a1) * r} x2={Math.cos(a2) * r} y2={Math.sin(a2) * r} stroke="var(--text-mute)" strokeWidth="0.5" />;
          })}
        </g>
      ))}
      {/* Tiny spider */}
      <rect x="22" y="22" width="2" height="2" fill="var(--blood)" />
      <rect x="20" y="20" width="1" height="1" fill="var(--blood)" />
      <rect x="25" y="20" width="1" height="1" fill="var(--blood)" />
    </svg>
  );
}

// ── Crimson: dripping wax ──────────────────────────────────────
function DrippingWax({ height = 24 }) {
  return (
    <svg width="100%" height={height} viewBox={`0 0 200 ${height}`} preserveAspectRatio="none">
      <path d={`M 0 0 L 200 0 L 200 4 ${
        Array.from({ length: 12 }).map((_, i) => {
          const x = (i + 0.5) * (200 / 12);
          const h = 6 + Math.abs(Math.sin(i * 1.7)) * (height - 8);
          return `L ${x - 4} 4 L ${x - 3} ${h} L ${x + 3} ${h} L ${x + 4} 4 `;
        }).join('')
      } L 0 4 Z`} fill="var(--blood)" />
      {/* Highlights */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = (i + 0.5) * (200 / 12);
        return <rect key={i} x={x - 1} y="6" width="1" height="3" fill="var(--blood-bright)" opacity=".6" />;
      })}
    </svg>
  );
}

// ── Crimson: cracked glass overlay ─────────────────────────────
function CrackedGlass() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .35,
    }}>
      <g stroke="var(--blood)" strokeWidth="0.5" fill="none">
        <path d="M 50 0 L 150 80 L 220 60 L 300 140 L 280 220 L 360 300" />
        <path d="M 150 80 L 80 130 L 100 200 L 40 240" />
        <path d="M 220 60 L 250 30 L 320 50 M 220 60 L 280 110 L 330 100" />
        <path d="M 300 140 L 380 130 M 280 220 L 200 270 L 130 290" />
      </g>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION E · THEMED BOARD PREVIEWS
// Four mini boards, one per theme, each with its appropriate
// decoration slot filled and its edge ornaments applied.
// ════════════════════════════════════════════════════════════════

function ThemedBoardPreview({ theme = 'hearth', label, clockMode = 'live', clockStyle }) {
  // Render scoped under the theme class so theme tokens apply
  const themeClass = theme === 'hearth' ? '' : `theme-${theme}`;
  const SCENES = ['Approach', theme === 'crimson' ? 'The Mansion' : theme === 'neon' ? 'Hangar B' : theme === 'verdant' ? 'The Glade' : 'The Tavern', 'Combat', 'Aftermath'];

  // Per-theme PAD subset
  const PADS = {
    hearth: [
      { type: 'single', t: 'Door',  k: 'F1' },
      { type: 'loop',   t: 'Rain',  k: 'F2', hot: true },
      { type: 'loop',   t: 'Fire',  k: 'F3', hot: true },
      { type: 'single', t: 'Sword', k: 'F4' },
      { type: 'single', t: 'Coin',  k: 'F5' },
      { type: 'combo',  t: 'Reveal',k: 'F6' },
    ],
    verdant: [
      { type: 'loop',   t: 'Forest',  k: 'F1', hot: true },
      { type: 'single', t: 'Owl',    k: 'F2' },
      { type: 'loop',   t: 'Stream', k: 'F3' },
      { type: 'single', t: 'Branch', k: 'F4' },
      { type: 'playlist', t: 'Druid', k: 'F5' },
      { type: 'combo',  t: 'Spell',  k: 'F6' },
    ],
    neon: [
      { type: 'loop',   t: 'Hum',     k: 'F1', hot: true },
      { type: 'single', t: 'Alert',   k: 'F2' },
      { type: 'loop',   t: 'Engine',  k: 'F3' },
      { type: 'single', t: 'Blip',    k: 'F4' },
      { type: 'playlist', t: 'Sync',  k: 'F5' },
      { type: 'combo',  t: 'Boot',    k: 'F6' },
    ],
    crimson: [
      { type: 'loop',   t: 'Whisper', k: 'F1', hot: true },
      { type: 'single', t: 'Scream',  k: 'F2' },
      { type: 'loop',   t: 'Heart',   k: 'F3', hot: true },
      { type: 'single', t: 'Crash',   k: 'F4' },
      { type: 'playlist', t: 'Chant', k: 'F5' },
      { type: 'combo',  t: 'Ritual',  k: 'F6' },
    ],
  };

  const renderClock = () => {
    const style = clockStyle || (
      theme === 'neon' ? 'digital' :
      theme === 'crimson' ? 'gothic' :
      theme === 'verdant' ? 'standing' : 'pocket'
    );
    if (style === 'pocket')   return <PocketWatch  mode={clockMode} size={84} />;
    if (style === 'standing') return <StandingClock mode={clockMode} height={170} />;
    if (style === 'digital')  return <DigitalClock  mode={clockMode} />;
    if (style === 'gothic')   return <GothicClock   mode={clockMode} height={170} />;
  };

  return (
    <div className={themeClass} style={{ height: '100%' }}>
      <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        {/* Theme-specific overlay decorations */}
        {theme === 'crimson' && <CrackedGlass />}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px',
          background: 'var(--deep)',
          borderBottom: '1px solid var(--gold-dim)',
        }}>
          <PixelIcon name="flame" size={14} color="var(--flame)" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.1em' }}>
            {label}
          </span>
          <div style={{ flex: 1 }} />
          <span className="sb-mode-badge is-game" style={{ fontSize: 9 }}>GAME</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr 130px', flex: 1, minHeight: 0 }}>
          {/* Sidebar with scenes + decoration slot */}
          <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', marginBottom: 6 }}>SCENES</div>
              {SCENES.map((s, i) => (
                <div key={s} style={{
                  padding: '4px 6px',
                  background: i === 1 ? 'var(--top)' : 'transparent',
                  borderLeft: i === 1 ? '2px solid var(--gold)' : '2px solid transparent',
                  fontFamily: 'var(--font-ui)', fontSize: 11,
                  color: i === 1 ? 'var(--gold)' : 'var(--text-dim)',
                  letterSpacing: '.04em',
                }}>{s}</div>
              ))}
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
              {renderClock()}
            </div>
          </aside>

          {/* Pad grid */}
          <main style={{
            position: 'relative',
            background: theme === 'crimson'
              ? 'radial-gradient(70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,.4) 100%), var(--surface)'
              : 'var(--surface)',
            padding: 14,
            overflow: 'hidden',
          }}>
            {/* Theme-specific ambience */}
            {theme === 'hearth'  && <HearthGlow intensity={1} />}
            {theme === 'hearth'  && <AmbientEmbers density={12} />}
            {theme === 'verdant' && <AmbientEmbers density={10} color="#5fc88f" />}
            {theme === 'neon'    && <AmbientEmbers density={14} color="var(--pad-loop)" />}

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {PADS[theme].map((p) => (
                <div key={p.t} className={'sb-pad' + (p.hot ? ' is-hot' : '')} data-type={p.type} style={{
                  '--pad-color': `var(--pad-${p.type})`,
                  '--pad-glow':  `var(--pad-${p.type}-glow)`,
                  minHeight: 64,
                }}>
                  <span className="sb-pad-key" style={{ fontSize: 9 }}>{p.k}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4 }}>
                    <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={10} color={`var(--pad-${p.type})`} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text)', letterSpacing: '.04em', paddingLeft: 4 }}>{p.t}</div>
                </div>
              ))}
            </div>
          </main>

          {/* Theme-specific edge ornament rail */}
          <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 6px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.14em', marginBottom: 10 }}>MIXER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%', alignItems: 'center' }}>
              <MiniMeter color="var(--pad-loop)" value={0.6} />
              {(theme === 'crimson') && <MiniMeter color="var(--pad-loop)" value={0.7} />}
              <MiniMeter color="var(--gold)" value={0.72} />
            </div>

            {/* Theme ornaments at the bottom */}
            <div style={{ flex: 1 }} />
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: '6px 0' }}>
              {theme === 'hearth'  && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  <Candle height={28} />
                  <Candle height={40} />
                </div>
              )}
              {theme === 'verdant' && <MushroomCluster />}
              {theme === 'neon'    && <LEDPanel />}
              {theme === 'crimson' && <DrippingWax height={20} />}
            </div>

            {/* Floating ornaments — vines or circuits along the edge */}
            {theme === 'verdant' && (
              <div style={{ position: 'absolute', top: 0, right: -4, bottom: 0, pointerEvents: 'none' }}>
                <HangingVine height={240} />
              </div>
            )}
            {theme === 'neon' && (
              <div style={{ position: 'absolute', top: 0, right: -2, bottom: 0, pointerEvents: 'none' }}>
                <CircuitTrace height={240} />
              </div>
            )}
            {theme === 'crimson' && (
              <div style={{ position: 'absolute', top: 0, right: 0, pointerEvents: 'none' }}>
                <Cobweb size={48} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function MiniMeter({ color, value }) {
  return (
    <div style={{ width: 90, height: 6, background: 'var(--sunk)', border: '1px solid var(--border-soft)' }}>
      <div style={{ width: `${value * 100}%`, height: '100%', background: color, boxShadow: `0 0 4px ${color}` }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// THE ARTBOARD — full presentation
// ════════════════════════════════════════════════════════════════
function ClockAndThemesArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>Clock Widget &amp; Themed Ornaments</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // a selectable decoration slot in the sidebar — live time or countdown.<br/>
          // countdown mode fires a chosen PAD on zero. each theme picks its own clock style + edge ornaments.
        </div>
      </div>

      {/* The four clocks side-by-side */}
      <SectionLabel glyph="hourglass">FOUR CLOCK STYLES · LIVE MODE</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <ClockCard theme="hearth"  title="POCKET WATCH"   sub="Hearth · default"
          accent="var(--gold)">      <PocketWatch  /></ClockCard>
        <ClockCard theme="verdant" title="STANDING CLOCK" sub="Verdant · D&D"
          accent="#C9A04F">          <StandingClock /></ClockCard>
        <ClockCard theme="neon"    title="DIGITAL READOUT" sub="Neon · sci-fi"
          accent="var(--pad-loop)">  <DigitalClock /></ClockCard>
        <ClockCard theme="crimson" title="GOTHIC PENDULUM" sub="Crimson · horror"
          accent="var(--blood)">     <GothicClock /></ClockCard>
      </div>

      {/* Same four — countdown mode firing a PAD */}
      <SectionLabel glyph="sparkle">SAME CLOCKS · COUNTDOWN MODE — FIRES A PAD ON ZERO</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
        <ClockCard theme="hearth"  accent="var(--gold)">     <PocketWatch  mode="countdown" remaining={184} padName="BELL TOLL" /></ClockCard>
        <ClockCard theme="verdant" accent="#C9A04F">         <StandingClock mode="countdown" remaining={160} padName="WOLF HOWL" /></ClockCard>
        <ClockCard theme="neon"    accent="var(--pad-loop)"> <DigitalClock mode="countdown" remaining={220} padName="SYS ALERT" /></ClockCard>
        <ClockCard theme="crimson" accent="var(--blood)">    <GothicClock  mode="countdown" remaining={24}  padName="HEART STOP" /></ClockCard>
      </div>
      <div className="sb-mono" style={{ fontSize: 12, marginBottom: 28 }}>
        // last one is &lt; 30s — note the red "danger" tint pulled from the theme's blood/red token.<br/>
        // every clock shows the chip with the PAD that will fire when it reaches zero.
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="cog">CONFIGURING A COUNTDOWN</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'flex-start', marginBottom: 28 }}>
        <CountdownConfigPanel />
        <div className="sb-mono" style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, paddingTop: 8 }}>
          Right-click the clock → SET COUNTDOWN.<br/>
          Pick a duration preset or type a custom one.<br/>
          Choose any PAD on the current board to fire — or set "none" for a silent timer.<br/>
          The clock face shows a progress arc filling clockwise; at 30 s left, it pulses red.<br/>
          <br/>
          <span style={{ color: 'var(--gold)' }}>// use cases</span><br/>
          ▸ session length tracking — "fire the warm wrap-up music after 3 h"<br/>
          ▸ encounter pacing — "summon the boss in 2 min if they don't solve the puzzle"<br/>
          ▸ short-rest realism — "the campfire lasts 1 hr in-game · then ambient stops"<br/>
          ▸ ritual countdowns — "the spell finishes in 30 s · fire the EXPLOSION pad"
        </div>
      </div>

      <PixelDivider glyph="sparkle" />

      <SectionLabel glyph="potion">SIDEBAR DECORATION PICKER — THEME-AWARE</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        // each theme exposes only the decorations that fit its vocabulary. The picker swaps when the theme swaps.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <div className="theme-hearth">
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.16em', marginBottom: 6 }}>HEARTH</div>
          <DecorationPicker theme="hearth" />
        </div>
        <div className="theme-verdant">
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#ACB5A6', letterSpacing: '.16em', marginBottom: 6 }}>VERDANT</div>
          <DecorationPicker theme="verdant" selected="vines" />
        </div>
        <div className="theme-neon">
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#9DB5D6', letterSpacing: '.16em', marginBottom: 6 }}>NEON</div>
          <DecorationPicker theme="neon" selected="digital" />
        </div>
        <div className="theme-crimson">
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#C09A95', letterSpacing: '.16em', marginBottom: 6 }}>CRIMSON</div>
          <DecorationPicker theme="crimson" selected="gothic-clock" />
        </div>
      </div>

      <PixelDivider glyph="rune" />

      <SectionLabel glyph="star">FOUR THEMED BOARDS — EACH WITH ITS OWN ATMOSPHERE</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ height: 380, border: '1px solid var(--border)' }}><ThemedBoardPreview theme="hearth"  label="HEARTH · pocket watch + candles" /></div>
        <div style={{ height: 380, border: '1px solid var(--border)' }}><ThemedBoardPreview theme="verdant" label="VERDANT · standing clock + vines + mushrooms" /></div>
        <div style={{ height: 380, border: '1px solid var(--border)' }}><ThemedBoardPreview theme="neon"    label="NEON · digital readout + circuits + LEDs" /></div>
        <div style={{ height: 380, border: '1px solid var(--border)' }}><ThemedBoardPreview theme="crimson" label="CRIMSON · gothic pendulum + cobweb + wax + cracks" /></div>
      </div>

      <SectionLabel glyph="diamond">WHAT EACH THEME GETS</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <ThemeOrnamentSummary
          name="HEARTH" color="var(--gold)"
          clock="Pocket watch · Standing clock"
          ornaments={['Candles (1–3 stack)', 'Hearth glow', 'Ambient embers', 'Stage corner brackets']}
          banned={['Cobwebs', 'Circuits', 'Vines']}
        />
        <ThemeOrnamentSummary
          name="VERDANT" color="#4FA67A"
          clock="Standing clock · Cuckoo clock"
          ornaments={['Hanging vines', 'Mushroom clusters', 'Leaf-drift particles', 'Acorn corner motif']}
          banned={['Candles', 'Cobwebs', 'Circuits', 'Cracked glass']}
        />
        <ThemeOrnamentSummary
          name="NEON" color="var(--pad-loop)"
          clock="Digital readout"
          ornaments={['Circuit traces', 'LED indicator panel', 'Scanline overlay', 'Terminal status text']}
          banned={['Candles', 'Vines', 'Wax', 'Mushrooms']}
        />
        <ThemeOrnamentSummary
          name="CRIMSON" color="var(--blood)"
          clock="Gothic pendulum"
          ornaments={['Cobwebs (corner)', 'Cracked glass overlay', 'Dripping wax (top edge)', 'Raven silhouette']}
          banned={['Candles (or only extinguished)', 'Circuits', 'Vines', 'Mushrooms']}
        />
      </div>

      <div style={{ height: 18 }} />
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        // ornaments are scoped via the theme class — switching themes swaps the decoration vocabulary.<br/>
        // the user's selected ornament slot persists per-theme: pick "Pocket watch" in Hearth and<br/>
        // "Digital readout" in Neon — each remembers its own choice.
      </div>
    </div>
  );
}

function ClockCard({ theme, title, sub, accent, children }) {
  return (
    <div className={theme === 'hearth' ? '' : `theme-${theme}`}>
      <div style={{
        padding: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${accent}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        minHeight: 280,
      }}>
        {title && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: accent, letterSpacing: '.14em' }}>{title}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{sub}</div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{children}</div>
      </div>
    </div>
  );
}

function ThemeOrnamentSummary({ name, color, clock, ornaments, banned }) {
  return (
    <div style={{
      padding: 12,
      background: 'var(--raised)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color, letterSpacing: '.12em', marginBottom: 8 }}>{name}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', marginBottom: 3 }}>CLOCK</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', marginBottom: 8 }}>{clock}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', marginBottom: 3 }}>ORNAMENTS</div>
      <ul style={{ margin: 0, padding: '0 0 0 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>
        {ornaments.map((o) => <li key={o}>{o}</li>)}
      </ul>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', marginTop: 10, marginBottom: 3 }}>NEVER USE</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', fontStyle: 'italic', lineHeight: 1.4 }}>
        {banned.join(' · ')}
      </div>
    </div>
  );
}

Object.assign(window, {
  PocketWatch, StandingClock, DigitalClock, GothicClock,
  CountdownConfigPanel, DecorationPicker,
  HangingVine, MushroomCluster, CircuitTrace, LEDPanel, Cobweb, DrippingWax, CrackedGlass,
  ThemedBoardPreview, ClockAndThemesArtboard,
});
