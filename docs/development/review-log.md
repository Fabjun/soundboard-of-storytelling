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

| #   | Branch                 | Topic                                             | Decisions                            | Status |
| --- | ---------------------- | ------------------------------------------------- | ------------------------------------ | ------ |
| 1   | `s6-commit-convention` | S6 commit message convention (ADR-0060, Proposed) | [S6](#s6--commit-message-convention) | open   |

### S6 — commit message convention

- **Question:** Which scheme for commit messages, and how is it checked?
- **Options:** (a) Conventional Commits + commitlint in a commit-msg hook and in CI for PRs;
  (b) convention by habit, no check; (c) commitizen prompt.
- **Choice:** (a), with `@commitlint/config-conventional`; rule `subject-case` off.
- **Reason:** 206 of 213 commits already follow Conventional Commits (measured); every other scheme
  here is checked mechanically. `subject-case` rejected 13 of the last 60 commits only because the
  subject starts with a proper noun ("Preact 11", "ESLint").
- **Status:** provisional — review pending.

## On main

Approved work continued directly on `main` (each commit passed all hooks; CI results noted).

| Commit      | What                                                                               | Evidence                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| _see below_ | Mutation testing: heap cap per test process; summary job fails on a missing module | weekly run 36825054856: engine.ts job exhausted 16 GB (memory logged); locally with the cap: 0.4–2 GB over 371 mutants |
