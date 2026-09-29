# Testing — V3 (Soundboard of Storytelling)

## Überblick

Vier Schichten, eingeführt in Phase 1 & 2 (Phase 2 — Testing Infrastructure):

| Schicht | Werkzeug | Zweck | Laufzeit |
|---------|---------|-------|---------|
| Unit | Vitest | Logik-Korrektheit (pure functions, signals, IDB-API) | ~1s |
| E2E Smoke | Playwright | Kritische Pfade in Chromium + WebKit | ~6s |
| E2E Full | Playwright | Vollständige Verifikation (Slices 3–4): Board/Deck/Pad CRUD, Audio-Engine | ~30s |
| Mobile E2E | Playwright (WebKit + Chromium) | Touch-wiring via tap() — 3 aktive WebKit-Specs + 2 Chromium-Specs; 2 WebKit-Specs deferred/fixme'd (touch-targets, overflow) bis Slice 8 | ~30s |
| Visual Regression | Playwright Screenshots | Pixel-Vergleich (lokal-only) | ~30s |

---

## Werkzeuge

- **Vitest** — Unit-Tests. Schnell (ms), kein Browser, keine Netzwerk-Abhängigkeit. Konfiguration: [v3/vitest.config.ts](../../v3/vitest.config.ts)
- **Playwright** — E2E-Tests in Chromium (+ WebKit für Smoke/Mobile). Startet einen **eigenen** Vite-Dev-Server auf dem **Test-Port 5199** (`--strictPort`, nie einen vorhandenen Server wiederverwenden — belegter Port = lauter Fehler). Der normale Dev-Server bleibt auf 5173. Konfiguration: [v3/playwright.config.ts](../../v3/playwright.config.ts), Projekt-Zuordnung: [v3/tests/e2e/projects.ts](../../v3/tests/e2e/projects.ts)
- **Node-Version** — festgelegt in [`.nvmrc`](../../.nvmrc) (24); CI liest sie von dort (`node-version-file`).
- **fake-indexeddb** — In-Memory-IndexedDB für Unit-Tests. Ersetzt jsdom's fehlende IDB-Implementierung. Setup: [v3/tests/unit/setup.ts](../../v3/tests/unit/setup.ts)
- **@vitest/coverage-v8** — Coverage-Report via V8 (`npm run test:coverage`)
- **ESLint** — Statische Analyse. Flat-Config in [v3/eslint.config.js](../../v3/eslint.config.js). TypeScript + react-hooks Regeln.
- **Prettier** — Code-Formatierung. Konfiguration: [v3/.prettierrc.json](../../v3/.prettierrc.json)
- **size-limit** — Bundle-Größen-Monitoring. Limits: JS 200 KB, CSS 50 KB (gzip). Konfiguration: [v3/.size-limit.json](../../v3/.size-limit.json)

---

## Verzeichnis-Struktur

```
v3/
  tests/
    fixtures/test-audio-1s.wav  ← Minimal-WAV (8-bit mono 8kHz, 1s silence)
    unit/                       ← Vitest (setup.ts: fake-indexeddb/auto)
    e2e/
      projects.ts               ← Projekt-Zuordnung aller Specs — einzige Quelle
      helpers.ts                ← Shared helpers (Navigation, Upload/Seed, pointerDrag …)
      *.spec.ts                 ← Smoke / Full / PWA
      mobile/                   ← iPhone-13-Pro-Profil
      visual/                   ← Screenshot-Vergleiche (macOS)
  vitest.config.ts · playwright.config.ts · eslint.config.js
  tsconfig.test.json · tsconfig.e2e.json
```

Welche Datei in welchem Projekt läuft: **Test-Inventar** (unten, automatisch erzeugt).

## Test-Inventar

<!-- AUTO-GENERATED:test-inventory START — nicht manuell editieren -->

