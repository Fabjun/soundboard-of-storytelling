# Soundboard of Storytelling

A soundboard for live storytelling at the table. It lets whoever runs a game — storyteller,
narrator or game master — play music, ambience and sound effects at the right moment
without drawing attention away from the players.

The app runs in the browser and can be installed like a native app on phones, tablets and
computers. Audio files and boards are stored locally on the device: no account, no server,
and it keeps working offline.

**Live version:** https://fabjun.github.io/soundboard-of-storytelling/

## Status

In active development and not yet feature-complete. Version 3 is a complete rewrite of
an earlier prototype.

Available now:

- Audio library with import, renaming, deletion and waveform preview
- Boards with a shared pad pool; decks are hand-picked views of it, and an overview lists every
  pad of a board, sortable
- Three pad types: one-shot sounds and loops, each with one or several files, and combos that
  start other pads in steps
- Combo editor for building sequences from existing pads
- Pad editor with waveform preview, trim, fades, repeat count, icons and several files per pad
- Live control: pads on numeric-keypad keys, stop all in two stages (fade, then cut), stop the
  last sound, pause and resume, a lock that keeps the play mode, and a visible saving status
- Backup and restore of all boards and audio in a single file, including migration from the
  prototype
- Separate modes for preparing a board (SETUP) and for playing during a session (GAME)
- Works with the keyboard alone and with screen readers; text follows the system text size
- Installable, offline-capable web app

Planned next:

- Layout for smartphones of all sizes, with a quick-access bar and search
- Settings and themes
- Library at the prototype's full scope with pad templates, help on first launch, undo and redo

## Technology

Preact and TypeScript, built with Vite. Data is stored in IndexedDB, audio runs on the
Web Audio API, and a service worker provides offline support.

Every change passes an automated test suite before it is deployed: unit tests (Vitest) and
end-to-end tests (Playwright) in Chromium and WebKit, including tests against the
production build.

## Development

Requires Node.js 24 (see `.nvmrc`).

```bash
cd v3
npm install
npm run dev        # development server
npm run test       # unit tests
npm run test:e2e   # end-to-end tests
npm run build      # production build
```

## Documentation

| Document                                                                 | Content                                     |
| ------------------------------------------------------------------------ | ------------------------------------------- |
| [docs/product/README.md](docs/product/README.md)                         | Product concept                             |
| [docs/architecture/concept-brief.md](docs/architecture/concept-brief.md) | Technical architecture                      |
| [docs/architecture/](docs/architecture/README.md)                        | Architecture decision records               |
| [docs/design/design-system.md](docs/design/design-system.md)             | Design tokens, CSS rules, component anatomy |
| [docs/development/testing.md](docs/development/testing.md)               | Test strategy, commands and conventions     |
| [docs/backlog.md](docs/backlog.md)                                       | Open work items and known limitations       |
| [CLAUDE.md](CLAUDE.md)                                                   | Development workflow and coding standards   |

## License

Proprietary. Copyright © 2026 Fabian Jung. All rights reserved.

The source code is publicly visible but may not be used, copied, modified or distributed
without prior written permission. See [LICENSE](LICENSE).
Enquiries: soundboard_of_storytelling@pm.me
