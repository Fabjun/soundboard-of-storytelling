// Commit messages follow Conventional Commits 1.0.0 (https://www.conventionalcommits.org) — the
// rules of @commitlint/config-conventional. Checked by .husky/commit-msg and, for pull requests,
// in CI (ADR-0060). Exceptions follow ADR-0053: rule + reason.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Off: subjects often start with a proper noun ("Preact 11", "ESLint …", "ADR-0048 …");
    // the rule rejected 13 of the last 60 commits for that alone (measured 2026-10-01).
    'subject-case': [0],
  },
};