_Erzeugt von `npm run sync:tests` aus `v3/tests/e2e/projects.ts` und den Testdateien —
Zahl in Klammern = Testfälle in der Datei (inkl. Quarantäne)._

| Projekt | Browser / Gerät | Gegen | Specs (Tests) |
|---|---|---|---|
| `smoke` | Chromium (Desktop) | Dev + Build | `app-loads` (1), `library-empty` (1), `board-list-empty` (1), `board-create` (1), `mode-toggle` (1) |
| `smoke-webkit` | WebKit (Desktop) | Dev | `app-loads` (1), `library-empty` (1), `board-list-empty` (1), `board-create` (1), `mode-toggle` (1) |
| `full` | Chromium (Desktop) | Dev + Build | `board-crud` (5), `deck-crud` (6), `pad-creation` (4), `pad-editing` (4), `pad-dnd` (2), `game-mode` (1), `audio` (3) |
| `full-webkit` | WebKit (Desktop) | Dev | `board-crud` (5), `deck-crud` (6), `pad-creation` (4), `pad-editing` (4), `pad-dnd` (2) |
| `mobile` | WebKit (iPhone 13 Pro) | Dev | `mobile-unlock-nav` (3), `mobile-board-flow` (2), `mobile-mode-toggle` (2), `mobile-touch-targets` (5), `mobile-overflow` (2) |
| `mobile-chromium` | Chromium (iPhone 13 Pro) | Dev | `mobile-pad-interaction` (2), `mobile-pad-creation` (1) |
| `pwa` | Chromium (Desktop) | nur Build | `pwa` (4) |
| `visual` | Chromium (Desktop), nur macOS | Dev | `visual-boardlist-empty` (1), `visual-boardlist-with-board` (1), `visual-boardscreen-game` (1), `visual-boardscreen-setup` (1), `visual-deck-rail` (1), `visual-library-empty` (1), `visual-modetoggle-states` (2), `visual-startscreen` (1) |

**Unit-Tests (Vitest):** 12 Dateien, 185 Testfälle —
`audio/engine.test.ts` (24), `audio/lru.test.ts` (11), `deckConflict.test.ts` (9), `e2eProjects.test.ts` (6), `flameMath.test.ts` (22), `idb.test.ts` (15), `nanoid.test.ts` (2), `padDnd.test.ts` (11), `padUtils.test.ts` (43), `store.test.ts` (23), `testGuards.test.ts` (6), `upload.test.ts` (13)

<!-- AUTO-GENERATED:test-inventory END -->

---

## Test-Selector-Konvention

Alle E2E-Tests verwenden `data-testid`-Attribute für stabile Selektoren.
**Keine CSS-Klassen als primäre Selektoren** (brechen bei Refactoring/Slice 8).

### Namensgebung

```
data-testid="<component>-<element>"
data-testid="<component>-<element>-<instance-id>"
```

**Beispiele:**
```
new-board-button           ← eindeutig, kein Suffix nötig
board-row-{board.id}       ← Instanz-ID für Listen-Elemente
deck-tab-{deck.id}
deck-delete-{deck.id}
mode-toggle                ← Container
mode-toggle-setup          ← Unter-Element
pad-cell-empty-{col}-{row} ← Koordinaten als Suffix
```

### Regeln

- Nur test-kritische Elemente bekommen `data-testid` (kein vollständiges DOM-Coverage)
- IDs werden nur wo nötig angefügt (Listen-Items, mehrfach vorkommende Typen)
- In Playwright verwenden: `page.getByTestId('...')` oder `page.locator('[data-testid^="..."]')` für Prefix-Matches

---

## Mobile Testing (iPhone / iOS)

Mobile tests are split across two Playwright projects, both using the **iPhone 13 Pro**
device profile (viewport 390×844, `hasTouch: true`, `isMobile: true`):

