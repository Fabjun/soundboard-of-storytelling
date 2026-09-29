// v19-empty-states.jsx — A1 from the Slice-3 plan.
//
// Three cold-start surfaces the design pack didn't cover yet:
//   1. EMPTY BOARD     — no scenes have been created
//   2. EMPTY SCENE     — a scene exists but holds no pads (Slice-3 default
//                        gridConfig = 4×4 visible; configurable in Slice 8)
//   3. EMPTY LIBRARY   — no audio / pads / boards / icons yet
//
// Each empty state ships in two flavours per the V3 responsive strategy:
//   desktop (1140 wide) and mobile (360 wide, ≥44 px hit targets, no
//   right-rail). Same component, two variants — not a parallel design.
//
// Slice-3 boundary calls baked in:
//   · Empty Board has no auto-default scene. The user creates it explicitly.
//     One forced step > one hidden default; helps users learn the data model.
//   · Empty Scene shows the 4×4 default grid as dashed slot shells (sb-pad
//     opacity-faded). The slots themselves are the click targets — no
//     separate big overlay competing with them.
//   · A2 (creation flow) is hinted but NOT decided here. The empty Scene
//     state references "drag · click · toolbar" generically; the recommend-
//     ation comes from A2.
//   · "Browse templates" / "Import board" are referenced as SECONDARY actions
//     only — the template flow itself is Slice 7.

// ── EmptyStateBody · centered focal block used by every empty surface ─
function EmptyStateBody({ sigil = true, eyebrow, title, helper, primary, secondary, kbd, compact }) {
  return (
    <div style={{
      position: 'relative', zIndex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      gap: compact ? 'var(--space-3)' : 'var(--space-4)',
      padding: compact ? 'var(--space-5)' : 'var(--space-8)',
      maxWidth: compact ? 320 : 480,
    }}>
      {sigil && <ArcaneSigil size={compact ? 56 : 76} />}
      {eyebrow && (
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 11,
          color: 'var(--text-mute)', letterSpacing: '.18em', textTransform: 'uppercase',
        }}>{eyebrow}</div>
      )}
      <div className="sb-display-vt" style={{ fontSize: compact ? 22 : 28, lineHeight: 1.1 }}>
        {title}
      </div>
      <div className="sb-mono" style={{
        fontSize: compact ? 12 : 13,
        color: 'var(--text-dim)', lineHeight: 1.55,
        maxWidth: compact ? 280 : 380,
      }}>{helper}</div>
      {(primary || secondary) && (
        <div style={{
          display: 'flex', gap: 'var(--space-3)',
          marginTop: 'var(--space-2)',
          flexDirection: compact ? 'column' : 'row',
          width: compact ? '100%' : 'auto',
        }}>
          {primary && (
            <button className="sb-btn sb-btn-filled" style={{
              minHeight: 44, padding: '0 var(--space-5)',
              fontSize: 'var(--fs-md)',
            }}>{primary}</button>
          )}
          {secondary && (
            <button className="sb-btn sb-btn-ghost" style={{
              minHeight: 44, padding: '0 var(--space-4)',
              fontSize: 'var(--fs-md)',
            }}>{secondary}</button>
          )}
        </div>
      )}
      {kbd && (
        <div className="sb-mono" style={{
          fontSize: 11, color: 'var(--text-mute)', marginTop: 'var(--space-2)',
        }}>{kbd}</div>
      )}
    </div>
  );
}

