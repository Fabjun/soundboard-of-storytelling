# Review log — work done while the owner was away

Started 2026-10-01 on the owner's instruction (translated from German): _"Could you take these
decisions on your own for now, and afterwards we go through everything you built together and
rework it? … The main thing is that everything is logged."_

## How to review

- **Provisional decisions** (new schemes, feature and slice work, product behaviour) live on their
  own branch with a pull request — **not merged**; `main` deploys live. Each PR description lists
  its decisions in the format below. Review order = the order of this log; slice branches are
  stacked (each on top of the previous one).
- **Work on `main`** is limited to what was already approved (T11c test work, thresholds by the
  agreed rules) — listed under [On main](#on-main) for the record.
- Nothing irreversible: no data deleted, no public texts or repository settings changed, no
  migration touching real user data.

Decision format: **Question** · **Options** · **Choice** · **Reason** · **Status:** provisional —
review pending.

## Pull requests to review

| #   | Branch                                                                                                               | Topic                                                                                       | Decisions                                             | Status |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------ |
| 1   | `s6-commit-convention` — [PR #30](https://github.com/Fabjun/soundboard-of-storytelling/pull/30)                      | S6 commit message convention (ADR-0060, Proposed)                                           | [S6](#s6--commit-message-convention)                  | open   |
| 2   | `slice-9c-pad-pool` — [PR #31](https://github.com/Fabjun/soundboard-of-storytelling/pull/31)                         | Slice 9c: pad pool, placements, quick-access model, DB v4                                   | D1–D7 in the PR description; interim risk until 9e    | open   |
| 3   | `slice-9e-all-pads` — [PR #32](https://github.com/Fabjun/soundboard-of-storytelling/pull/32) (stacked on #31)        | Slice 9e: All pads view, remove from deck vs delete pad, deck checklist                     | E1–E8 in the PR description; auto-save bug fixed      | open   |
| 4   | `board-writes` — [PR #33](https://github.com/Fabjun/soundboard-of-storytelling/pull/33) (stacked on #32)             | Every board change builds on the latest board (`updateBoard`); 5 lost-change bugs           | O3, O5, O8 (owner)                                    | open   |
| 5   | `all-pads-owner-decisions` — [PR #34](https://github.com/Fabjun/soundboard-of-storytelling/pull/34) (stacked on #33) | Pads without a deck from All pads; boards reopen in their last view; reloads wait for saves | O2, O7 (owner); localStorage key scheme (provisional) | open   |

### S6 — commit message convention

- **Question:** Which scheme for commit messages, and how is it checked?
- **Options:** (a) Conventional Commits + commitlint in a commit-msg hook and in CI for PRs;
  (b) convention by habit, no check; (c) commitizen prompt.
- **Choice:** (a), with `@commitlint/config-conventional`; rule `subject-case` off.
- **Reason:** 206 of 213 commits already follow Conventional Commits (measured); every other scheme
  here is checked mechanically. `subject-case` rejected 13 of the last 60 commits only because the
  subject starts with a proper noun ("Preact 11", "ESLint").
- **Status:** provisional — review pending.

## Decided with the owner

2026-10-02, in a short session (questions and answers in the chat; translated):

| #   | Question                                            | Decision                                                                                  | Where                         |
| --- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| O1  | Engine bug: a combo step starts the next step twice | Prepare the fix on its own branch; the owner tests playback and approves it before `main` | branch (ADR-0048 engine rule) |
| O2  | May All pads create pads (ADD PAD, library drop)?   | Yes — such a pad sits in no deck (reverses provisional E2)                                | PR #34                        |
| O3  | When does a board change show?                      | At once, then it is saved; a failed save shows the stored board again                     | PR #33                        |
| O4  | Open PRs                                            | Reviewed together later, in the browser                                                   | —                             |
| O5  | Name of a new deck after a delete                   | Smallest unused "Deck N" (fills the gap)                                                  | PR #33                        |
| O6  | A full deck in the PAD editor checklist             | Disabled with "(full)" (confirms E3)                                                      | PR #32                        |
| O7  | Which view opens with a board?                      | The view it showed last — a deck or All pads (reverses E7)                                | PR #34                        |
| O8  | Deck tab badge                                      | Position in the rail, 1, 2, 3 … without gaps                                              | PR #33                        |

## On main

Approved work continued directly on `main` (each commit passed all hooks; CI results noted).

| Commit  | What                                                                                                                                                                                                                                                                                                                                                                                                          | Evidence                                                                                                                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 968653e | Mutation testing: heap cap per test process; summary job fails on a missing module                                                                                                                                                                                                                                                                                                                            | weekly run 36825054856: engine.ts job exhausted 16 GB (memory logged); locally with the cap: 0.4–2 GB over 371 mutants                                                                                       |
| 2a7b881 | Mutation break threshold 59 → 68                                                                                                                                                                                                                                                                                                                                                                              | first complete CI run 36827375932: 68.89 % (1,249 of 1,813), timeouts 0.22 %, engine.ts in 15 min                                                                                                            |
| 4d85195 | Targeted engine tests (combo children, fade out all); **found a real engine bug**: a combo step starts the next step twice when a child ends at once — pinned with `test.fails`, fix needs the owner (ADR-0048 rule)                                                                                                                                                                                          | 13 new tests, 9 planted engine bugs each turned the matching test red; engine.ts unchanged                                                                                                                   |
| 6e6fbdd | E2E safety: (1) WebKit seed helper created an empty database in a race and broke the app's boot (4 WebKit specs red on main, deterministic locally) — the seed now never creates the database and retries; (2) `if` around assertions found 3×, lint rules `playwright/no-conditional-in-test` + `no-conditional-expect` now errors, the 3 specs assert unconditionally; (3) mutation break threshold 68 → 73 | (1) measured: seed opened an empty v1 at t=111 ms, app failed at t=211 ms; red again without the fix, green 3× with it; (2) rule red on a planted `if`; (3) weekly run 36830307454: 73.52 %, timeouts 0.28 % |