| Project | Browser | Tests |
|---------|---------|-------|
| `mobile` | WebKit | 5 Spec-Dateien: 3 aktiv (navigation, mode toggle, unlock-nav), 2 deferred/fixme'd (touch-targets, overflow — pending Slice 8 mobile adaptation) |
| `mobile-chromium` | Chromium | 2 audio-dependent specs (pad interaction, pad creation) |

All tested interactions use `tap()` to send real touch events (pointerType: 'touch').

**Why two projects:** Playwright's headless WebKit has no audio codec support.
`decodeAudioData()` fails, the upload pipeline skips the file, and any test waiting for
audio in the library times out. Audio-dependent tests run on Chromium with the same
iPhone 13 Pro device settings (viewport, hasTouch, isMobile, UA) applied.

### What the mobile projects cover (automated)

| Spec | Project | What it tests |
|------|---------|--------------|
| `mobile-unlock-nav` | `mobile` (WebKit) | TAP TO UNLOCK + BOARD/LIBRARY navigation buttons respond to `tap()` |
| `mobile-board-flow` | `mobile` (WebKit) | NEW BOARD, board-row-title, back button respond to `tap()` |
| `mobile-mode-toggle` | `mobile` (WebKit) | SETUP ↔ GAME toggle switches in both directions via `tap()` |
| `mobile-touch-targets` | `mobile` (WebKit) | ⬜ Deferred (Slice 8): `test.describe.fixme` — alle Tests übersprungen bis mobile layout adaptation implementiert |
| `mobile-overflow` | `mobile` (WebKit) | ⬜ Deferred (Slice 8): `test.describe.fixme` — alle Tests übersprungen bis mobile layout adaptation implementiert |
| `mobile-pad-interaction` | `mobile-chromium` | **Core:** pad `tap()` → `.sb-pad.is-hot` / `.sb-pad.is-looping` DOM state |
| `mobile-pad-creation` | `mobile-chromium` | Empty cell `tap()` → popover → `tap()` through to pad creation |

### What is deliberately NOT automated (manual only)

The following cannot be tested honestly in Playwright:

| Item | Why not automatable |
|------|---------------------|
| File upload via iOS picker | `setInputFiles()` bypasses the native picker — a test using it would be green while the real device fails |
| Audio output | Headless WebKit has no audio hardware |
| Ringer Switch behaviour | Physical hardware signal |
| Tab-switch / backgrounding | iOS lifecycle events require a real device |
| Backup import/export | iOS Files app integration is outside the browser sandbox |

These items are covered by the manual checklist at
[manual-iphone-checklist.md](manual-iphone-checklist.md).

### Running mobile tests

```bash
cd v3 && npm run test:e2e:mobile   # Beide Projekte: 5 Spec-Dateien WebKit (2 davon fixme'd) + 2 Spec-Dateien Chromium
```

Mobile tests run in CI as a separate `e2e-mobile` job (parallel to `e2e-smoke` and
`e2e-full`). They are **not** in the pre-commit hook (hook is already ~14s).

---

## Visual Regression (lokal-only)

Screenshot-Baselines für Komponenten-Vergleiche. **Nicht in CI** (macOS und Ubuntu
haben unterschiedliches Font-Rendering → Baseline-Mismatch auf Ubuntu).

### Baselines generieren / aktualisieren

```bash
cd v3 && npm run test:e2e:update-snapshots
```

Generiert `*.png`-Dateien in `tests/e2e/visual/<spec>.spec.ts-snapshots/` (Format: `<name>-visual-darwin.png`).
Diese Dateien werden committed und gehören zum Repo.

### Verifikation

```bash
cd v3 && npm run test:e2e:visual
```

Läuft gegen committed Baselines. Bei Diff: Test schlägt fehl mit Screenshot-Vergleich im Report.

### Wann ausführen

**Automatisch im Pre-Push-Hook (nur macOS).** Zusätzlich sinnvoll vor UI-relevanten Commits:
```bash
cd v3 && npm run test:e2e:visual
```
Bei Diff: **jedes** `*-diff.png` ansehen. Nur bei nachweislich gewollter Änderung
`npm run test:e2e:update-snapshots` + neue Baseline committen.

