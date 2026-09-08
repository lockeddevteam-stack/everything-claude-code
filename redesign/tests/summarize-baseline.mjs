// Builds <RESULTS_DIR>/SUMMARY.md tables from results.json, flow-metrics.jsonl, page-metrics.jsonl and global-summary.json.
// Usage: node summarize-baseline.mjs [baseline]   (run from /redesign/tests). The defects section is hand-written
// in SUMMARY.md below the generated tables; this script only rewrites the block between the GENERATED markers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, process.argv[2] || process.env.RESULTS_DIR || 'baseline');
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');
const jsonl = (f) => fs.existsSync(path.join(DIR, f)) ? read(f).trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];

const results = JSON.parse(read('results.json'));
const flows = jsonl('flow-metrics.jsonl');
const pages = jsonl('page-metrics.jsonl');
const global = JSON.parse(read('global-summary.json'));

// last run only: results.json carries the run's start time; keep jsonl lines written after it
const runStart = new Date(results.stats.startTime).getTime() - 1000;
const lastRun = (rows) => rows.filter(r => new Date(r.ts).getTime() >= runStart);
const F = lastRun(flows); const P = lastRun(pages);

// per-test outcome from results.json
const outcomes = {};
const walk = (suite, file) => {
  for (const s of suite.suites || []) walk(s, s.file || file);
  for (const sp of suite.specs || []) for (const t of sp.tests || []) outcomes[sp.title] = { status: t.results.at(-1)?.status, file: sp.file || file, ok: sp.ok };
};
walk(results);

const md = [];
md.push('## Suite');
md.push(`Run: ${results.stats.startTime} · ${results.stats.expected} passed · ${results.stats.unexpected} failed · ${results.stats.skipped} skipped · ${(results.stats.duration / 1000).toFixed(0)} s · Playwright ${results.config.version}`);
md.push('');

md.push('## Flows (e2e/flows)');
md.push('');
md.push('| # | Flow | Taps | Expected | ms (first nav → success) | Console errors | Page errors | Flow steps | Test | Notes |');
md.push('|---|---|---|---|---|---|---|---|---|---|');
for (const r of F.sort((a, b) => a.flow - b.flow || a.name.localeCompare(b.name))) {
  const testOk = Object.entries(outcomes).find(([t]) => r.flow === 1 ? t.startsWith(r.name.slice(0, 2)) : t.startsWith(`flow ${String(r.flow).padStart(2, '0')}`));
  const extra = [];
  if (r.clearTaps) extra.push(`${r.clearTaps} taps are NumPad "del" presses to clear the pre-filled recommendation (${r.prefilled?.w} / ${r.prefilled?.r})`);
  if (r.headerSets) extra.push(`header reads "${r.headerSets}" after a done warm-up set`);
  if (r.tutorialShown !== undefined) extra.push(`tutorial shown: ${r.tutorialShown}; onboarding taps ${r.onboardingTaps}, without onboarding ${r.tapsWithoutOnboarding}`);
  if (r.unexpectedRequests?.length) extra.push(`${r.unexpectedRequests.length} unrouted external requests (${[...new Set(r.unexpectedRequests.map(u => new URL(u.url).hostname + new URL(u.url).pathname))].join(', ')})`);
  if (r.errors?.length) extra.push('errors: ' + r.errors.map(e => e.slice(0, 80)).join('; '));
  if (r.notes) extra.push(r.notes);
  md.push(`| ${r.flow} | ${r.name} | ${r.taps} | ${r.expectedTaps ?? ''} | ${r.ms} | ${r.consoleErrors} | ${r.pageErrors} | ${r.pass ? 'pass' : 'FAIL: ' + (r.failure || '')} | ${testOk ? testOk[1].status : '?'} | ${extra.join('. ')} |`);
}
md.push('');