// ── Faded slot used in empty Scene grid. Real sb-pad shell — opacity-
//    reduced + dashed pixel-frame via --pix-border. Hover/click target.
function EmptySlot({ accent, label, hint }) {
  return (
    <div className="sb-pad" style={{
      opacity: accent ? 1 : 0.38,
      cursor: 'pointer',
      minHeight: 96,
      '--pix-bg': 'var(--sunk)',
      '--pix-border': accent ? 'var(--border-strong)' : 'var(--border-soft)',
      '--pad-color': 'var(--text-mute)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: accent ? 18 : 14,
          color: accent ? 'var(--gold)' : 'var(--text-mute)',
          lineHeight: 1,
        }}>+</div>
        {label && (
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: 10,
            color: accent ? 'var(--gold)' : 'var(--text-mute)',
            letterSpacing: '.14em', textTransform: 'uppercase',
          }}>{label}</div>
        )}
        {hint && (
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', textAlign: 'center', maxWidth: 100, lineHeight: 1.4 }}>
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PathHint · the 3-paths annotation strip used in empty Scene ──────
function PathHint({ glyph, label, kbd }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: 'var(--space-2) var(--space-3)',
      background: 'var(--raised)',
      border: '1px solid var(--border-soft)',
      borderLeft: '2px solid var(--gold-dim)',
    }}>
      <PixelIcon name={glyph} size={14} color="var(--gold)" />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)', letterSpacing: '.06em' }}>
          {label}
        </div>
      </div>
      {kbd && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)',
          padding: '2px 6px',
          background: 'var(--sunk)',
          border: '1px solid var(--border-soft)',
        }}>{kbd}</span>
      )}
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════════╗
// ║ 1 · EMPTY BOARD — no scenes                                       ║
// ╚════════════════════════════════════════════════════════════════════╝

function BoardEmptyDesktop() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="Untitled Board" breadcrumb="New · unsaved" mode="setup" />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', flex: 1, minHeight: 0 }}>
        {/* Scene rail — empty, prominent "+ NEW SCENE" */}
        <aside style={{
          background: 'var(--deep)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <PanelHeaderV2 icon="moon" title="SCENES" active />
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            padding: 'var(--space-3)',
            justifyContent: 'center', gap: 'var(--space-3)',
          }}>
            <button className="sb-btn sb-btn-primary" style={{
              minHeight: 56,
              fontSize: 'var(--fs-md)',
              flexDirection: 'column', gap: 2,
            }}>
              <span>+ NEW SCENE</span>
              <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.06em', textTransform: 'none' }}>or press <kbd>N</kbd></span>
            </button>
            <div className="sb-mono" style={{
              fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5, padding: 'var(--space-2)',
            }}>
              A scene gathers the sounds for a moment in your story — combat, the tavern, the boss reveal.
            </div>
          </div>
        </aside>

        {/* Main empty state */}
        <main style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(70% 60% at 50% 35%, transparent 0%, rgba(0,0,0,.45) 100%), var(--night)',
          overflow: 'hidden',
        }}>
          <HearthGlow intensity={0.6} />
          <AmbientEmbers density={8} />
          <EmptyStateBody
            eyebrow="Slice 3 · cold start"
            title="Your board is waiting"
            helper="A board needs at least one scene before pads can live on it. Create your first scene — name it after a moment in your story."
            primary="+ Create first scene"
            secondary="Import board file…"
            kbd="↵ confirms · Esc cancels"
          />
        </main>

        {/* Right rail — placeholders */}
        <aside style={{
          background: 'var(--deep)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <PanelHeaderV2 icon="sparkle" title="NOW PLAYING" right={<span className="sb-caption">0</span>} />
          <div style={{ padding: 'var(--space-3)' }}>
            <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5 }}>
              Nothing playing yet.
            </div>
          </div>
          <PanelHeaderV2 icon="diamond" title="MASTER" />
          <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', opacity: 0.5 }}>
            <LabelSliderV2 label="MASTER" value={0.72} />
            <LabelSliderV2 label="AMBIENT" value={0.45} color="var(--pad-loop)" />
            <LabelSliderV2 label="STINGER" value={0.90} color="var(--pad-single)" />
          </div>
        </aside>
      </div>

      <StatusBarV2 mode="setup" board="Untitled · new" info="0 scenes · 0 pads" right={<><span>Ready</span><span>48 kHz</span></>} />
    </div>
  );
}