### Anti-Flakiness

Alle Visual-Tests rufen `stableScreenshot(page)` auf, das:
- `reducedMotion: 'reduce'` setzt (CSS-Animationen stoppen)
- `waitForLoadState('networkidle')` wartet
- `document.fonts.ready` abwartet
- 100ms extra Buffer wartet

---

## CI-Integration

GitHub Actions unter [`.github/workflows/tests.yml`](../../.github/workflows/tests.yml).

### Workflows

**`tests.yml`** — Läuft auf Push zu `main`, Pull Requests und wird von `weekly.yml` aufgerufen:

```
unit-build-lint
  ├── npm audit --audit-level=high   (high/critical blockiert)
  ├── npm run build          (tsc + vite)
  ├── npm run typecheck:scripts   (scripts/*.ts)
  ├── npm run test:coverage  (vitest inkl. Wächter-Tests + Coverage-Untergrenze)
  ├── npm run lint           (eslint)
  ├── npm run format:check   (prettier)
  ├── npm run size           (size-limit)
  ├── npm run sync:docs      (+ git diff --exit-code)  ← Docs sync check
  └── npm run link:check     (markdown-link-check)     ← Link integrity

e2e-smoke (needs: unit-build-lint)
  └── npm run test:e2e:smoke   (10 Tests: 5 × Chromium + 5 × WebKit)

e2e-mobile (needs: unit-build-lint)
  └── npm run test:e2e:mobile  (7 Spec-Dateien: 5 WebKit + 2 Chromium — iPhone 13 Pro profile; 2 WebKit-Specs fixme'd/deferred bis Slice 8)

e2e-prod (needs: unit-build-lint)
  └── npm run test:e2e:prod    (Build → Smoke + Full + PWA gegen vite preview; Service Worker, Manifest, Offline)

e2e-full (needs: unit-build-lint)
  └── npm run test:e2e:full    (full in Chromium + full-webkit: Board/Deck/Pad-CRUD + Drag & Drop in der Safari-Engine)
```

