/**
 * @fileoverview Files of the repository — for guard tests and doc generators
 *
 * Tracked and new (not ignored) files — `.gitignore` decides what belongs to the repository, not
 * a hand-kept skip list per guard. (Hand-kept lists missed the Stryker sandbox `.stryker-tmp/`
 * and turned two guards red while a mutation run was active, 2026-09-30.)
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Repository-relative paths ('/' separators) of all tracked and new, not ignored files. */
export function repoFiles(root: string): string[] {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => f && existsSync(join(root, f))); // --cached still lists files deleted in the worktree
}
