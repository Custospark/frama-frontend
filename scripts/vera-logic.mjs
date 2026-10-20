/**
 * Vera Logic - repo rules & contracts for the Frama frontend (not ESLint).
 * Runs on every Vera Fast handoff after lint.
 *
 * When the working tree is not a git repo (or has no changes), the checks
 * fall back to scanning the whole src/renderer tree so Vera still works.
 *
 * Usage: node scripts/vera-logic.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MAX_LINES = 500;

/** @typedef {{ id: string, ok: boolean, detail: string }} RuleResult */

function read(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function lineCount(relPath) {
  const text = read(relPath);
  if (text == null) return 0;
  return text.split(/\r?\n/).length;
}

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

function rel(full) {
  return path.relative(ROOT, full).replace(/\\/g, '/');
}

/** Changed files from git (diff + staged + untracked). Empty when not a repo. */
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
        if (trimmed) files.add(trimmed);
      }
    } catch {
      // Not a git repo, or git unavailable - ignore.
    }
  }
  return [...files];
}

/** Source files under src/renderer, used as the fallback scan target. */
function getSourceFiles() {
  const srcDir = path.join(ROOT, 'src', 'renderer');
  return walk(srcDir, []).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx')).map(rel);
}

/** Changed TS/TSX under src/, or all source files when there is no diff. */
function getChangedTsFiles() {
  const changed = getChangedFiles()
    .filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && f.startsWith('src/'));
  return changed.length > 0 ? changed : getSourceFiles();
}

function getScanFiles() {
  const changed = getChangedFiles();
  return changed.length > 0 ? changed : getSourceFiles();
}