Playwright-Reports werden als Artifact hochgeladen (7 Tage, bei Fehler).
Node-Version aus `.nvmrc`. In CI gilt `failOnFlakyTests`: ein Test, der erst im
Wiederholungsversuch besteht, lässt den Lauf **fehlschlagen** (→ kein Deployment).
Ablauf dann: siehe [Wackelige Tests (Quarantäne)](#wackelige-tests-quarantäne).

**`deploy-pages.yml`** — Veröffentlicht **genau den getesteten Build**, baut nie neu (ADR-0049):
- `e2e-prod` baut `v3/dist`, testet ihn (smoke + full + PWA) und bewahrt ihn bei Push auf `main`
  als Artefakt `pages-dist` auf (30 Tage); der Deploy lädt dieses Artefakt herunter
- Trigger: `workflow_run` (Tests, completed) — nur wenn erfolgreich, durch **Push** ausgelöst
  und aus **diesem Repo** (kein PR-/Fork-Code) — sowie `workflow_dispatch` (nimmt das Artefakt
  des letzten erfolgreichen Push-Laufs auf `main`; abgelaufen → Tests für den Commit neu starten)
- Scheitert der Deploy, bleibt die bisherige Version live
- Visual Tests werden **nicht** in CI ausgeführt (macOS-only Baselines)

**`weekly.yml`** — Wöchentlicher Kontroll-Lauf, Montag 06:00 UTC (+ manuell per `workflow_dispatch`),
auch ohne Push. Fängt ab, was sich ohne Code-Änderung verschlechtert: neue Sicherheitshinweise zu
unveränderten Paketen, geänderte Runner/Browser, liegengebliebene Dependabot-PRs.
- Job `tests`: ruft `tests.yml` auf (wiederverwendet, nicht kopiert — kann nicht abweichen)
- Job `maintenance`: `npm audit` (alle Stufen) und `npm outdated` als Bericht in der
  Lauf-Zusammenfassung; **Dependabot-PRs, die länger als 14 Tage offen sind, machen den Lauf rot**
- **Rot = Benachrichtigung:** GitHub schickt bei fehlgeschlagenen geplanten Läufen eine Mail
  (Benachrichtigungseinstellungen: BACKLOG T9). Bei Rot: Zusammenfassung des Laufs lesen, PRs
  mergen/reparieren/schließen bzw. Testfehler wie jeden anderen behandeln.
- GitHub deaktiviert geplante Läufe in öffentlichen Repos nach **60 Tagen ohne Aktivität** —
  nach längerer Pause unter *Actions → Weekly check* wieder aktivieren.
- Manuell starten: `gh workflow run weekly.yml`

### Pre-Commit-Hook

Husky-Hook führt vor jedem lokalen Commit aus (in dieser Reihenfolge):
1. `npm run sync:docs` + `git add` (~1s) — Auto-generierte Docs aktualisieren und stagen
2. `npm run build` (~4s)
2a. `npm run typecheck:scripts` (~1s) — Typprüfung der Generatoren/Audits in `scripts/` (`scripts/tsconfig.json`; liegen außerhalb von `v3/`, `npm run build` erfasst sie nicht)
3. lint-staged: Prettier + ESLint auf gestageten Dateien
4. `npm run test` (~2s) — inkl. Wächter-Test `e2eProjects.test.ts`
5. `npm run test:e2e:smoke` (~6s, eigener Server auf Port 5199)
6. `npm run link:check` (~1s) — Tote interne Markdown-Links erkennen

Gesamt ~20s. Schlägt einer der Schritte fehl → Commit wird abgebrochen.

### Pre-Push-Hook

1. Versions-Bump-Check (`APP_VERSION` gegenüber `origin/main`)
1a. `npm audit --audit-level=high` — bekannte Sicherheitslücken der Stufe high/critical blockieren (moderate/low nur Hinweis). Bei Fund: erst `npm audit fix` ohne `--force`; Major-Sprünge einzeln (BACKLOG "Major dependency updates")
2. `npm run size` — Bundle-Größe
3. `npm run test:e2e:all` — Smoke, Full, Mobile gegen den Dev-Server
4. `npm run test:e2e:prod` — Build, dann Smoke, Full und **PWA** gegen den **fertigen Build** (`vite preview`, mit Service Worker)
5. **Nur macOS:** `npm run test:e2e:visual` — visuelle Regression

Schlägt ein Schritt fehl: **zuerst die Fehlerausgabe bzw. den Report lesen**, erst dann
neu starten (ein neuer Lauf überschreibt `playwright-report/`).

---

## Befehle

```bash
# ── Unit ──────────────────────────────────────────────────────────────────
cd v3 && npm run test              # Einmalig ausführen
cd v3 && npm run test:watch        # Watch-Mode (beim Entwickeln)
cd v3 && npm run test:coverage     # Mit Coverage-Report (v3/coverage/)
cd v3 && npm run test:ui           # Browser-Interface

# ── E2E ───────────────────────────────────────────────────────────────────
cd v3 && npm run test:e2e:smoke    # 10 Smoke-Tests (Chromium + WebKit)
cd v3 && npm run test:e2e:full     # Slices-3+4-Tests (Chromium: CRUD, Audio-Engine)
cd v3 && npm run test:e2e:mobile   # Beide Projekte: 5 Spec-Dateien WebKit (2 fixme'd) + 2 Spec-Dateien Chromium
cd v3 && npm run test:e2e          # Smoke + Full kombiniert

# ── Visual Regression (lokal only) ────────────────────────────────────────
cd v3 && npm run test:e2e:visual           # Gegen bestehende Baselines prüfen
cd v3 && npm run test:e2e:update-snapshots # Baselines neu generieren

# ── Lint + Format ─────────────────────────────────────────────────────────
cd v3 && npm run lint          # ESLint (exit 0 = sauber)
cd v3 && npm run lint:fix      # ESLint mit Auto-Fix
cd v3 && npm run format        # Prettier: alle Dateien formatieren
cd v3 && npm run format:check  # Prettier: nur prüfen (CI-Mode)

# ── Bundle Size ───────────────────────────────────────────────────────────
cd v3 && npm run build && npm run size  # Build + Größen-Check
```

---

## Neue Unit-Tests schreiben

Für jede neue Logik-Funktion in `src/lib/` oder `src/state/`:

```typescript
// v3/tests/unit/meineModule.test.ts
import { meineFunktion } from '../../src/lib/meineModule';

describe('meineFunktion', () => {
  test('Beschreibung des erwarteten Verhaltens', () => {
    // Arrange
    const input = { ... };
    // Act
    const result = meineFunktion(input);
    // Assert
    expect(result).toEqual({ ... });
  });

  test('Edge Case: ...',  () => {
    expect(meineFunktion(null)).toBeNull(); // ein Test = eine Annahme
  });
});
```

**Richtlinien:**
- Keine realen Browser-APIs in Unit-Tests (IndexedDB ausnahmsweise via fake-indexeddb)
- Signals in `beforeEach` zurücksetzen (sie sind module-level singletons)
- IDB-Tests: `_resetDB()` + `new IDBFactory()` in `beforeEach`

---

## Neue E2E-Tests schreiben

Für jeden neuen Nutzer-Flow:

```typescript
// v3/tests/e2e/meinFeature.spec.ts
import { test, expect } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, enterSetupMode } from './helpers';

test('beschreibt den Nutzer-Flow in einem Satz', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  // Verifizieren via data-testid
  await expect(page.getByTestId('mode-toggle')).toBeVisible();
});
```

**Richtlinien:**
- Jeder Test ist self-contained (eigener Zustand, keine Abhängigkeit von anderen Tests)
- `page.goto('/soundboard-of-storytelling/')` am Anfang jedes Tests (IndexedDB ist per Browser-Context isoliert)
- **Selector-Priorität**: `getByTestId` > `getByRole` > `.filter({ hasText })` > CSS-Klasse
- Tests in der `full`-Suite müssen in Chromium bestehen; Smoke auch in WebKit
- Neue Spec-Datei **immer in `tests/e2e/projects.ts` eintragen** — sonst schlägt der Wächter-Test fehl
- Wackelige Tests: siehe [Wackelige Tests (Quarantäne)](#wackelige-tests-quarantäne)

### Wohin gehört der Test?

| Flow | Datei | Projekt |
|------|-------|---------|
| Kern-Navigation, App-Start | `tests/e2e/*.spec.ts` (`SMOKE_TESTS` in `projects.ts`) | `smoke` |
| Feature-Verifikation | `tests/e2e/<feature>.spec.ts` (`FULL_TESTS` in `projects.ts`) | `full` |
| Touch-wiring (audio-free), Touch-Targets, Overflow | `tests/e2e/mobile/*` (audio-free specs) | `mobile` (WebKit) |
| Touch-wiring (pad tap → is-hot/is-looping, pad creation) | `tests/e2e/mobile/*` (audio-dependent specs) | `mobile-chromium` (Chromium) |
| Pixel-Vergleich | `tests/e2e/visual/*.spec.ts` | `visual` |
| Feature-Flows ohne Abspielen, zusätzlich in WebKit | Eintrag in `FULL_TESTS` **und** `FULL_WEBKIT_TESTS`; Library über `ensureTestAudio` (Chromium: echter Upload, WebKit: vorbelegt) | `full` + `full-webkit` |
| Service Worker, Manifest, Offline (nur fertiger Build) | `tests/e2e/pwa.spec.ts` (`PWA_TESTS`) | `pwa` — nur mit `E2E_TARGET=prod` |

---

## Tests aktualisieren

- Bei Funktions-Änderung: Tests anpassen ist Teil der Aufgabe, nicht optional
- Bei UI-Änderung (Texte, Struktur): E2E-Selektoren sofort prüfen und korrigieren
- Bei Visual-Regression-Änderung (Slice 8 / Polish): `npm run test:e2e:update-snapshots` lokal ausführen, neue Baseline committen
- Bei wackeligen Tests: festes Verfahren, siehe unten.

### Untergrenze der Testabdeckung (T6)

`v3/vitest.config.ts` → `coverage.thresholds` (knapp unter dem gemessenen Stand). CI führt
`npm run test:coverage` aus — sinkt die Abdeckung darunter, schlägt CI fehl. Die Grenzen werden
**nur angehoben**: beim Slice-Abschluss auf die neuen Messwerte, abgerundet.

### WebKit und IndexedDB-Blobs

Playwrights WebKit läuft in einem kurzlebigen Profil (wie Safaris privates Surfen) und kann
**keine Blobs in IndexedDB speichern** (geprüft 2026-09-29; ArrayBuffer geht). Deshalb legt
`seedTestAudio` den Library-Eintrag in WebKit **ohne** Audiodaten an. Offene Produktfrage dazu:
BACKLOG „Library audio as Blob — Safari Private Browsing“.

### Automatisch gesperrte Test-Fallen (T10)

ESLint blockiert beim Commit Tests, die aus dem falschen Grund bestehen würden
(`@vitest/eslint-plugin`, `eslint-plugin-playwright`, Konfiguration in `v3/eslint.config.js`):

| Regel | Verhindert |
|---|---|
| `expect-expect` | Test ohne Prüfung — besteht immer. Prüf-Helfer (z. B. `assertTarget`) müssen in `assertFunctionNames` eingetragen werden. |
| `no-focused-test(s)` | `.only` — alle anderen Tests fallen still weg. Playwright zusätzlich `forbidOnly: true`. |
| `no-skipped-test` (inkl. `fixme`) / `no-disabled-tests` | stilles Abschalten |
| `valid-expect` | `expect(x)` ohne Prüfmethode, fehlendes `await` |

Begründete Ausnahme (Quarantäne) nur so — sichtbar, mit Grund:
```ts
// eslint-disable-next-line playwright/no-skipped-test -- quarantine: <Grund> (BACKLOG "<Eintrag>")
test.fixme('…', async () => {});
```
Bekannte Fehler im App-Code werden mit Vitest `test.fails` + einem präzisen Test des
Ist-Verhaltens + BACKLOG-Eintrag festgehalten (Beispiel: `tests/unit/audio/engine.test.ts`).

**Gegenprobe (Pflicht für jeden neuen Test):** den geprüften Code gezielt kaputt machen →
der Test muss rot werden; danach den Code per Kopie wiederherstellen und mit `git diff`
prüfen, dass nichts zurückbleibt.

### Wackelige Tests (Quarantäne)

Ein Test, der mal besteht und mal nicht, ist ein Fehler — im Test oder in der App.

1. **Beweise sichern:** Fehlerausgabe und `playwright-report/` (bzw. CI-Artifact) lesen, **bevor** neu gestartet wird.
2. **Ursache suchen und beheben** (Timing, fehlendes Warten auf einen Zustand, echter App-Fehler).
3. **Nur wenn das nicht sofort geht:** Quarantäne mit `test.fixme(…)` **und** Begründung im Testnamen/Kommentar **und** BACKLOG-Eintrag. Nie stillschweigend `skip`, nie Retries hochdrehen.

---

## Bekannte Fallstricke

### 1. Preact Signals sind module-level Singletons

Signals (`boards`, `currentBoardId` etc.) in `src/state/store.ts` persistieren
zwischen Tests, weil der Modul-Cache nicht zurückgesetzt wird. Lösung: `beforeEach`
mit explizitem Reset:

```typescript
beforeEach(() => {
  boards.value = [];
  currentBoardId.value = null;
  // ... weitere Signals die der Test berührt
});
```

### 2. IDB-Singleton in idb.ts

`idb.ts` hält `let _db` als Modul-Singleton. Ohne Reset würde jeder Test in
derselben Fake-DB-Instanz operieren. Lösung: `_resetDB()` aus `idb.ts` exportiert
und in `beforeEach` aufrufen (zusammen mit `new IDBFactory()`).

### 3. CSS textTransform ist visuell-only

`textTransform: uppercase` im CSS zeigt Text großgeschrieben an, aber der DOM-Wert
ist immer der gespeicherte (gemischte) String. Playwright-Assertions müssen den
gespeicherten String verwenden:
- ✅ `await expect(el).toContainText('My Renamed Board')`
- ❌ `await expect(el).toContainText('MY RENAMED BOARD')` (scheitert auch wenn visuell uppercase)

### 4. Visual Regression: macOS vs. Ubuntu

Screenshot-Baselines (`.png`-Dateien mit `-darwin.png`-Suffix) passen nur auf macOS.
Ubuntu-CI rendert Fonts anders → Visual-Tests sind aus CI ausgeschlossen.
Nur lokal ausführen. Bei UI-Änderungen: Baselines lokal neu generieren + committen.

### 5. Pointer-Events-Drag in Playwright

Tests 9, 14, 20, 21 (Deck-Reorder, Library-Drag Path B, Pad SWAP, Pad INSERT)
erfordern pointer-event-basiertes Drag (`mouse.down + move + up`). Diese Tests
sind als `test.skip` markiert — in Phase 3 aktivieren wenn Drag-Sequenz stabil ist.

### 6. WebKit headless: no audio codec support

Playwright's headless WebKit build does not include audio codec support. Calls to
`AudioContext.decodeAudioData()` with a WAV (or most other formats) fail with a
`DOMException`. In `processFilesSerial`, this error is caught and the file is
skipped — the library item is never stored, and any test waiting for the filename
in the UI will time out.

Additionally, `setInputFiles()` on a `display:none` input does **not** dispatch the
`change` event in Playwright WebKit, so the upload pipeline never starts.

**Fix (mobile tests):** Audio-dependent mobile specs (`mobile-pad-interaction`,
`mobile-pad-creation`) run under the `mobile-chromium` project (Chromium + iPhone 13
Pro device settings). Chromium decodes WAV correctly, and `setInputFiles` works on
hidden inputs. Audio-free specs (`mobile-unlock-nav`, etc.) continue running under
the `mobile` (WebKit) project to exercise the real Safari engine path.

**Fix (file upload in WebKit):** In WebKit specs that need uploads, use
`mobileUploadTestAudio(page)` from `tests/e2e/mobile/mobile-helpers.ts`. This uses
`page.waitForEvent('filechooser')` + `tap()` on the IMPORT button, which triggers
a real filechooser event that Playwright can intercept and satisfy with the test file.

A `patchAudioDecodeForWebKit` approach was attempted (replacing `decodeAudioData` via
`addInitScript`) but does not work: Playwright's WebKit runs `addInitScript` in an
isolated context that does not affect the app's main realm, so the mock is never applied.

### 7. getByText-Ambiguität in Playwright

`page.getByText('X')` schlägt fehl wenn "X" mehrfach im DOM vorkommt (strict mode
violation). Immer präzisere Selektoren verwenden:
- `page.getByTestId('...')`
- `.locator('.some-class').filter({ hasText: 'X' })`
- `getByRole('button', { name: /X/ })`
