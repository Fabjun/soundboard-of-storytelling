// v12-clock-magic.jsx — Three things:
//   A · Easter eggs when you click a clock a lot
//   B · Cinematic moments when a countdown hits zero
//   C · Clock display toggle in Settings → Display (every clock can
//       be hidden entirely, or restricted to live / countdown only)

// ════════════════════════════════════════════════════════════════
// A · EASTER EGGS — tap counter unlocks behaviour
// ════════════════════════════════════════════════════════════════
// 3 taps  · clock chimes (sound + brief glow pulse)
// 5 taps  · hour hand spins playfully then settles
// 7 taps  · the clock face cracks (pixel-art crack overlay)
// 10 taps · "out of order" — clock goes dark with a flickering LED
// 13 taps · ravens fly out of the standing clock (Hearth/Verdant)
// 20 taps · tiny imp / cog-spirit pokes its head out the dial
// 30 taps · "STOP TOUCHING ME" message in the GM's chosen language
// Resets after 10s of inactivity OR when the GM hits SAVE.

const EASTER_EGGS = [
  { taps: 3,  name: 'CHIME',          desc: 'The clock chimes once — gold halo flashes, soft bell sound.' },
  { taps: 5,  name: 'HAND SPIN',      desc: 'Hour hand twirls 720° then settles — playful, harmless.' },
  { taps: 7,  name: 'CRACK',          desc: 'Pixel-art crack snakes across the dial. Heals after 10 s.' },
  { taps: 10, name: 'OUT OF ORDER',   desc: 'Dial goes dark · "OUT OF ORDER" sign drops down · LED flickers.' },
  { taps: 13, name: 'RAVENS',         desc: 'Three pixel ravens fly out of the clock case and off-screen.' },
  { taps: 20, name: 'IMP / SPIRIT',   desc: 'Tiny clockwork imp pokes its head from behind the dial and waves.' },
  { taps: 30, name: 'WORD',           desc: '"Stop touching me." — flashes once · resets the counter.' },
];

function EasterEggTable() {
  return (
    <div style={{
      background: 'var(--raised)',
      border: '1px solid var(--gold-dim)',
    }}>
      {EASTER_EGGS.map((e, i) => (
        <div key={e.taps} style={{
          display: 'grid', gridTemplateColumns: '52px 1fr',
          gap: 12, alignItems: 'center',
          padding: '8px 12px',
          borderBottom: i === EASTER_EGGS.length - 1 ? 'none' : '1px solid var(--border-soft)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 14,
            color: 'var(--gold-bright)', textAlign: 'right',
          }}>{e.taps}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginLeft: 4 }}>tap</span></div>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.12em' }}>{e.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4, marginTop: 2 }}>{e.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Animated previews for each easter egg ───────────────────────
function EggChimeDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{
        position: 'absolute', width: 130, height: 130,
        background: 'radial-gradient(circle, var(--gold-bright) 0%, transparent 60%)',
        opacity: .5, top: -4, left: '50%', transform: 'translateX(-50%)',
        animation: 'sb-egg-chime 1.8s ease-in-out infinite',
      }} />
      <PocketWatch mode="live" size={100} />
      <style>{`
        @keyframes sb-egg-chime {
          0%, 100% { opacity: 0; transform: translateX(-50%) scale(.5); }
          15%      { opacity: .8; transform: translateX(-50%) scale(1.2); }
          40%      { opacity: .3; transform: translateX(-50%) scale(1.4); }
          70%      { opacity: 0;  transform: translateX(-50%) scale(1.6); }
        }
      `}</style>
    </div>
  );
}

function EggHandSpinDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 12 }}>
      <svg width="100" height="100" viewBox="0 0 64 64">
        {pixelCircle(32, 32, 30, 'var(--gold)', 2)}
        <rect x="4" y="4" width="56" height="56" fill="var(--sunk)" />
        {pixelCircle(32, 32, 26, 'var(--surface)', null, true)}
        <g transform="rotate(0 32 32)" style={{ animation: 'sb-egg-spin 2.5s ease-out infinite' }}>
          <rect x="31" y="16" width="2" height="17" fill="var(--gold-bright)" />
        </g>
        <rect x="30" y="30" width="4" height="4" fill="var(--gold)" />
      </svg>
      <style>{`@keyframes sb-egg-spin { 0% { transform: rotate(0deg); } 70% { transform: rotate(720deg); } 100% { transform: rotate(685deg); } }`}</style>
    </div>
  );
}

function EggCrackDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 12 }}>
      <PocketWatch mode="live" size={100} />
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', top: 12, pointerEvents: 'none' }}>
        <g stroke="var(--blood)" strokeWidth="1.2" fill="none" style={{ animation: 'sb-crack-grow 2.2s ease-out infinite' }}>
          <path d="M 35 25 L 48 38 L 42 50 L 55 58 L 50 70" />
          <path d="M 48 38 L 60 30" />
          <path d="M 42 50 L 30 52" />
          <path d="M 55 58 L 68 62" />
        </g>
      </svg>
      <style>{`@keyframes sb-crack-grow { 0% { stroke-dasharray: 0 100; opacity: 0; } 30% { opacity: 1; } 100% { stroke-dasharray: 100 0; opacity: .8; } }`}</style>
    </div>
  );
}

function EggOutOfOrderDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
      <div style={{ position: 'relative', filter: 'brightness(.3)' }}>
        <PocketWatch mode="live" size={100} />
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(-8deg)',
        padding: '4px 10px',
        background: 'var(--sunk)',
        border: '1px solid var(--blood)',
        color: 'var(--blood-bright)',
        fontFamily: 'var(--font-ui)', fontSize: 9,
        letterSpacing: '.16em',
      }}>OUT OF ORDER</div>
      <span style={{
        position: 'absolute', top: 18, right: 16,
        width: 6, height: 6, background: 'var(--blood-bright)',
        animation: 'sb-led-flicker-bad 0.4s steps(1) infinite',
      }} />
      <style>{`@keyframes sb-led-flicker-bad { 0%, 60% { opacity: 1; } 30%, 100% { opacity: 0; } }`}</style>
    </div>
  );
}

function EggRavensDemo() {
  return (
    <div style={{ position: 'relative', height: 120, padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PocketWatch mode="live" size={90} />
      </div>
      {[0, 1, 2].map((i) => (
        <svg key={i} width="12" height="9" viewBox="0 0 12 9" style={{
          position: 'absolute',
          top: 40, left: '50%',
          color: 'var(--text)',
          animation: `sb-raven-fly-${i} 3s linear infinite`,
        }}>
          <path d="M 0 4 L 3 0 L 6 4 L 9 0 L 12 4 L 9 8 L 6 4 L 3 8 Z" fill="currentColor" />
        </svg>
      ))}
      <style>{`
        @keyframes sb-raven-fly-0 { 0%   { transform: translate(0, 0)         scale(.5); opacity: 0; }
                                    20%  { opacity: 1; }
                                    100% { transform: translate(-80px, -50px) scale(1.2); opacity: 0; } }
        @keyframes sb-raven-fly-1 { 0%   { transform: translate(0, 0)         scale(.5); opacity: 0; }
                                    20%  { transform: translate(20px, -10px); opacity: 1; }
                                    100% { transform: translate(100px, -60px) scale(1.2); opacity: 0; } }
        @keyframes sb-raven-fly-2 { 0%   { transform: translate(0, 0)         scale(.5); opacity: 0; }
                                    25%  { opacity: 1; }
                                    100% { transform: translate(0,    -90px)  scale(1.4); opacity: 0; } }
      `}</style>
    </div>
  );
}

function EggImpDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 12 }}>
      <PocketWatch mode="live" size={100} />
      {/* Imp peeking from behind */}
      <div style={{
        position: 'absolute', top: 22, left: '50%',
        width: 14, height: 14, transform: 'translate(-50%, 0)',
        animation: 'sb-imp-peek 3s ease-in-out infinite',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14">
          {/* head */}
          <rect x="3" y="5" width="8" height="6" fill="var(--blood)" />
          <rect x="2" y="3" width="3" height="3" fill="var(--blood)" />
          <rect x="9" y="3" width="3" height="3" fill="var(--blood)" />
          {/* eyes */}
          <rect x="4" y="7" width="2" height="2" fill="var(--gold-bright)" />
          <rect x="8" y="7" width="2" height="2" fill="var(--gold-bright)" />
          {/* grin */}
          <rect x="5" y="10" width="4" height="1" fill="#000" />
        </svg>
      </div>
      <style>{`@keyframes sb-imp-peek { 0%, 40% { transform: translate(-50%, 30px); opacity: 0; } 50%, 70% { transform: translate(-50%, 0); opacity: 1; } 80%, 100% { transform: translate(-50%, 30px); opacity: 0; } }`}</style>
    </div>
  );
}

function EggWordDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 12 }}>
      <PocketWatch mode="live" size={100} />
      <div style={{
        position: 'absolute', bottom: 14, left: '50%',
        transform: 'translateX(-50%)',
        padding: '4px 10px',
        background: 'var(--sunk)',
        border: '1px solid var(--gold)',
        color: 'var(--gold-bright)',
        fontFamily: 'var(--font-ui)', fontSize: 10,
        letterSpacing: '.14em',
        whiteSpace: 'nowrap',
        animation: 'sb-word-flash 2.4s ease-in-out infinite',
      }}>STOP TOUCHING ME</div>
      <style>{`@keyframes sb-word-flash { 0%, 60% { opacity: 0; transform: translate(-50%, 8px); } 70%, 90% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; } }`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// B · COUNTDOWN ZERO MOMENT
// When a countdown reaches 0, three things happen simultaneously:
//   1. The PAD fires (existing behavior).
//   2. A "ZERO MOMENT" — short cinematic flourish on the clock.
//   3. A small status toast across the top: "↳ BELL TOLL fired · 21:42".
//
// The flourish shape depends on the clock style:
//   Pocket watch  → hands explode into pixel sparks · cover snaps shut
//   Standing      → pendulum freezes mid-swing · bell pulse · 1 chime
//   Digital       → screen flashes white · "EXEC" stamp · brief glitch
//   Gothic        → blade pendulum drops · puff of smoke · "TIME"
// ════════════════════════════════════════════════════════════════

const ZERO_MOMENTS = [
  ['Pocket Watch', 'Hour & minute hands explode into pixel sparks · cover snaps shut · gold chime ring expands outward.'],
  ['Standing Clock', 'Pendulum freezes mid-swing · 1 deep bell pulse (radial wave) · case door creaks open and shut.'],
  ['Digital Readout', 'Display flashes white · "EXEC" stamp in monospace · brief CRT glitch · LED stays red for 3 s.'],
  ['Gothic Pendulum', 'Blade-pendulum drops · puff of pixel smoke at the foot · word "TIME" appears for 1 s then fades.'],
];

function ZeroMomentPocketDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 12 }}>
      <PocketWatch mode="live" size={100} />
      {/* sparks */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          position: 'absolute', top: 50, left: '50%',
          width: 3, height: 3,
          background: i % 2 ? 'var(--gold-bright)' : 'var(--flame)',
          animation: `sb-spark-${i} 1.8s ease-out infinite`,
        }} />
      ))}
      {/* expanding chime ring */}
      <div style={{
        position: 'absolute', top: 50, left: '50%',
        width: 4, height: 4,
        border: '2px solid var(--gold-bright)',
        borderRadius: '50%',
        animation: 'sb-chime-ring 1.8s ease-out infinite',
      }} />
      <style>{`
        ${[0,1,2,3,4,5].map((i) => {
          const angle = i * 60;
          const dx = Math.round(Math.cos(angle * Math.PI / 180) * 50);
          const dy = Math.round(Math.sin(angle * Math.PI / 180) * 50);
          return `@keyframes sb-spark-${i} { 0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(${dx}px, ${dy}px); opacity: 0; } }`;
        }).join('\n')}
        @keyframes sb-chime-ring { 0% { width: 4px; height: 4px; opacity: 1; transform: translate(-50%, -50%); }
                                   100% { width: 140px; height: 140px; opacity: 0; transform: translate(-50%, -50%); } }
      `}</style>
    </div>
  );
}

