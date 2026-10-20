/**
 * Vera Fast - ESLint on changed .ts/.tsx + Vera Logic (repo rules/contracts).
 * Falls back to linting the whole tree when there is no git diff.
 * Usage: node scripts/vera-fast.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function getChangedFiles() {
  const commands = [
    'git diff --name-only --diff-filter=ACMRTUXB HEAD',
    'git diff --cached --name-only --diff-filter=ACMRTUXB',
    'git ls-files --others --exclude-standard',
  ];
  const files = new Set();
  for (const cmd of commands) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      for (const line of out.split('\n')) {
        const trimmed = line.trim().replace(/\\/g, '/');
        if (trimmed && (trimmed.endsWith('.ts') || trimmed.endsWith('.tsx'))) {
          files.add(trimmed);
        }
      }
    } catch {
      // ignore
    }
  }
  return [...files];
}

let failed = false;

let files = getChangedFiles();
let scope = 'changed';
if (files.length === 0) {
  const srcDir = path.join(process.cwd(), 'src', 'renderer');
  files = walk(srcDir, [])
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map((f) => path.relative(process.cwd(), f).replace(/\\/g, '/'));
  scope = 'full';
}

if (files.length === 0) {
  console.log('🧪 Vera fast: no TS/TSX files - eslint skipped.');
} else {
  console.log(`🧪 Vera fast: eslint on ${files.length} ${scope} file(s)`);
  try {
    execSync(`npx eslint --no-warn-ignored ${files.join(' ')}`, {
      stdio: 'inherit',
      encoding: 'utf8',
    });
    console.log('✅ Vera fast: eslint passed');
  } catch {
    console.log('❌ Vera fast: eslint failed');
    failed = true;
  }
}

try {
  execSync('node scripts/vera-logic.mjs', {
    stdio: 'inherit',
    encoding: 'utf8',
  });
} catch {
  failed = true;
}

if (failed) {
  console.log('❌ Vera fast: failed');
  process.exit(1);
}

console.log('✅ Vera fast: passed (eslint + logic)');
process.exit(0);
