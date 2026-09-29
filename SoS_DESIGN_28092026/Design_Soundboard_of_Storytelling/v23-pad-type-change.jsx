// v23-pad-type-change.jsx — A5 from the Slice-3 plan.
//
// "Switch pad type" is the confirm-dialog moment of the PAD Editor. The
// dialog has to do two jobs at once:
//   1. Get the user's explicit "yes, change the type"
//   2. Tell them exactly which data carries over, which migrates, and
//      which evaporates — BEFORE the click, not after the regret.
//
// The user's pre-disposition (m0064): explicit > magic. If a mapping
// is unclear, name it. Don't auto-rebuild a chain from a playlist;
// don't silently drop entries.
//
// ── Option C · the recommendation ─────────────────────────────────
// Three policies were considered:
//   A · Drop type-specific fields on switch. Clean model, punishes
//       experimentation (flip-back forces full re-entry).
//   B · Hide-but-keep all type-specific fields. Forgiving, but the
//       data model accumulates dead fields per pad — export is messy.
//   C · Per-field policy (explicit). Universal fields always survive;
//       type-specific fields migrate where the data structurally
//       maps, are dropped where it doesn't, and the source resets
//       when COMBO is the source or target.
// ──────────────────────────────────────────────────────────────────
//
// The 4 × 4 matrix below enumerates every from→to. Each cell falls
// into one of five buckets, colour-coded:
//   add     · adds defaults; nothing lost              (teal)
//   migrate · explicit field migration; nothing lost   (gold)
//   drop    · drops type-fields; source preserved       (warning)
//   lossy   · migrates first entry; drops rest          (blood-bright)
//   reset   · source/chain resets; user reconfigures    (blood)

// ── Data: transition matrix ───────────────────────────────────────
const TRANSITIONS = {
  single: {
    loop:     { kind: 'add',     verdict: 'ADD',     desc: 'Adds loop point + mode defaults.' },
    playlist: { kind: 'migrate', verdict: 'MIGRATE', desc: 'Source becomes items[0].' },
    combo:    { kind: 'reset',   verdict: 'RESET',   desc: 'Source dropped; chain starts empty.' },
  },
  loop: {
    single:   { kind: 'drop',    verdict: 'DROP',    desc: 'Drops loop point, mode, crossfade.' },
    playlist: { kind: 'migrate', verdict: 'MIGRATE', desc: 'Source → items[0]; loop fields drop.' },
    combo:    { kind: 'reset',   verdict: 'RESET',   desc: 'Source + loop drop; chain empty.' },
  },
  playlist: {
    single:   { kind: 'lossy',   verdict: 'LOSSY',   desc: 'items[0] → source; rest dropped.' },
    loop:     { kind: 'lossy',   verdict: 'LOSSY',   desc: 'items[0] → source; rest drop; add loop.' },
    combo:    { kind: 'reset',   verdict: 'RESET',   desc: 'Playlist dropped; chain empty.' },
  },
  combo: {
    single:   { kind: 'reset',   verdict: 'RESET',   desc: 'Chain dropped; pick new source.' },
    loop:     { kind: 'reset',   verdict: 'RESET',   desc: 'Chain dropped; pick new source.' },
    playlist: { kind: 'reset',   verdict: 'RESET',   desc: 'Chain dropped; playlist empty.' },
  },
};

const KIND_COLOR = {
  add:     'var(--success)',
  migrate: 'var(--gold)',
  drop:    'var(--warning)',
  lossy:   'var(--blood-bright)',
  reset:   'var(--blood)',
};

const TYPES = ['single', 'loop', 'playlist', 'combo'];

// ── Type pill ─────────────────────────────────────────────────────
function PadTypePill({ type, selected, dim, onClickGhost }) {
  return (
    <div className={'sb-pill' + (selected ? ' is-on' : '')} style={{
      fontSize: 11, padding: '3px 10px',
      color: selected ? `var(--pad-${type})` : 'var(--text-dim)',
      '--pix-border': selected ? `var(--pad-${type})` : 'var(--border-soft)',
      opacity: dim ? 0.5 : 1,
      cursor: 'pointer',
    }}>
      <span className="sb-dot" style={{ background: `var(--pad-${type})` }} />
      {type.toUpperCase()}
    </div>
  );
}

