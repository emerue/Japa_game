// Checks the first-load budget (tech spec "Performance budget"; PRD §15):
// everything a player downloads before they can play must stay under 3 MB
// as sent over the network. Follows the real import graph from index.html,
// so new modules are counted automatically.
//
// Usage: node tools/check_budget.mjs   (run from Japa_game/; exits 1 when over budget)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
// 3 MB target; the hard ceiling (5 MB) is never the goal. BUDGET_KB overrides it (to test the check itself).
const BUDGET = Number(process.env.BUDGET_KB ?? 3072) * 1024;
const WARN_AT = 0.85;
// What nginx compresses (gzip_types in /etc/nginx/sites-available/japa); fonts and
// images are already compressed formats and are sent as they are.
const GZIPPED = /\.(html|js|css|json|glb|txt)$/;

const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const importMap = JSON.parse(/<script type="importmap">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '{"imports":{}}').imports;

/** Resolve an import specifier to a file path relative to ROOT. */
function resolve(spec, fromFile) {
  for (const [key, target] of Object.entries(importMap)) {
    if (spec === key) return normalize(target);
    if (key.endsWith('/') && spec.startsWith(key)) return normalize(target + spec.slice(key.length));
  }
  if (spec.startsWith('.')) return normalize(join(dirname(fromFile), spec));
  return null; // a URL or bare name we don't ship
}

/** @type {Map<string, string>} file -> why it is in the first load */
const files = new Map();
const add = (file, why) => { if (!files.has(file)) files.set(file, why); };

add('index.html', 'page');

// stylesheets and preloads linked from the page
for (const [, href] of html.matchAll(/<link[^>]+href="(\.\/[^"]+)"/g)) add(normalize(href), /\.woff2?$/.test(href) ? 'font' : 'stylesheet');

// fonts referenced from local stylesheets
for (const css of [...files.keys()].filter((f) => f.endsWith('.css'))) {
  const text = readFileSync(join(ROOT, css), 'utf8');
  for (const [, url] of text.matchAll(/url\(['"]?(\.\/[^'")]+)['"]?\)/g)) add(normalize(join(dirname(css), url)), 'font');
}

// JavaScript: walk static imports from every module script on the page
const queue = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map(([, src]) => normalize(src));
while (queue.length) {
  const file = queue.shift();
  if (files.has(file)) continue;
  if (!existsSync(join(ROOT, file))) throw new Error(`Missing module: ${file}`);
  add(file, 'code');
  const text = readFileSync(join(ROOT, file), 'utf8');
  for (const [, spec] of text.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/g)) {
    const target = resolve(spec, file);
    if (target && !files.has(target)) queue.push(target);
  }
}

// 3D characters: every packed model is loaded before the title screen (src/world/people.js)
const charDir = 'assets/characters';
for (const f of readdirSync(join(ROOT, charDir)).filter((f) => f.endsWith('.glb'))) add(join(charDir, f), '3D character');

const rows = [...files].map(([file, why]) => {
  const raw = readFileSync(join(ROOT, file));
  const sent = GZIPPED.test(file) ? gzipSync(raw, { level: 6 }).length : raw.length;
  return { file, why, raw: raw.length, sent };
});

const kb = (n) => `${(n / 1024).toFixed(1).padStart(8)} KB`;
const groups = new Map();
for (const r of rows) groups.set(r.why, (groups.get(r.why) ?? 0) + r.sent);
const total = rows.reduce((s, r) => s + r.sent, 0);
const liteTotal = rows.filter((r) => r.why !== '3D character').reduce((s, r) => s + r.sent, 0);

console.log('First load, as sent over the network:\n');
for (const r of rows.sort((a, b) => b.sent - a.sent).slice(0, 12)) console.log(`${kb(r.sent)}  ${r.file}`);
if (rows.length > 12) console.log(`${kb(rows.slice(12).reduce((s, r) => s + r.sent, 0))}  (${rows.length - 12} smaller files)`);
console.log('\nBy kind:');
for (const [why, size] of groups) console.log(`${kb(size)}  ${why}`);
console.log(`\n${kb(total)}  total, 3D view   (budget ${kb(BUDGET).trim()}, ${Math.round((total / BUDGET) * 100)}%)`);
console.log(`${kb(liteTotal)}  total, lite view (no 3D characters)`);

// unused files under src/ that nothing imports would silently rot; list them as a hint
const shipped = new Set(rows.map((r) => r.file));
const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((f) => {
  const p = join(dir, f);
  return statSync(join(ROOT, p)).isDirectory() ? walk(p) : [p];
});
// types.js files hold JSDoc types only and are never loaded at runtime
const orphans = walk('src').filter((f) => f.endsWith('.js') && !f.endsWith('.test.js') && !f.endsWith('types.js') && !shipped.has(f));
if (orphans.length) console.log(`\nNot loaded by the game (old prototype or unused): ${orphans.map((f) => relative('.', f)).join(', ')}`);

if (total > BUDGET) {
  console.error(`\nOVER BUDGET by ${kb(total - BUDGET).trim()}. Shrink or lazy-load something before shipping.`);
  process.exit(1);
}
if (total > BUDGET * WARN_AT) console.warn(`\nWarning: within ${Math.round((1 - WARN_AT) * 100)}% of the budget.`);
console.log('\nWithin budget.');