function BoardEmptyMobile() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Compact top bar */}
      <div style={{
        height: 48,
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: '0 var(--space-3)',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button style={{ width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18 }}>☰</button>
        <div style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.10em', color: 'var(--text)' }}>UNTITLED</div>
        <span className="sb-mode-badge is-setup" style={{ fontSize: 10 }}>SETUP</span>
      </div>

      {/* Empty state — center */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(80% 50% at 50% 35%, transparent 0%, rgba(0,0,0,.45) 100%), var(--night)',
        overflow: 'hidden',
      }}>
        <HearthGlow intensity={0.5} />
        <AmbientEmbers density={6} />
        <EmptyStateBody
          compact
          title="Your board is waiting"
          helper="A board needs a scene. Tap below to make the first one."
          primary="+ Create first scene"
          secondary="Import board file…"
        />
      </div>

      {/* Scene strip at bottom (empty) */}
      <div style={{
        height: 56,
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: '0 var(--space-3)',
        background: 'var(--deep)',
        borderTop: '1px solid var(--border)',
        overflowX: 'auto',
      }}>
        <button className="sb-btn sb-btn-ghost" style={{ minHeight: 44, padding: '0 var(--space-3)', flexShrink: 0 }}>
          + NEW SCENE
        </button>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 'var(--space-2)' }}>
          No scenes yet
        </div>
      </div>

      <StatusBarV2 mode="setup" board="Untitled" info="0 scenes" />
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════════╗
// ║ 2 · EMPTY SCENE — scene exists, no pads                           ║
// ╚════════════════════════════════════════════════════════════════════╝

function EmptyGrid({ cols = 4, rows = 4 }) {
  const total = cols * rows;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridAutoRows: '110px',
      gap: 'var(--space-3)',
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <EmptySlot
          key={i}
          accent={i === 0}
          label={i === 0 ? 'ADD A PAD' : null}
          hint={i === 0 ? 'tap · drag · or use toolbar' : null}
        />
      ))}
    </div>
  );
}

function SceneEmptyDesktop() {
  const SCENES = ['The Approach', 'The Tavern', 'Combat — Forest'];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="The Tavern" breadcrumb="Board · scene empty" mode="setup" />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', flex: 1, minHeight: 0 }}>
        {/* Populated scene rail */}
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="moon" title="SCENES" active />
          <div style={{ padding: 'var(--space-2)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {SCENES.map((s, i) => (
              <div key={s} style={{
                padding: '8px 10px',
                background: i === 1 ? 'var(--top)' : 'transparent',
                borderLeft: i === 1 ? '2px solid var(--gold)' : '2px solid transparent',
                fontFamily: 'var(--font-ui)', fontSize: 14,
                color: i === 1 ? 'var(--gold)' : 'var(--text-dim)',
                cursor: 'pointer', minHeight: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{s}</span>
                {i === 1 && <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>0 pads</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border-soft)' }}>
            <button className="sb-btn sb-btn-ghost" style={{ width: '100%', minHeight: 36 }}>+ NEW SCENE</button>
          </div>
        </aside>

        {/* Main area · grid of empty slots + side annotation */}
        <main style={{
          position: 'relative',
          padding: 'var(--space-5)',
          background: 'radial-gradient(70% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.35) 100%), var(--night)',
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 220px',
          gap: 'var(--space-5)',
          alignContent: 'start',
        }}>
          {/* Faint setup-grid bg */}
          <div className="sb-grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-dim)', letterSpacing: '.10em', textTransform: 'uppercase', marginBottom: 6 }}>
                Scene · The Tavern · 4 × 4 grid · 0 pads
              </div>
              <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.5 }}>
                // Default grid for Slice 3. Layout becomes editable in Slice 8.
              </div>
            </div>
            <EmptyGrid cols={4} rows={4} />
          </div>

          {/* Right-side annotation: 3 paths */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingTop: 36 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              THREE WAYS TO ADD A PAD
            </div>
            <PathHint glyph="play"   label="Tap any slot" kbd="↰" />
            <PathHint glyph="scroll" label="Drag from Library" />
            <PathHint glyph="rune"   label="Use + ADD PAD toolbar" kbd="A" />
            <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5, marginTop: 'var(--space-2)' }}>
              // The recommended primary path is set in A2. This empty state stays
              path-neutral until then.
            </div>
          </div>
        </main>

        {/* Right rail · still empty */}
        <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="sparkle" title="NOW PLAYING" right={<span className="sb-caption">0</span>} />
          <div style={{ padding: 'var(--space-3)' }}>
            <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
              Nothing playing.
            </div>
          </div>
          <PanelHeaderV2 icon="diamond" title="MASTER" />
          <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', opacity: 0.5 }}>
            <LabelSliderV2 label="MASTER" value={0.72} />
            <LabelSliderV2 label="AMBIENT" value={0.45} color="var(--pad-loop)" />
          </div>
        </aside>
      </div>

      <StatusBarV2 mode="setup" board="Board · The Tavern" info="0 pads · 4×4 default" right={<><span>Master 72%</span><span>48 kHz</span></>} />
    </div>
  );
}

