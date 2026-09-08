// Stability check: compare the pass/fail outcome of every test between two Playwright JSON results files.
// Usage: node compare-runs.mjs baseline/results.json /path/to/other/results.json
import fs from 'node:fs';
const [a, b] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const outcomes = (root) => {
  const out = {};
  const walk = (suite) => { for (const s of suite.suites || []) walk(s); for (const sp of suite.specs || []) for (const t of sp.tests || []) out[`${t.projectName} › ${sp.file} › ${sp.title}`] = t.results.at(-1)?.status; };
  walk(root); return out;
};
const A = outcomes(a), B = outcomes(b);
let diff = 0;
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) if (A[k] !== B[k]) { diff++; console.log(`DIFF ${k}: ${A[k]} vs ${B[k]}`); }
console.log(`${Object.keys(A).length} tests; ${diff} outcome differences; run A: ${a.stats.expected} passed/${a.stats.unexpected} failed; run B: ${b.stats.expected} passed/${b.stats.unexpected} failed`);
process.exit(diff ? 1 : 0);