md.push('## Pages (e2e/pages + global.spec)');
md.push('');
md.push('| Page | Populated | Empty | Error | Interactive: clicked / total | Non-responders | Blocked clicks | Skipped (destructive) | Recoveries | Console errors | Page errors | axe violations (nodes) | Targets < 44 / total | Contrast fails / checked (unknown) | In-app back | History back |');
md.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
const order = Object.keys(global.pages);
for (const slug of order) {
  const g = global.pages[slug];
  const by = (t) => P.filter(r => r.slug === slug && r.test === t).at(-1);
  const pop = by('populated'), emp = by('empty'), err = by('error'), inter = by('interactive');
  const st = (t, rec, naKey) => {
    const o = Object.entries(outcomes).find(([title]) => title.startsWith(`${slug}: `) && title.includes(naKey));
    if (o && /N\/A/.test(o[0])) return 'N/A';
    if (!rec) return o ? o[1].status : '?';
    return `${o ? o[1].status : '?'}`;
  };
  const cErr = Math.max(pop?.consoleErrors || 0, emp?.consoleErrors || 0, err?.consoleErrors || 0, inter?.consoleErrors || 0, g.consoleErrors || 0);
  const pErr = (pop?.pageErrors || 0) + (emp?.pageErrors || 0) + (err?.pageErrors || 0) + (inter?.pageErrors || 0) + (g.pageErrors || 0);
  const nonresp = inter ? inter.nonResponders.map(x => `"${x}"`).join(', ') : '';
  const blocked = inter ? inter.blocked.map(b => `"${b.label}"`).join(', ') : '';
  const skipped = inter ? [...new Set(inter.skipped.filter(s => /destructive/.test(s.reason)).map(s => s.label))].join(', ') : '';
  const selectedSkips = inter ? inter.skipped.filter(s => /already selected/.test(s.reason)).length : 0;
  md.push(`| ${slug} | ${st('populated', pop, 'populated')} | ${st('empty', emp, 'empty')} | ${st('error', err, 'error')}${err?.softChecks && Object.values(err.softChecks).some(v => !v) ? ' (no error copy shown)' : ''} | ${inter ? `${inter.clicked.length} / ${inter.total}` : ''} | ${nonresp || '—'} | ${blocked || '—'} | ${skipped || '—'}${selectedSkips ? ` (+${selectedSkips} already-selected tab${selectedSkips > 1 ? 's' : ''})` : ''} | ${inter?.recoveries ?? ''} | ${cErr} | ${pErr} | ${g.axeViolations} (${g.axeNodes}) | ${g.targetsUnder44} / ${g.interactiveTotal} | ${g.contrastFailures} / ${g.contrastChecked} (${g.contrastUnknown}) | ${g.inAppBack === null ? 'n/a' : g.inAppBack ? 'ok' : 'FAIL'} | ${g.historyBack === null ? 'n/a' : g.historyBack ? 'ok' : 'FAIL'} |`);
}
md.push('');
md.push(`Totals: axe ${global.totals.axeViolations} violations / ${global.totals.axeNodes} nodes · ${global.totals.targetsUnder44} targets under 44px · ${global.totals.contrastFailures} contrast failures (${global.totals.contrastUnknown} text nodes over gradients/images not measured) · ${global.totals.consoleErrors} console errors · ${global.totals.pageErrors} page errors across the 18 page scans.`);
md.push('');

// axe rule roll-up
const axe = JSON.parse(read('axe.json'));
const rules = {};
for (const [slug, a] of Object.entries(axe.pages)) for (const v of a.violations) { rules[v.id] ??= { impact: v.impact, help: v.help, pages: [], nodes: 0 }; rules[v.id].pages.push(slug); rules[v.id].nodes += v.nodeCount; }
md.push('### axe rules hit');
md.push('');
md.push('| Rule | Impact | Pages | Nodes | Help |');
md.push('|---|---|---|---|---|');
for (const [id, r] of Object.entries(rules).sort((a, b) => b[1].nodes - a[1].nodes)) md.push(`| ${id} | ${r.impact} | ${r.pages.length} | ${r.nodes} | ${r.help} |`);
md.push('');

// targets roll-up (most frequent small controls)
const targets = JSON.parse(read('targets.json'));
const small = {};
for (const [slug, t] of Object.entries(targets.pages)) for (const i of t.items) { const k = `${i.tag}${i.role ? '[' + i.role + ']' : ''} "${(i.aria || i.text || '').slice(0, 30)}" ${i.w}x${i.h}`; small[k] ??= new Set(); small[k].add(slug); }
md.push('### Targets under 44x44 (most widespread)');
md.push('');
md.push('| Control | Size | Pages |');
md.push('|---|---|---|');
for (const [k, s] of Object.entries(small).sort((a, b) => b[1].size - a[1].size).slice(0, 25)) { const m = k.match(/^(.*) (\d+x\d+)$/); md.push(`| ${m[1]} | ${m[2]} | ${[...s].join(', ')} |`); }
md.push('');

// contrast roll-up
const contrast = JSON.parse(read('contrast.json'));
const cf = {};
for (const [slug, c] of Object.entries(contrast.pages)) for (const i of c.items) { const k = `${i.fg} on ${i.bg} @${i.size}px/${i.weight}`; cf[k] ??= { ratio: i.ratio, required: i.required, pages: new Set(), sample: i.text }; cf[k].pages.add(slug); }
md.push('### Contrast failures (most widespread fg/bg pairs)');
md.push('');
md.push('| Colours | Ratio | Required | Pages | Sample text |');
md.push('|---|---|---|---|---|');
for (const [k, v] of Object.entries(cf).sort((a, b) => b[1].pages.size - a[1].pages.size || a[1].ratio - b[1].ratio).slice(0, 25)) md.push(`| ${k} | ${v.ratio} | ${v.required} | ${[...v.pages].join(', ')} | ${v.sample.slice(0, 40)} |`);
md.push('');

const out = path.join(DIR, 'SUMMARY.md');
const START = '<!-- GENERATED:START -->', END = '<!-- GENERATED:END -->';
let doc = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : `# Baseline summary — LOCKED v6 (tests/app/index.html)\n\n${START}\n${END}\n`;
if (!doc.includes(START)) doc = `# Baseline summary — LOCKED v6 (tests/app/index.html)\n\n${START}\n${END}\n` + doc;
doc = doc.slice(0, doc.indexOf(START) + START.length) + '\n' + md.join('\n') + '\n' + doc.slice(doc.indexOf(END));
fs.writeFileSync(out, doc);
console.log('wrote', out);