function SceneEmptyMobile() {
  const SCENES = ['Approach', 'Tavern', 'Combat'];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        height: 48,
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: '0 var(--space-3)',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button style={{ width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18 }}>☰</button>
        <div style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.10em', color: 'var(--text)' }}>TAVERN</div>
        <span className="sb-mode-badge is-setup" style={{ fontSize: 10 }}>SETUP</span>
      </div>

      {/* Scene tabs scroll */}
      <div style={{
        height: 44,
        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
        padding: '0 var(--space-3)',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border-soft)',
        overflowX: 'auto',
      }}>
        {SCENES.map((s, i) => (
          <div key={s} style={{
            padding: '6px 12px', minHeight: 32,
            background: i === 1 ? 'var(--top)' : 'transparent',
            borderBottom: i === 1 ? '2px solid var(--gold)' : '2px solid transparent',
            fontFamily: 'var(--font-ui)', fontSize: 13,
            color: i === 1 ? 'var(--gold)' : 'var(--text-dim)',
            letterSpacing: '.06em',
            flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}>{s}</div>
        ))}
      </div>

      {/* Main: 3×4 grid (mobile-friendly) + bottom helper card */}
      <div style={{
        flex: 1,
        position: 'relative',
        padding: 'var(--space-3)',
        background: 'radial-gradient(80% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.35) 100%), var(--night)',
        overflow: 'auto',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
      }}>
        <div className="sb-grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }} />
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)',
          gridAutoRows: '80px',
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <EmptySlot key={i} accent={i === 0} label={i === 0 ? 'ADD' : null} hint={i === 0 ? 'tap to start' : null} />
          ))}
        </div>

        {/* Bottom hint card */}
        <div style={{
          position: 'relative', zIndex: 1,
          background: 'var(--raised)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--gold)',
          padding: 'var(--space-3) var(--space-4)',
          marginTop: 'auto',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.10em', marginBottom: 4 }}>
            ADD A PAD
          </div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Tap any slot · long-press to pick from Library · or use the + button below.
          </div>
        </div>
      </div>

      {/* Bottom toolbar with primary ADD button */}
      <div style={{
        height: 56,
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: '0 var(--space-3)',
        background: 'var(--deep)',
        borderTop: '1px solid var(--border)',
      }}>
        <button className="sb-btn sb-btn-filled" style={{ flex: 1, minHeight: 44, fontSize: 'var(--fs-md)' }}>
          + ADD PAD
        </button>
        <button className="sb-btn sb-btn-ghost" style={{ minHeight: 44, padding: '0 var(--space-3)' }}>
          LIBRARY
        </button>
      </div>
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════════╗
// ║ 3 · EMPTY LIBRARY                                                 ║
// ╚════════════════════════════════════════════════════════════════════╝

function LibTabs({ active = 'audio', mobile }) {
  const tabs = [
    { id: 'audio',  label: 'AUDIO',  count: 0 },
    { id: 'pads',   label: 'PADS',   count: 0 },
    { id: 'boards', label: 'BOARDS', count: 0 },
    { id: 'icons',  label: 'ICONS',  count: 0 },
  ];
  return (
    <div className="sb-tabs" style={{ paddingLeft: mobile ? 'var(--space-3)' : 'var(--space-5)', gap: mobile ? 'var(--space-1)' : 'var(--space-2)' }}>
      {tabs.map(t => (
        <div key={t.id} className={'sb-tab' + (t.id === active ? ' is-active' : '')} style={{
          minHeight: 44, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{t.label}</span>
          <span className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>{t.count}</span>
        </div>
      ))}
    </div>
  );
}

function LibraryEmptyDesktop() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="Library" icon="book" breadcrumb="0 items · across 4 categories" mode="setup" />

      <div style={{ background: 'var(--deep)', borderBottom: '1px solid var(--border)' }}>
        <LibTabs active="audio" />
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: 0 }}>
        {/* Main · big dropzone */}
        <main style={{
          position: 'relative',
          padding: 'var(--space-6)',
          background: 'radial-gradient(70% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.35) 100%), var(--night)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HearthGlow intensity={0.5} />
          <AmbientEmbers density={6} />
          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 620,
            border: '2px dashed var(--border-strong)',
            background: 'var(--surface)',
            padding: 'var(--space-12) var(--space-6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <EmptyStateBody
              eyebrow="Library · Audio"
              title="Drop sound files here"
              helper="WAV, MP3, OGG, FLAC. Files land in the library first, then any board or scene can use them. Up to 500 MB across the library."
              primary="Browse files"
              secondary="See supported formats"
            />
          </div>
        </main>

        {/* Right rail · other-tabs preview + storage chip */}
        <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="diamond" title="OTHER CATEGORIES" />
          <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[
              ['PADS',   'pads you save from any board reappear here'],
              ['BOARDS', 'snapshots of full setups for one-click recall'],
              ['ICONS',  'built-in pixel set + your custom SVGs'],
            ].map(([t, sub]) => (
              <div key={t} style={{
                padding: 'var(--space-3)',
                background: 'var(--raised)',
                border: '1px solid var(--border-soft)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)', letterSpacing: '.10em' }}>{t}</span>
                  <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>0</span>
                </div>
                <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', padding: 'var(--space-3)', borderTop: '1px solid var(--border-soft)' }}>
            <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
              STORAGE · 0 MB / 500 MB
            </div>
            <div className="sb-slider" style={{ marginTop: 6, height: 4 }}>
              <div className="sb-slider-fill" style={{ width: 0, background: 'var(--gold-dim)' }} />
            </div>
          </div>
        </aside>
      </div>

      <StatusBarV2 mode="setup" board="Library" info="0 items" right={<><span>Drop files anywhere</span></>} />
    </div>
  );
}

function LibraryEmptyMobile() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        height: 48,
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: '0 var(--space-3)',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button style={{ width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18 }}>☰</button>
        <div style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.10em', color: 'var(--text)' }}>LIBRARY</div>
      </div>

      <div style={{ background: 'var(--deep)', borderBottom: '1px solid var(--border-soft)', overflowX: 'auto' }}>
        <LibTabs active="audio" mobile />
      </div>

      <div style={{
        flex: 1, position: 'relative',
        padding: 'var(--space-3)',
        background: 'radial-gradient(80% 50% at 50% 30%, transparent 0%, rgba(0,0,0,.35) 100%), var(--night)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'auto',
      }}>
        <HearthGlow intensity={0.45} />
        <AmbientEmbers density={4} />
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%',
          border: '2px dashed var(--border-strong)',
          background: 'var(--surface)',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <EmptyStateBody
            compact
            title="Drop sound files"
            helper="Tap to browse, or drop files anywhere on this screen."
            primary="Browse files"
          />
        </div>
      </div>

      <div style={{
        padding: 'var(--space-3)',
        background: 'var(--deep)',
        borderTop: '1px solid var(--border-soft)',
      }}>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
          STORAGE · 0 MB / 500 MB
        </div>
      </div>
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════════╗
// ║ Artboards: desktop + mobile + notes side-by-side                  ║
// ╚════════════════════════════════════════════════════════════════════╝

function PairLayout({ desktop, mobile, label, notes }) {
  return (
    <div className="sb" style={{ padding: 24, overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
        <div className="sb-display" style={{ fontSize: 18 }}>{label}</div>
        <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-mute)' }}>// Slice 3 · A1 empty state</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1140px 360px', gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* Desktop frame */}
        <div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            DESKTOP · 1140 × 720
          </div>
          <div style={{ width: 1140, height: 720, border: '1px solid var(--border)' }}>{desktop}</div>
        </div>
        {/* Mobile frame */}
        <div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            MOBILE · 360 × 720
          </div>
          <div style={{ width: 360, height: 720, border: '1px solid var(--border)' }}>{mobile}</div>
        </div>
      </div>

      {notes && (
        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--gold-dim)',
          padding: 'var(--space-4) var(--space-5)',
          marginTop: 'var(--space-3)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            DESIGN NOTES
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.65 }}>
            {notes}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyBoardArtboard() {
  return (
    <PairLayout
      label="Empty Board · no scenes"
      desktop={<BoardEmptyDesktop />}
      mobile={<BoardEmptyMobile />}
      notes={<>
        ▸ <b>No auto-default scene.</b> The user creates the first scene explicitly. One forced
          step beats one hidden default — it teaches the data model (Board → Scene → Pad) on the
          way in.<br/>
        ▸ <b>Scene rail dominates on desktop</b> because that's the structural action. Empty rail
          shows a vertical CTA + a one-line explainer of what a scene is.<br/>
        ▸ <b>Mobile collapses the rail</b> into a horizontal strip at the bottom; the empty
          state's primary CTA carries the action, the strip carries the affordance.<br/>
        ▸ <b>Atmosphere stays on.</b> HearthGlow + AmbientEmbers at low intensity keep the screen
          inviting rather than sterile — empty doesn't mean dead.<br/>
        ▸ <b>"Import board file…"</b> is a SECONDARY action — a one-button affordance that lands on
          the Slice-7 import flow (the .json export path). The full Templates browser is Slice 7's
          job; this entry point doesn't pre-commit to demo-template UX.
      </>}
    />
  );
}

function EmptySceneArtboard() {
  return (
    <PairLayout
      label="Empty Scene · no pads"
      desktop={<SceneEmptyDesktop />}
      mobile={<SceneEmptyMobile />}
      notes={<>
        ▸ <b>The 4×4 default grid is visible.</b> Slice-3 commits to a fixed 4×4 layout; the grid
          configurability popover (A4) lands in Slice 8. The grid being VISIBLE while empty
          makes the structure obvious.<br/>
        ▸ <b>Slots are themselves the click targets.</b> Faded <code>sb-pad</code> shells with a
          centred + serve double duty — they show capacity and invite the first click. One slot
          (top-left) is accented to anchor the eye.<br/>
        ▸ <b>Three paths are hinted, not ranked.</b> A2 picks the primary path with your sign-off;
          this empty state stays path-neutral so it doesn't pre-commit. The hint strip uses
          neutral verbs ("tap any slot", "drag from Library", "use + ADD PAD").<br/>
        ▸ <b>Mobile keeps 4 columns.</b> Same data-model positions as desktop, just ~78 px
          cells at 360 px width (still above the 44 px touch minimum). Reflowing to 3 cols
          would break the F1-F4 / F5-F8 / F9-F12 / Q-W-E-R hotkey row mapping and force
          <code>position</code> to render differently per viewport. Mobile-landscape and
          desktop both inherit 4-col without change.<br/>
        ▸ <b>Scene rail shows "0 pads"</b> next to the selected scene so the empty state isn't
          a surprise — the user navigated INTO emptiness, not landed in it accidentally.
      </>}
    />
  );
}

function EmptyLibraryArtboard() {
  return (
    <PairLayout
      label="Empty Library · no items"
      desktop={<LibraryEmptyDesktop />}
      mobile={<LibraryEmptyMobile />}
      notes={<>
        ▸ <b>All four tabs visible even when empty</b>, each carrying its count (0). Teaches the
          taxonomy on day one without forcing the user to discover tabs by exploration.<br/>
        ▸ <b>Drop-zone is the screen</b>, not a small box. The dashed-border container is wide
          and tall on desktop, scaled but still dominant on mobile.<br/>
        ▸ <b>Other-Libraries summary in the right rail</b> shows what PADS / BOARDS / ICONS will
          hold once they fill — answers the question "what are these tabs for?" before the user
          clicks them.<br/>
        ▸ <b>Storage chip stays</b> ("0 MB / 500 MB") so the constraint is visible from the
          start. The Slice-4 audio engine is the consumer.<br/>
        ▸ <b>Non-AUDIO tabs aren't designed separately here</b> — they follow the same pattern
          (centred empty state, type-specific copy, no dropzone for PADS/BOARDS since those are
          generated, dropzone for ICONS only). One artboard, one principle.
      </>}
    />
  );
}

Object.assign(window, {
  EmptyStateBody, EmptySlot, EmptyGrid,
  BoardEmptyDesktop, BoardEmptyMobile,
  SceneEmptyDesktop, SceneEmptyMobile,
  LibraryEmptyDesktop, LibraryEmptyMobile,
  EmptyBoardArtboard, EmptySceneArtboard, EmptyLibraryArtboard,
});