// ── Universal-fields ribbon ───────────────────────────────────────
function UniversalRibbon() {
  const fields = [
    'name', 'hotkey', 'volume',
    'fadeIn', 'fadeOut', 'outputBus',
    'color', 'icon',
  ];
  return (
    <div style={{
      background: 'var(--raised)',
      borderLeft: '3px solid var(--success)',
      padding: 'var(--space-3) var(--space-4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--success)', letterSpacing: '.10em', textTransform: 'uppercase' }}>
          UNIVERSAL FIELDS · survive every transition
        </div>
        <div style={{ flex: 1 }} />
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
          {fields.length} fields
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {fields.map(f => (
          <span key={f} className="sb-pill" style={{
            fontSize: 10, padding: '2px 8px',
            color: 'var(--success)',
            '--pix-border': 'var(--success)',
          }}>{f}</span>
        ))}
      </div>
    </div>
  );
}

// ── Matrix cell ───────────────────────────────────────────────────
function MatrixCell({ from, to }) {
  if (from === to) {
    return (
      <div style={{
        background: 'var(--sunk)',
        border: '1px dashed var(--border-soft)',
        padding: 'var(--space-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 78,
      }}>
        <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.10em' }}>
          ·
        </span>
      </div>
    );
  }
  const t = TRANSITIONS[from][to];
  const c = KIND_COLOR[t.kind];
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${c}`,
      padding: 'var(--space-2) var(--space-3)',
      minHeight: 78,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
    }}>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 11,
        color: c, letterSpacing: '.10em',
      }}>{t.verdict}</div>
      <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4 }}>
        {t.desc}
      </div>
    </div>
  );
}

// ── 4×4 matrix layout (rendered as 5×5 incl. headers) ─────────────
function TransitionMatrix() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '80px repeat(4, 1fr)',
      gap: 4,
    }}>
      {/* Top-left corner */}
      <div style={{
        background: 'var(--deep)',
        padding: 'var(--space-2)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      }}>
        <span className="sb-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.06em' }}>
          from↓ / to→
        </span>
      </div>
      {/* Top row headers */}
      {TYPES.map(t => (
        <div key={'h-' + t} style={{
          background: 'var(--deep)',
          padding: 'var(--space-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PadTypePill type={t} selected />
        </div>
      ))}
      {/* Rows */}
      {TYPES.map(from => (
        <React.Fragment key={'row-' + from}>
          <div style={{
            background: 'var(--deep)',
            padding: 'var(--space-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PadTypePill type={from} selected />
          </div>
          {TYPES.map(to => (
            <MatrixCell key={from + '-' + to} from={from} to={to} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────
function MatrixLegend() {
  const entries = [
    ['add',     'ADD',     'Adds defaults · nothing lost'],
    ['migrate', 'MIGRATE', 'Field migration · nothing lost'],
    ['drop',    'DROP',    'Some fields drop · source preserved'],
    ['lossy',   'LOSSY',   'First entry migrates · rest dropped'],
    ['reset',   'RESET',   'Source/chain resets · user reconfigures'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
      {entries.map(([k, label, sub]) => (
        <div key={k} style={{
          background: 'var(--surface)',
          borderLeft: `3px solid ${KIND_COLOR[k]}`,
          padding: 'var(--space-2) var(--space-3)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: KIND_COLOR[k], letterSpacing: '.10em' }}>
            {label}
          </div>
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4, marginTop: 2 }}>
            {sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Confirm dialog — inline, anchored to type picker ──────────────
function ConfirmDialog({ from, to, keep, migrate, drop, reset, source, accent }) {
  const t = TRANSITIONS[from][to];
  const c = accent || KIND_COLOR[t.kind];
  return (
    <div style={{
      width: 360,
      background: 'var(--raised)',
      border: '1px solid var(--border-strong)',
      borderTop: `3px solid ${c}`,
      filter: 'var(--shadow-pop)',
      padding: 'var(--space-3) var(--space-4)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: 13,
          color: 'var(--text)', letterSpacing: '.06em',
        }}>Switch to <span style={{ color: `var(--pad-${to})` }}>{to.toUpperCase()}</span>?</span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: c, letterSpacing: '.10em',
        }}>{t.verdict}</span>
      </div>

      {keep && keep.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--success)', letterSpacing: '.14em', marginBottom: 2 }}>
            ✓ KEEPS
          </div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {keep.join(', ')}
          </div>
        </div>
      )}

      {migrate && migrate.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: '.14em', marginBottom: 2 }}>
            → MIGRATES
          </div>
          {migrate.map((m, i) => (
            <div key={i} className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              {m}
            </div>
          ))}
        </div>
      )}

      {drop && drop.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blood-bright)', letterSpacing: '.14em', marginBottom: 2 }}>
            × DROPS
          </div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {drop.join(', ')}
          </div>
        </div>
      )}

      {reset && (
        <div style={{
          padding: 'var(--space-2) var(--space-3)',
          background: 'rgba(160,40,40,.10)',
          borderLeft: '2px solid var(--blood-bright)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--blood-bright)', letterSpacing: '.10em', marginBottom: 2 }}>
            ⚠ MANUAL STEP REQUIRED
          </div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {reset}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-soft)', marginTop: 'var(--space-2)' }}>
        <button className="sb-btn sb-btn-ghost" style={{ flex: 1, minHeight: 32, fontSize: 11 }}>
          CANCEL
        </button>
        <button className={'sb-btn ' + (t.kind === 'reset' ? 'sb-btn-danger' : 'sb-btn-primary')} style={{
          flex: 1, minHeight: 32, fontSize: 11,
          color: t.kind === 'reset' ? 'var(--blood-bright)' : 'var(--gold)',
        }}>
          SWITCH
        </button>
      </div>
    </div>
  );
}

// ── PAD Editor mini-mock with type picker + current dialog ─────────
function EditorMock({ currentType, targetType, dialog, height = 420 }) {
  return (
    <div style={{
      width: 420, height,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      padding: 'var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.12em' }}>
          PAD EDITOR · IDENTITY
        </span>
        <div style={{ flex: 1 }} />
        <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>Rain Heavy</span>
      </div>

      <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
        TYPE
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {TYPES.map(t => (
          <PadTypePill key={t} type={t}
            selected={t === currentType}
            dim={targetType && t !== currentType && t !== targetType}
          />
        ))}
      </div>

      {/* Faded fields below to suggest the rest of editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.4, pointerEvents: 'none' }}>
        {['Name', 'Hotkey', 'Source', 'Volume', 'Fade in / out'].map(f => (
          <div key={f} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 0',
            borderBottom: '1px dashed var(--border-soft)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', width: 90 }}>{f}</span>
            <div style={{ flex: 1, height: 16, background: 'var(--sunk)', border: '1px solid var(--border-soft)' }} />
          </div>
        ))}
      </div>

      {dialog && (
        <div style={{ position: 'absolute', left: 32, top: 86, zIndex: 5 }}>
          {dialog}
        </div>
      )}
    </div>
  );
}

// ── Dialog gallery — five canonical cases ─────────────────────────
const DIALOG_CASES = [
  {
    title: 'SINGLE → LOOP',
    sub: 'Add loop point + mode defaults · nothing lost',
    dialog: {
      from: 'single', to: 'loop',
      keep: ['name', 'hotkey', "source ('Tavern Door.wav')", 'trim', 'volume', 'fades'],
      migrate: ['Loop point auto-detected at end of trim region', 'Loop mode: seamless (default)'],
      drop: null, reset: null,
    },
  },
  {
    title: 'SINGLE → PLAYLIST',
    sub: 'Source becomes items[0] · nothing lost',
    dialog: {
      from: 'single', to: 'playlist',
      keep: ['name', 'hotkey', 'volume', 'fades'],
      migrate: ["items[0] = 'Tavern Door.wav' (the current source)", 'Add more entries via the Sound panel'],
      drop: null, reset: null,
    },
  },
  {
    title: 'LOOP → SINGLE',
    sub: 'Drop loop-specific fields · source preserved',
    dialog: {
      from: 'loop', to: 'single',
      keep: ['name', 'hotkey', "source ('Rain Heavy.wav')", 'trim', 'volume', 'fades'],
      drop: ['loop point', 'loop mode', 'crossfade'],
      migrate: null, reset: null,
    },
  },
  {
    title: 'PLAYLIST → SINGLE',
    sub: 'First entry migrates · others dropped',
    dialog: {
      from: 'playlist', to: 'single',
      keep: ['name', 'hotkey', 'volume', 'fades'],
      migrate: ["items[0] 'Rain Heavy.wav' → source"],
      drop: ['3 other entries (Wind, Crowd Murmur, Tavern Mix)', 'shuffle', 'auto-advance'],
      reset: null,
    },
  },
  {
    title: 'COMBO → LOOP',
    sub: 'Reset · chain pads cannot map to a single audio source',
    dialog: {
      from: 'combo', to: 'loop',
      keep: ['name', 'hotkey', 'volume', 'fades'],
      drop: ['4 chain pads (Boss Reveal, Door Slam, Wolf Howl, Thunder)', 'chain mode', 'inter-pad delays'],
      reset: 'Pick a new audio source after switching, or Cancel to keep the chain.',
      migrate: null,
    },
  },
];

// ── Mobile bottom-sheet equivalent ─────────────────────────────────
function MobileConfirmPhone({ caseIdx = 3 }) {
  const c = DIALOG_CASES[caseIdx];
  const d = c.dialog;
  return (
    <div style={{
      width: 300, height: 560,
      background: 'var(--night)',
      border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top + tabs */}
      <div style={{
        height: 40,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 10px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button className="sb-btn sb-btn-ghost" style={{ fontSize: 10, padding: '2px 6px' }}>← CANCEL</button>
        <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.10em', textAlign: 'center' }}>
          PAD · RAIN HEAVY
        </span>
        <button className="sb-btn sb-btn-primary" style={{ fontSize: 10, padding: '2px 6px' }}>SAVE</button>
      </div>
      {/* Faded editor */}
      <div style={{ flex: 1, padding: 10, opacity: 0.35 }}>
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', marginBottom: 4 }}>
          TYPE
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {TYPES.map(t => <PadTypePill key={t} type={t} selected={t === d.from} />)}
        </div>
        <div style={{ marginTop: 12 }}>
          {['Name', 'Hotkey', 'Source', 'Volume'].map(f => (
            <div key={f} style={{
              padding: '6px 0', borderBottom: '1px dashed var(--border-soft)',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)',
            }}>{f}</div>
          ))}
        </div>
      </div>
      {/* Bottom sheet (the confirm) */}
      <div style={{
        background: 'var(--raised)',
        borderTop: `3px solid ${KIND_COLOR[TRANSITIONS[d.from][d.to].kind]}`,
        filter: 'var(--shadow-pop)',
        padding: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <div style={{ width: 28, height: 3, background: 'var(--border-strong)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)', letterSpacing: '.06em' }}>
            Switch to <span style={{ color: `var(--pad-${d.to})` }}>{d.to.toUpperCase()}</span>?
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: KIND_COLOR[TRANSITIONS[d.from][d.to].kind], letterSpacing: '.10em' }}>
            {TRANSITIONS[d.from][d.to].verdict}
          </span>
        </div>
        {d.keep && (
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ color: 'var(--success)' }}>✓ KEEPS</span> {d.keep.join(', ')}
          </div>
        )}
        {d.migrate && (
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ color: 'var(--gold)' }}>→ MIGRATES</span> {d.migrate.join(' · ')}
          </div>
        )}
        {d.drop && (
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ color: 'var(--blood-bright)' }}>× DROPS</span> {d.drop.join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <button className="sb-btn sb-btn-ghost" style={{ flex: 1, minHeight: 36, fontSize: 11 }}>CANCEL</button>
          <button className="sb-btn sb-btn-primary" style={{ flex: 1, minHeight: 36, fontSize: 11, color: 'var(--gold)' }}>SWITCH</button>
        </div>
      </div>
    </div>
  );
}

// ── ARTBOARD ─────────────────────────────────────────────────────
function PadTypeChangeArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="sb-display" style={{ fontSize: 20 }}>
          PAD Type Change · explicit confirm · field-by-field policy
        </div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          // A5 from the Slice-3 plan. The confirm dialog has to do two jobs:
          (a) get an explicit "yes", (b) tell the user exactly what carries over and what doesn't
          — BEFORE the click, not after the regret.<br/>
          // Pre-disposition: <b>explicit beats magic.</b> When a mapping is unclear, name it.
        </div>
      </div>

      {/* Option recap */}
      <div style={{
        background: 'var(--raised)',
        borderLeft: '3px solid var(--gold-bright)',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-5)',
      }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold-bright)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
          OPTION C · PER-FIELD POLICY · ★ RECOMMENDED
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
          {[
            ['A · Drop all type-fields', 'Clean model, but punishes experiment-and-flip-back. Rejected.'],
            ['B · Hide-but-keep all', 'Forgiving, but dead-data accumulates in the model. Export is messy. Rejected.'],
            ['C · Per-field policy', 'Universal survives · structural fields migrate · dead fields drop · COMBO resets.'],
          ].map(([t, sub], i) => (
            <div key={t} style={{
              padding: 'var(--space-3)',
              background: 'var(--surface)',
              borderLeft: i === 2 ? '2px solid var(--gold-bright)' : '2px solid var(--border-soft)',
              opacity: i === 2 ? 1 : 0.6,
            }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: i === 2 ? 'var(--gold-bright)' : 'var(--text-dim)', letterSpacing: '.06em', marginBottom: 4 }}>
                {t}
              </div>
              <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <UniversalRibbon />

      <div style={{ height: 'var(--space-5)' }} />

      <SectionLabel glyph="diamond">CROSS-TYPE TRANSITION MATRIX</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
        // Every from→to gets one of five verdicts. Diagonal cells (same type) are no-ops.
      </div>
      <TransitionMatrix />
      <div style={{ height: 'var(--space-3)' }} />
      <MatrixLegend />

      <div style={{ height: 'var(--space-6)' }} />

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="star">FIVE CONFIRM-DIALOG CASES · one per verdict</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
        // Each dialog is anchored to the type-picker in the PAD Editor. The non-target types
        dim during the confirm so attention stays on the from→to pair.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        {DIALOG_CASES.map(c => (
          <div key={c.title} style={{
            background: 'var(--deep)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', letterSpacing: '.06em' }}>
                {c.title}
              </div>
              <span className="sb-pill" style={{
                fontSize: 9, padding: '1px 6px',
                color: KIND_COLOR[TRANSITIONS[c.dialog.from][c.dialog.to].kind],
                '--pix-border': KIND_COLOR[TRANSITIONS[c.dialog.from][c.dialog.to].kind],
              }}>{TRANSITIONS[c.dialog.from][c.dialog.to].verdict}</span>
            </div>
            <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
              {c.sub}
            </div>
            <EditorMock
              currentType={c.dialog.from}
              targetType={c.dialog.to}
              dialog={<ConfirmDialog {...c.dialog} />}
              height={460}
            />
          </div>
        ))}
        {/* Filler card explaining the cancel behaviour */}
        <div style={{
          background: 'var(--deep)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--gold)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            CANCEL · ESC · RECOVERY
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ <b>Esc or CANCEL</b> closes the dialog · the type pill snaps back to the original.
              Pad state is untouched.<br/>
            ▸ <b>SWITCH</b> is the only path that mutates the pad — single transaction. UNDO toast
              pinned to status bar for ~10 s ("Switched 'Rain Heavy' to LOOP · UNDO").<br/>
            ▸ Undo restores <b>every dropped field</b> verbatim. The transient state is held in
              memory until either the toast expires or the editor is closed.<br/>
            ▸ <b>RESET cases</b> (COMBO target / source) get a danger-tinted SWITCH button
              instead of the gold primary. Visual deterrent calibrated to the cost.<br/>
            ▸ <b>SWITCH while editor has unsaved field changes</b> — type switch commits the type,
              <i>field</i> dirty state preserved. The user's typed-but-not-saved name keeps
              its dirty marker.
          </div>
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="moon">MOBILE · BOTTOM-SHEET CONFIRM</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
        // Same content, sheet shape. Picked the PLAYLIST → SINGLE case because it covers the
        most information density — keeps + migrate + drop all in one dialog.
      </div>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: 'var(--space-5)',
        display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start',
      }}>
        <MobileConfirmPhone caseIdx={3} />
        <div style={{ flex: 1, paddingTop: 'var(--space-3)' }}>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            <b style={{ color: 'var(--text)' }}>What's the same:</b> verdict pill, KEEPS / MIGRATES
            / DROPS sections, Cancel + SWITCH at the bottom.<br/><br/>
            <b style={{ color: 'var(--text)' }}>What changes:</b> popover → bottom-sheet (touch
            surface). Drag-handle on top so the user can dismiss-by-swipe (same gesture as the
            scene-CRUD sheet in A3, same gesture as the A2 PLACING-mode cancel).<br/><br/>
            <b style={{ color: 'var(--text)' }}>Why bottom-sheet over a centered modal:</b> the
            type pill the user just tapped lives at the top of the editor; a centered modal would
            obscure context. Bottom-sheet keeps the pill (and the rest of the editor) visible
            above the dialog.<br/><br/>
            <b style={{ color: 'var(--text)' }}>Action buttons:</b> 36 px min height — under the
            44 px universal hit target by design, because the buttons sit BELOW the sheet drag
            zone (which gives wider miss-targeting). Net interaction zone &gt; 44 px.
          </div>
        </div>
      </div>

      <div style={{ height: 'var(--space-6)' }} />

      <PixelDivider glyph="diamond" />

      {/* Implementation rules */}
      <SectionLabel glyph="rune">IMPLEMENTATION RULES · for the Slice-3 ticket</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>

        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--success)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--success)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            ALWAYS PRESERVED
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ Universal fields (8 listed in the ribbon above).<br/>
            ▸ Pad identity (id, position).<br/>
            ▸ The pad's grid slot. Type switch doesn't move pads.
          </div>
        </div>

        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--gold)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            MIGRATION RULES
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ <b>SINGLE/LOOP → PLAYLIST:</b> <code>items = [&#123;libraryItemRef&#125;]</code>.<br/>
            ▸ <b>PLAYLIST → SINGLE/LOOP:</b> <code>libraryItemRef = items[0]?.libraryItemRef ?? null</code>.<br/>
            ▸ <b>SINGLE ↔ LOOP:</b> source + trim survive; loop fields added on switch-in, dropped on switch-out.<br/>
            ▸ <b>* → COMBO:</b> <code>chain = []</code>. No automatic mapping.<br/>
            ▸ <b>COMBO → *:</b> source / playlist starts empty. User picks audio after switching.
          </div>
        </div>

        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--blood-bright)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--blood-bright)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            ALWAYS DROPPED
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ Type-fields not in the target's schema.<br/>
            ▸ PLAYLIST entries 1+ when migrating to SINGLE/LOOP.<br/>
            ▸ COMBO chain entries when leaving COMBO.<br/>
            ▸ Per-entry settings (shuffle, autoAdvance, chainMode, inter-pad delays).<br/>
            ▸ Dropped fields are RESTORABLE via the UNDO toast (~10 s window).
          </div>
        </div>

        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--pad-playlist)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--pad-playlist)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            DIALOG BEHAVIOUR
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ Dialog ONLY when pad has data that would change. Brand-new pad with no source → no
              dialog, instant switch.<br/>
            ▸ The clicked type pill is the anchor; non-target types dim to 50% during the dialog.<br/>
            ▸ Esc / Cancel → dialog closes, pad untouched, picker snaps back to original.<br/>
            ▸ RESET-kind transitions get a danger-tinted SWITCH button (red text, blood border).<br/>
            ▸ Single transaction — type change + field drops happen atomically, undo restores all.
          </div>
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="star">OPEN QUESTIONS · for the Slice-3 implementation ticket</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, marginTop: 'var(--space-3)' }}>
        ▸ <b>UNDO toast duration</b> — 10 s default. Settings-configurable, or fixed? 10 s feels
          right for "I just made a mistake" but might be too short if the user clicks away to
          double-check. Recommendation: fixed at 10 s; add a status-bar undo-history list (Slice
          8) for older recoveries.<br/>
        ▸ <b>RESET cases vs. confirmation toast instead of pre-flight dialog</b> — currently the
          danger dialog blocks. Alternative: switch instantly, show "Switched · 4 chain pads
          dropped · UNDO" toast. More aggressive, faster. Recommendation: keep blocking dialog
          for RESET (cost is high enough to deserve the friction); drops/migrates can stay
          dialog-driven for now too, but could relax to toast in Slice 4 if testing shows
          the friction grates.<br/>
        ▸ <b>No-source SINGLE pad</b> — switching a sourceless SINGLE to LOOP: dialog or instant?
          Recommendation: instant, no dialog (nothing to lose). Same logic for any switch where
          the pad has only universal fields filled.<br/>
        ▸ <b>Bulk type-change</b> — selecting 5 pads in SETUP mode and changing type at once.
          Slice 4+ feature. Confirm dialog would aggregate: "5 pads → LOOP · 3 add loop fields ·
          2 drop loop-incompatible fields · UNDO available". Defer the design; mention it in
          DESIGN_NOTES as a Slice-4 candidate.
      </div>
    </div>
  );
}

Object.assign(window, {
  PadTypePill, UniversalRibbon, MatrixCell, TransitionMatrix, MatrixLegend,
  ConfirmDialog, EditorMock, MobileConfirmPhone, PadTypeChangeArtboard,
  TRANSITIONS, KIND_COLOR, TYPES, DIALOG_CASES,
});
