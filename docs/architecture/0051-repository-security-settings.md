# ADR-0051: Repository security settings

**Status:** Accepted
**Date:** 2026-09-29
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

The repository is public and deploys to GitHub Pages. A settings review on 2026-09-29
(BACKLOG T9) found every repository-level protection switched off: no Dependabot alerts or
security updates, no secret scanning or push protection, no private vulnerability
reporting, no protection of `main` against force-push or deletion, any third-party action
allowed, and fork pull-request workflows gated only for first-time contributors. Already
in place: read-only default workflow token, HTTPS enforced on Pages, the `github-pages`
environment deploying only from `main`.

## Decision

Enabled on the repository (set via `gh api`, 2026-09-29):

| Setting | Value |
|---|---|
| Dependabot alerts | on |
| Dependabot security updates | on — fix PRs run through the Tests workflow; stale ones turn the weekly check red (ADR-0049 / `weekly.yml`) |
| Secret scanning + push protection | on |
| Private vulnerability reporting | on — policy in `.github/SECURITY.md` |
| Ruleset `protect-main` | `main`: no force-push (`non_fast_forward`), no deletion; **no bypass**, also not for admins. Pull requests are *not* required — direct pushes stay the workflow |
| Allowed actions | GitHub-owned only (`actions/*`, `github/*`); third-party actions need an explicit decision |
| Fork PR workflows | approval required for all external contributors |

Owner-only (account level, not readable with the CLI token): two-factor authentication;
e-mail notification for failed workflow runs (needed for the weekly check).

`SECURITY.md` lives in `.github/` — the repository root is reserved for the four standard
files (ADR-0050); GitHub recognises both locations.

**Verify:**
`gh api repos/Fabjun/soundboard-of-storytelling --jq .security_and_analysis`,
`gh api repos/Fabjun/soundboard-of-storytelling/rules/branches/main`,
`gh api repos/Fabjun/soundboard-of-storytelling/actions/permissions/selected-actions`.

## Consequences

**Positiv:**
- Leaked tokens are blocked before they reach the public history.
- Known vulnerabilities surface as alerts and fix PRs without waiting for the weekly audit.
- `main` history cannot be rewritten or deleted — also not by an agent mistake.
- A compromised third-party action cannot run in CI without a deliberate change.

**Negativ / Trade-offs:**
- A genuinely needed history rewrite on `main` requires disabling the ruleset first.
- Adopting a third-party action requires changing the allowed-actions setting.
- Settings live outside the repository; drift is only caught by re-running the verify
  commands (not automated — the workflow token cannot read admin settings).

## Alternatives Considered

**Require pull requests with status checks for `main`:** strongest gate, but changes the
solo workflow (direct pushes, pre-push hook as local gate). Not now.

**Pin actions to commit SHAs:** stronger supply-chain protection; deferred — GitHub-owned
actions only, Dependabot keeps versions current.

## Related

- **Dateien:** `.github/SECURITY.md`, `.github/dependabot.yml`, `.github/workflows/`
- **ADRs:** ADR-0040, ADR-0049 (deployment), ADR-0050 (root file allowlist)
- **Quelldokumente:** `docs/backlog.md` T9
- **Commits:** see git log "…(T9)"