function ZeroMomentDigitalDemo() {
  return (
    <div style={{ position: 'relative', padding: 8, display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', animation: 'sb-glitch 1.4s steps(4) infinite' }}>
        <DigitalClock mode="countdown" remaining={0} padName="SYS ALERT" />
      </div>
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(-6deg)',
        padding: '3px 10px',
        background: 'var(--blood)',
        color: '#fff',
        fontFamily: 'var(--font-display)', fontSize: 12,
        letterSpacing: '.08em',
        animation: 'sb-exec-stamp 1.6s ease-out infinite',
      }}>EXEC</div>
      <style>{`
        @keyframes sb-glitch  { 0%, 100% { transform: none; } 25% { transform: translateX(-2px); } 50% { transform: translateX(2px); filter: hue-rotate(20deg); } 75% { transform: translateX(-1px); } }
        @keyframes sb-exec-stamp { 0% { opacity: 0; transform: translate(-50%, -50%) rotate(-6deg) scale(2.5); }
                                    20% { opacity: 1; transform: translate(-50%, -50%) rotate(-6deg) scale(1); }
                                    100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

function ZeroMomentGothicDemo() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 6 }}>
      <GothicClock mode="live" height={170} />
      {/* puff of smoke */}
      <div style={{
        position: 'absolute', bottom: 22, left: '50%',
        width: 24, height: 24,
        transform: 'translateX(-50%)',
        background: 'radial-gradient(circle, rgba(160,40,40,.6) 0%, transparent 70%)',
        animation: 'sb-smoke 2s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '46%', left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'var(--blood-bright)',
        fontFamily: 'var(--font-display)', fontSize: 14,
        letterSpacing: '.12em',
        animation: 'sb-word-flash 2s ease-in-out infinite',
      }}>TIME</div>
      <style>{`
        @keyframes sb-smoke { 0% { opacity: 0; transform: translateX(-50%) scale(.3); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) scale(2) translateY(-30px); } }
      `}</style>
    </div>
  );
}

function ZeroToastDemo() {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--raised)',
      border: '1px solid var(--gold)',
      borderLeft: '3px solid var(--pad-single)',
      boxShadow: '0 4px 12px rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', gap: 12,
      maxWidth: 380,
    }}>
      <PixelIcon name="hourglass" size={16} color="var(--gold-bright)" />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.1em' }}>
          COUNTDOWN ZERO · ↳ BELL TOLL
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
          fired automatically · 21:42 · 5 min countdown ended
        </div>
      </div>
      <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px', fontSize: 10 }}>UNDO</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// C · SETTINGS TOGGLE — Display submenu integration
// ════════════════════════════════════════════════════════════════
function ClockSettingsBlock() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        padding: '10px 14px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <PixelIcon name="hourglass" size={12} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.14em' }}>CLOCK</span>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SettingRow
          label="Show clock"
          desc="Hides the clock entirely. The decoration slot stays available for candles, vines, etc."
          control={<SegmentedControl options={['ON', 'OFF']} active="ON" />}
        />
        <SettingRow
          label="Style"
          desc="Theme-aware — only styles that fit the current theme are shown."
          control={<SegmentedControl options={['POCKET', 'STAND', 'DIGITAL', 'GOTHIC']} active="POCKET" />}
        />
        <SettingRow
          label="Display modes"
          desc="LIVE — current time. COUNTDOWN — timer that fires a PAD on zero. Hide one if you only need the other."
          control={
            <div style={{ display: 'flex', gap: 4 }}>
              <span className="sb-pill is-on" style={{ fontSize: 9 }}>LIVE</span>
              <span className="sb-pill is-on" style={{ fontSize: 9 }}>COUNTDOWN</span>
            </div>
          }
        />
        <SettingRow
          label="Easter eggs"
          desc='Tap the clock repeatedly to trigger little surprises. Set "off" for serious sessions; "subtle" hides ravens / imp / OUT-OF-ORDER.'
          control={<SegmentedControl options={['OFF', 'SUBTLE', 'FULL']} active="FULL" />}
        />
        <SettingRow
          label="Zero-moment flourish"
          desc="The cinematic moment when a countdown hits zero. Off plays only the PAD; on adds the visual flourish + toast."
          control={<SegmentedControl options={['OFF', 'TOAST', 'FULL']} active="FULL" />}
        />
        <SettingRow
          label="Chime sound"
          desc="Optional bell on countdown zero AND on the 3-tap easter egg. Uses any PAD from your library."
          control={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>bell deep</span>
              <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>↻</button>
            </div>
          }
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// THE ARTBOARD
// ════════════════════════════════════════════════════════════════
function ClockMagicArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>Clock · Magic Moments</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // easter eggs (tap counter), cinematic countdown-zero moment, full toggle in Display settings.
        </div>
      </div>

      <SectionLabel glyph="sparkle">A · TAP MEMORY — SECRETS UNLOCKED BY REPEAT CLICKING</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6 }}>
        // every theme's clock keeps its own tap counter, reset after 10 s of silence or on SAVE.<br/>
        // works on every clock style; visuals are adapted to fit (e.g. the gothic clock cracks bleed red).
      </div>

      <EasterEggTable />

      <div style={{ height: 18 }} />
      <SectionLabel glyph="diamond">A2 · ANIMATED PREVIEWS — ONE PER MILESTONE</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 24 }}>
        <EggCard taps={3}  name="CHIME"        ><EggChimeDemo /></EggCard>
        <EggCard taps={5}  name="HAND SPIN"    ><EggHandSpinDemo /></EggCard>
        <EggCard taps={7}  name="CRACK"        ><EggCrackDemo /></EggCard>
        <EggCard taps={10} name="OUT OF ORDER" ><EggOutOfOrderDemo /></EggCard>
        <EggCard taps={13} name="RAVENS"       ><EggRavensDemo /></EggCard>
        <EggCard taps={20} name="IMP PEEKS"    ><EggImpDemo /></EggCard>
        <EggCard taps={30} name="WORD"         ><EggWordDemo /></EggCard>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="hourglass">B · ZERO MOMENT — WHEN THE COUNTDOWN HITS 0:00</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.6 }}>
        // three things happen simultaneously:<br/>
        // ① the PAD fires (existing behaviour)<br/>
        // ② a "zero moment" cinematic flourish on the clock — shape depends on clock style<br/>
        // ③ a toast notification at the top of the workspace · UNDO available for 5 s
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {ZERO_MOMENTS.map(([clock, desc]) => (
          <div key={clock} style={{
            padding: '10px 14px',
            background: 'var(--raised)',
            borderLeft: '3px solid var(--gold)',
          }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.1em', marginBottom: 4 }}>{clock}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <SectionLabel glyph="star">B2 · ANIMATED PREVIEWS</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <ZeroCard title="Pocket watch · sparks + chime ring"><ZeroMomentPocketDemo /></ZeroCard>
        <ZeroCard title="Digital · glitch + EXEC stamp"><ZeroMomentDigitalDemo /></ZeroCard>
        <ZeroCard title="Gothic · smoke + TIME word"><ZeroMomentGothicDemo /></ZeroCard>
      </div>

      <SectionLabel glyph="info">B3 · TOAST NOTIFICATION</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 24px' }}>
        <ZeroToastDemo />
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="cog">C · SETTINGS · DISPLAY → CLOCK</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.6 }}>
        // a new block inside Settings → Display. Six controls: show/hide, style, modes, eggs, zero-moment, chime sound.
      </div>
      <ClockSettingsBlock />
    </div>
  );
}

function EggCard({ taps, name, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderTop: '2px solid var(--gold-dim)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ background: 'var(--night)', overflow: 'hidden' }}>{children}</div>
      <div style={{
        padding: '6px 8px', textAlign: 'center',
        fontFamily: 'var(--font-ui)', fontSize: 10,
        color: 'var(--gold)', letterSpacing: '.12em',
        borderTop: '1px solid var(--border-soft)',
      }}>{taps} TAPS · {name}</div>
    </div>
  );
}
function ZeroCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--gold-dim)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ background: 'var(--night)', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      <div style={{
        padding: '6px 10px',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--text-dim)',
        borderTop: '1px solid var(--border-soft)',
      }}>{title}</div>
    </div>
  );
}

Object.assign(window, {
  ClockMagicArtboard, EasterEggTable, ClockSettingsBlock,
  EggChimeDemo, EggHandSpinDemo, EggCrackDemo, EggOutOfOrderDemo, EggRavensDemo, EggImpDemo, EggWordDemo,
  ZeroMomentPocketDemo, ZeroMomentDigitalDemo, ZeroMomentGothicDemo, ZeroToastDemo,
});