/** Resolve a relative import specifier to an existing file under ROOT. */
function relativeImportExists(fromFile, specifier) {
  const clean = specifier.split('?')[0];
  if (!clean.startsWith('.')) return true;
  const fromDir = path.dirname(path.join(ROOT, fromFile));
  const base = path.resolve(fromDir, clean);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.css`,
    `${base}.json`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ];
  const srcBase = clean.replace(/\.(js|jsx|mjs)$/, (_, ext) => `.${ext === 'mjs' ? 'mts' : ext === 'jsx' ? 'tsx' : 'ts'}`);
  if (srcBase !== clean) {
    candidates.push(path.resolve(fromDir, srcBase));
  }
  return candidates.some((candidate) => fs.existsSync(candidate));
}

/** @returns {RuleResult} */
function checkRelativeImports(changedFiles) {
  const importRe = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g;
  const broken = [];

  for (const file of changedFiles) {
    const text = read(file);
    if (text == null) continue;
    importRe.lastIndex = 0;
    let match;
    while ((match = importRe.exec(text)) !== null) {
      const spec = match[1];
      if (!spec) continue;
      if (!relativeImportExists(file, spec)) {
        broken.push(`${file} → ${spec}`);
      }
    }
  }

  if (broken.length) {
    return {
      id: 'relative-imports',
      ok: false,
      detail: `Unresolved relative import(s): ${broken.slice(0, 8).join('; ')}${broken.length > 8 ? ` (+${broken.length - 8} more)` : ''}`,
    };
  }

  return {
    id: 'relative-imports',
    ok: true,
    detail: `Relative imports resolve for ${changedFiles.length} file(s)`,
  };
}

/** @returns {RuleResult[]} */
function checkFileSizeLimit(changedFiles) {
  const results = [];
  for (const file of changedFiles) {
    const lines = lineCount(file);
    if (lines > MAX_LINES) {
      results.push({
        id: 'file-size-500',
        ok: false,
        detail: `${file} has ${lines} lines (max ${MAX_LINES})`,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      id: 'file-size-500',
      ok: true,
      detail: `Source files ≤ ${MAX_LINES} lines (${changedFiles.length} checked)`,
    });
  }

  return results;
}

const BINARY_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.woff', '.woff2',
  '.ttf', '.eot', '.mp3', '.mp4', '.pdf', '.zip', '.gz', '.wasm',
]);
const SKIP_PATHS = ['/node_modules/', '/vendor/', '/dist/', '/.git/'];

function isTextFile(relPath) {
  if (SKIP_PATHS.some((p) => relPath.includes(p))) return false;
  const ext = relPath.toLowerCase().slice(relPath.lastIndexOf('.'));
  return !BINARY_EXT.has(ext);
}

/**
 * Flag em/en dashes used as prose separators (e.g. "revenue—today"). A bare
 * '—' placeholder glyph used for "no value" in tables/formatting is allowed.
 * @returns {RuleResult}
 */
function checkNoLongDashes(changedFiles) {
  const offenders = [];
  for (const file of changedFiles) {
    if (!isTextFile(file)) continue;
    const text = read(file);
    if (text == null) continue;
    // Dash adjacent to a word character => prose usage, not a placeholder glyph.
    if (/[\p{L}\p{N}][\u2014\u2013]|[\u2014\u2013][\p{L}\p{N}]/u.test(text)) {
      offenders.push(file);
    }
  }
  if (offenders.length) {
    return {
      id: 'no-long-dashes',
      ok: false,
      detail: `Long dash (em/en) in prose found in file(s): ${offenders.slice(0, 8).join(', ')}${offenders.length > 8 ? ` (+${offenders.length - 8} more)` : ''} - use a plain hyphen instead`,
    };
  }
  return {
    id: 'no-long-dashes',
    ok: true,
    detail: 'No em/en dashes in prose (placeholder glyphs allowed)',
  };
}

/** PIN-only auth: login must use a PIN field and there must be no email/login password form. */
function checkPinOnlyAuth() {
  const login = read('src/renderer/modules/auth/LoginPage.tsx') ?? '';
  const hasPin = /PinInput/.test(login);
  const hasPassword = /type=["']password["']/.test(login) || /name=["']password["']/.test(login);
  if (!hasPin || hasPassword) {
    return {
      id: 'pin-only-auth',
      ok: false,
      detail: 'LoginPage must use PinInput and expose no email/password field (PIN login only)',
    };
  }
  return {
    id: 'pin-only-auth',
    ok: true,
    detail: 'Login uses a PIN field with no email/password form',
  };
}

/** The auth footer must credit the developer. */
function checkDeveloperCredit() {
  const layout = read('src/renderer/modules/auth/AuthLayout.tsx') ?? '';
  const brand = read('src/renderer/shared/brand/framaBrand.ts') ?? '';
  const credit = /DEVELOPER_NAME|Custospark Company Ltd/.test(layout) && /Custospark Company Ltd/.test(brand);
  if (!credit) {
    return {
      id: 'developer-credit',
      ok: false,
      detail: 'Auth footer must credit "Custospark Company Ltd" (developer) via framaBrand DEVELOPER_NAME',
    };
  }
  return {
    id: 'developer-credit',
    ok: true,
    detail: 'Auth layout credits Custospark Company Ltd as developer',
  };
}

/** Product identity must be Frama Investments Ltd, sourced from framaBrand. */
function checkProductBrand() {
  const brand = read('src/renderer/shared/brand/framaBrand.ts') ?? '';
  const ok = /PRODUCT_NAME\s*=\s*['"]Frama Investments Ltd['"]/.test(brand);
  return {
    id: 'product-brand',
    ok,
    detail: ok
      ? 'PRODUCT_NAME is "Frama Investments Ltd"'
      : 'framaBrand.ts must set PRODUCT_NAME = "Frama Investments Ltd"',
  };
}

/** Route constants must expose manager + admin surfaces for the core flows. */
function checkRouteConstants() {
  const paths = read('src/renderer/app/routes/constants/shared.paths.ts') ?? '';
  const required = [
    /MANAGER\s*:\s*\{[\s\S]*?NEW_REPORT\s*:\s*['"]\/manager\/report['"]/,
    /ADMIN\s*:\s*\{[\s\S]*?REPORTS\s*:\s*['"]\/admin\/reports['"]/,
    /ADMIN\s*:\s*\{[\s\S]*?BUSINESS_TYPES\s*:\s*['"]\/admin\/business-types['"]/,
    /LOGIN\s*:\s*['"]\/login['"]/,
  ];
  const missing = required.filter((re) => !re.test(paths)).length;
  if (missing) {
    return {
      id: 'route-constants',
      ok: false,
      detail: 'shared.paths.ts is missing core route constants (login, manager report, admin reports, business types)',
    };
  }
  return {
    id: 'route-constants',
    ok: true,
    detail: 'Core route constants present (login, manager report, admin reports, business types)',
  };
}

/** Business types/fields must be API-driven: no hardcoded type lists in asset/report surfaces. */
function checkBusinessTypesApiDriven() {
  const checks = [
    { file: 'src/renderer/modules/assets/AssetsPage.tsx', re: /useBusinessTypes/ },
    { file: 'src/renderer/modules/report/ReportForm.tsx', re: /useCustomFields\(['"]report['"]\)|useBusinessTypes/ },
    { file: 'src/renderer/modules/businesstypes/BusinessTypeQueries.ts', re: /ENDPOINTS\.BUSINESS_TYPES/ },
  ];
  const offenders = checks.filter(({ file, re }) => {
    const text = read(file);
    return text == null || !re.test(text);
  }).map((c) => c.file);
  if (offenders.length) {
    return {
      id: 'business-types-api-driven',
      ok: false,
      detail: `Business types/fields must be API-driven: ${offenders.join(', ')}`,
    };
  }
  return {
    id: 'business-types-api-driven',
    ok: true,
    detail: 'Assets and reports source business types/fields from the API',
  };
}

/** A business-types endpoint must be registered in endpoints.ts. */
function checkBusinessTypesEndpoint() {
  const endpoints = read('src/renderer/shared/api/endpoints/endpoints.ts') ?? '';
  const ok = /BUSINESS_TYPES\s*:/.test(endpoints);
  return {
    id: 'business-types-endpoint',
    ok,
    detail: ok
      ? 'ENDPOINTS.BUSINESS_TYPES is registered'
      : 'endpoints.ts must define ENDPOINTS.BUSINESS_TYPES',
  };
}

/** Report submission must require a handover receipt photo before sending. */
function checkMandatoryReceipt() {
  const form = read('src/renderer/modules/report/ReportForm.tsx') ?? '';
  const requires = /receipt/.test(form) && /!receipt/.test(form);
  return {
    id: 'mandatory-receipt',
    ok: requires,
    detail: requires
      ? 'ReportForm blocks submission without a receipt photo'
      : 'ReportForm must require a receipt photo before submitting',
  };
}

/** Custom field definitions define both report and asset scopes. */
function checkCustomFieldScopes() {
  const types = read('src/renderer/shared/types/models.ts') ?? '';
  const ok = /['"]report['"]/.test(types) && /['"]asset['"]/.test(types) && /custom_values/.test(types);
  return {
    id: 'custom-field-scopes',
    ok,
    detail: ok
      ? 'Custom field scopes (report/asset) and custom_values are typed'
      : 'models.ts must type report/asset custom field scopes and custom_values',
  };
}

const changed = getChangedTsFiles();
const results = [
  ...checkFileSizeLimit(changed),
  checkRelativeImports(changed),
  checkNoLongDashes(getScanFiles()),
  checkPinOnlyAuth(),
  checkDeveloperCredit(),
  checkProductBrand(),
  checkRouteConstants(),
  checkBusinessTypesApiDriven(),
  checkBusinessTypesEndpoint(),
  checkMandatoryReceipt(),
  checkCustomFieldScopes(),
];

const failed = results.filter((r) => !r.ok);

console.log(`🧪 Vera logic: ${results.length} rule(s)`);
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} [${r.id}] ${r.detail}`);
}

if (failed.length) {
  console.log(`❌ Vera logic: failed (${failed.length})`);
  process.exit(1);
}

console.log('✅ Vera logic: passed');
process.exit(0);
