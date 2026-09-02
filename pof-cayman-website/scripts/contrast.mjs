/* Checks every text-on-surface pair in tokens.css. Run: node scripts/contrast.mjs */
import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const P = Object.fromEntries([...css.matchAll(/--c-([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => (Math.max(L(a), L(b)) + 0.05) / (Math.min(L(a), L(b)) + 0.05);
const pairs = [
  ['ink', 'paper', 4.5], ['ink', 'sand', 4.5], ['ink-muted', 'paper', 4.5], ['ink-muted', 'sand', 4.5],
  ['paper', 'ocean', 4.5], ['paper-muted', 'ocean', 4.5], ['paper', 'ocean-deep', 4.5], ['paper-muted', 'ocean-deep', 4.5],
  ['paper', 'mangrove', 4.5], ['paper-muted', 'mangrove', 4.5],
  ['reef-ink', 'paper', 4.5], ['reef-ink', 'sand', 4.5], ['reef-on-dark', 'ocean', 4.5], ['reef-on-dark', 'ocean-deep', 4.5], ['reef-on-dark', 'mangrove', 4.5],
  ['ink', 'reef', 4.5], ['paper', 'reef-ink', 4.5], ['paint', 'sheet', 4.5], ['error', 'paper', 4.5], ['error', 'error-bg', 4.5],
  ['reef', 'ocean', 3], ['reef-ink', 'paper', 3], ['ocean', 'sand', 3], ['ocean', 'paper', 3], ['ink-muted', 'paper', 3],
];
let bad = 0;
for (const [a, b, min] of pairs) {
  const r = ratio(P[a], P[b]);
  const ok = r >= min;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${a.padEnd(13)} on ${b.padEnd(11)} ${r.toFixed(2)}  (min ${min})`);
}
if (bad) { console.log(`${bad} pair(s) fail`); process.exit(1); }
console.log('All pairs pass.');
