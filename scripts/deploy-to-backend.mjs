#!/usr/bin/env node
/**
 * Build the Frama web app and ship it inside the API repository, so a single
 * `git pull` on the server delivers the API and the web build together and the
 * deployed bytes are exactly what this commit produced.
 *
 * Frama has ONE environment (no staging), served from its own subdomain:
 *
 *   production -> backend/public/production   absolute asset base (/)
 *                 https://frama.custospark.com/ (subdomain document root)
 *
 *   node scripts/deploy-to-backend.mjs production
 *   npm run deploy:web:production
 *
 * The build carries its own SPA .htaccess (deploy/htaccess.production), so the
 * server copy always carries the right rewrite - never manually re-added.
 *
 * Only backend/public/production is committed and pushed. Never `git add -A`:
 * that sweeps unrelated backend source changes into the deploy commit. Frontend
 * build output stays out of git entirely (dist/ is gitignored), so the backend
 * repo is the single source of truth for deployed builds.
 *
 * Each build is copied over its target in place after a timestamped backup on
 * the server. Nothing is deleted.
 */
import { execSync } from 'child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = resolve(__dirname, '..');
const BACKEND_ROOT = resolve(FRONTEND_ROOT, '..', 'backend');
const BACKEND_PUBLIC = resolve(BACKEND_ROOT, 'public');
const DIST = resolve(FRONTEND_ROOT, 'dist', 'web');
const APP_VERSION = JSON.parse(readFileSync(resolve(FRONTEND_ROOT, 'package.json'), 'utf8')).version;

const API_DIR = '/home/u214605677/domains/frama-api.custospark.com';
// frama.custospark.com is a subdomain of the shared custospark.com domain, so
// its document root is a subfolder of the shared docroot (Academy pattern),
// not domains/<subdomain>/public_html (Custograde pattern).
const WEB_DOCROOT = '/home/u214605677/domains/custospark.com/public_html/frama';

const VARIANTS = {
  production: {
    base: '/',
    htaccess: 'htaccess.production',
    dest: 'production',
    url: 'https://frama.custospark.com',
    target: WEB_DOCROOT,
  },
};

const requested = process.argv[2] ?? 'production';
if (!VARIANTS[requested]) {
  console.error(`Unknown variant "${requested}". Use: production`);
  process.exit(1);
}
const names = [requested];

function step(label) {
  console.log(`\n[${label}]`);
}

function run(cmd, cwd) {
  console.log(`   $ ${cmd}`);
  execSync(cmd, { cwd, stdio: ['pipe', 'inherit', 'inherit'] });
}

/** Capture-only git (status/porcelain) - never for push. */
function gitQuiet(cwd, args) {
  return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).toString();
}

/** Interactive git (add/commit/push) - inherited stdio, because a piped stdin
 *  on Windows makes `git push` fail when the credential helper needs it. */
function gitRun(cwd, args) {
  execSync(`git ${args}`, { cwd, stdio: 'inherit' });
}

function hasChanges(cwd, path) {
  try {
    return gitQuiet(cwd, `status --porcelain -- ${path}`).trim().length > 0;
  } catch {
    return true; // if we cannot tell, assume changed and let git decide
  }
}

function commitAndPush(cwd, label, path, message) {
  if (!hasChanges(cwd, path)) {
    console.log(`   ${label}: nothing to commit for ${path} (already deployed)`);
    return;
  }
  gitRun(cwd, `add -- ${path}`);
  gitRun(cwd, `commit -m "${message.replace(/"/g, '\\"')}"`);
  gitRun(cwd, 'push origin HEAD');
  console.log(`   ${label}: committed + pushed`);
}

console.log(`\nDeploying web build v${APP_VERSION} -> ${names.map((n) => `backend/public/${VARIANTS[n].dest}`).join(', ')}`);

step('Typecheck once');
run('npx tsc -b', FRONTEND_ROOT);

for (const name of names) {
  const v = VARIANTS[name];
  console.log(`\n--- variant: ${name} (base ${v.base}) ---`);

  step(`Build (${name})`);
  rmSync(DIST, { recursive: true, force: true });
  run('npx vite build --mode production', FRONTEND_ROOT);

  if (!existsSync(DIST)) {
    console.error('Build did not produce dist/web - aborting.');
    process.exit(1);
  }

  step(`Copy build -> backend/public/${v.dest}`);
  const dest = resolve(BACKEND_PUBLIC, v.dest);
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(DIST, dest, { recursive: true });
  console.log(`   copied ${DIST} -> ${dest}`);

  const htaccessSrc = resolve(__dirname, '..', 'deploy', v.htaccess);
  if (existsSync(htaccessSrc)) {
    copyFileSync(htaccessSrc, resolve(dest, '.htaccess'));
    console.log(`   copied ${v.htaccess} -> ${dest}/.htaccess`);
  } else {
    console.warn(`   deploy/${v.htaccess} missing - .htaccess NOT added`);
  }

  step(`Commit + push backend: public/${v.dest}`);
  commitAndPush(
    BACKEND_ROOT,
    'backend',
    `public/${v.dest}`,
    `deploy(web): ${name} build v${APP_VERSION} under public/${v.dest}`,
  );
}

console.log(`\nDone. On the server:\n`);
console.log(`   cd ${API_DIR}`);
console.log(`   git fetch origin && git reset --hard origin/main`);
for (const name of names) {
  const v = VARIANTS[name];
  console.log(`   # ${name} -> ${v.url}`);
  console.log(`   TS=$(date +%Y%m%d-%H%M%S); cp -rT ${v.target} ${v.target}-backup-$TS`);
  console.log(`   cp -rT ${API_DIR}/public/${v.dest} ${v.target}   # -T carries .htaccess; nothing is deleted`);
}
console.log(`\nThen verify: asset count, JS MIME type, deep route, API health.\n`);
