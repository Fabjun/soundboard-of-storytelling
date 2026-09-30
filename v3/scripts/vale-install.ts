#!/usr/bin/env tsx
/**
 * vale-install.ts
 *
 * Installs the Vale prose linter (https://vale.sh) into v3/node_modules/.bin/vale — pinned
 * version, downloaded from the official GitHub release and verified against SHA-256 hashes
 * pinned HERE (not only against the release's own checksums file, which comes from the same
 * source). Vale is a Go binary, not an npm package, so npm/Dependabot cannot pin it; the weekly
 * check reports newer releases (T13, ADR-0056).
 *
 * Runs from `npm install` / `npm ci` (prepare script); idempotent — skips if the pinned version
 * is already installed. Run manually: npm run vale:install (from v3/).
 */

import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

export const VALE_VERSION = '3.23.0';

/** SHA-256 of the release archives (from vale_3.23.0_checksums.txt, verified 2026-09-30). */
const SHA256: Record<string, string> = {
  'macOS_arm64.tar.gz': 'b913574b2c83b541d8bc2d8938e53a58a2fb06bab15135efcc755afb074f4430',
  'macOS_64-bit.tar.gz': '416fdd3ba32e32dc71c87b479cb86757bb6437bcebc7a3e4a095e863b7ce583d',
  'Linux_64-bit.tar.gz': 'cc35445a45186b8f0b01e11c01359694cf941e72cf6ab0fc44774f0e54c9d5fc',
  'Linux_arm64.tar.gz': '45720aadcb01401ac394641287a2c74e094045a89a450f5edcf98c8969df0884',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = resolve(__dirname, '..', 'node_modules', '.bin');
const TARGET = join(BIN_DIR, 'vale');

function platformAsset(): string {
  const os = process.platform === 'darwin' ? 'macOS' : process.platform === 'linux' ? 'Linux' : '';
  const arch = process.arch === 'arm64' ? 'arm64' : process.arch === 'x64' ? '64-bit' : '';
  const asset = `${os}_${arch}.tar.gz`;
  if (!SHA256[asset])
    throw new Error(`vale-install: unsupported platform ${process.platform}/${process.arch}`);
  return asset;
}

function installedVersion(): string | null {
  if (!existsSync(TARGET)) return null;
  try {
    return (
      execFileSync(TARGET, ['--version'], { encoding: 'utf8' }).trim().split(' ').pop() ?? null
    );
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  if (installedVersion() === VALE_VERSION) {
    console.log(`✅ vale ${VALE_VERSION} already installed.`);
    return;
  }
  const asset = platformAsset();
  const url = `https://github.com/vale-cli/vale/releases/download/v${VALE_VERSION}/vale_${VALE_VERSION}_${asset}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`vale-install: download failed (${response.status}) ${url}`);
  const archive = Buffer.from(await response.arrayBuffer());

  const actual = createHash('sha256').update(archive).digest('hex');
  if (actual !== SHA256[asset]) {
    throw new Error(
      `vale-install: SHA-256 mismatch for ${asset} — expected ${SHA256[asset]}, got ${actual}`,
    );
  }

  const work = mkdtempSync(join(tmpdir(), 'vale-'));
  try {
    writeFileSync(join(work, asset), archive);
    execFileSync('tar', ['-xzf', join(work, asset), '-C', work, 'vale']);
    mkdirSync(BIN_DIR, { recursive: true });
    renameSync(join(work, 'vale'), TARGET);
    chmodSync(TARGET, 0o755);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  console.log(`✅ vale ${installedVersion()} installed (${asset}, SHA-256 verified).`);
}

main().catch((err: unknown) => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
