/* Verifies 10-final/locked-demo.html over file://, the way a reviewer opens it.
 *   node 10-final/verify-demo.mjs
 * Re-run after every `node 10-final/assemble.mjs`. Exits non-zero on any failure. */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const DEMO = 'file://' + ROOT + '/10-final/locked-demo.html';
const AXE = fs.readFileSync(ROOT + '/tests/node_modules/axe-core/axe.min.js', 'utf8');

const results = { console: [], pageerrors: [], checks: [], axeDemo: {}, axeStandalone: {} };
const ok = (name, pass, detail) => {
  results.checks.push({ name, pass, detail });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') results.console.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => results.pageerrors.push(String(e)));
page.on('requestfailed', (r) => results.console.push('requestfailed: ' + r.url()));

await page.goto(DEMO);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.waitForTimeout(800);

const info = await page.evaluate(() => ({
  screens: Object.keys(window.DEMO.screens),
  leaked: window.DEMO.leakedGlobals,
  hash: location.hash,
  requests: performance.getEntriesByType('resource').map((r) => r.name)
}));
console.log('screens (' + info.screens.length + '):', info.screens.join(', '));
ok('no leaked globals', info.leaked.length === 0, info.leaked.join(', ') || '0 leaked names across ' + info.screens.length + ' screens');
ok('no subresource requests', info.requests.length === 0, info.requests.join(', ') || '0 requests');
ok('boots at #/home', info.hash === '#/home', info.hash);

const visible = () => page.evaluate(() => {
  const el = [...document.querySelectorAll('.demo-screen')].find((d) => !d.hidden);
  return el ? el.dataset.screen : null;
});
const goto = async (id) => {
  await page.evaluate((sid) => (window.DEMO.screens[sid].tab ? window.DEMO.go(window.DEMO.screens[sid].tab) : window.DEMO.push(sid)), id);
  await page.waitForTimeout(350);
};

// ---------- tabs ----------
const tabs = [['home', 'home'], ['train', 'train'], ['fuel', 'fuel-placeholder'], ['coach', 'coach'], ['profile', 'profile-placeholder']];
for (const [tab, screen] of tabs) {
  await page.evaluate((t) => {
    const cur = [...document.querySelectorAll('.demo-screen')].find((d) => !d.hidden);
    cur.shadowRoot.querySelector(`.tabbar [data-testid="tab-${t}"]`).click();
  }, tab);
  await page.waitForTimeout(300);
  const v = await visible();
  const aria = await page.evaluate(() => {
    const cur = [...document.querySelectorAll('.demo-screen')].find((d) => !d.hidden);
    return [...cur.shadowRoot.querySelectorAll('.tabbar [data-testid^="tab-"]')]
      .filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.dataset.testid);
  });
  ok(`tab ${tab} -> ${screen}`, v === screen, 'visible=' + v);
  ok(`tab ${tab} aria-current is exactly one`, aria.length === 1 && aria[0] === 'tab-' + tab, JSON.stringify(aria));
}

// fuel placeholder is honest, not an error
const fuelText = await page.evaluate(() => {
  const r = document.querySelector('#demo-screen-fuel-placeholder').shadowRoot;
  return r.querySelector('[data-testid="fuel-placeholder"]').textContent.replace(/\s+/g, ' ').trim();
});
ok('fuel placeholder present', /designed separately/i.test(fuelText) && /resolver/.test(fuelText), fuelText.slice(0, 90) + '…');

// ---------- pushes and back ----------
const pushes = [
  ['train', '[data-action="open-library"]', 'exercise-library'],
  ['train', '[data-action="new-split"]', 'split-builder'],
  ['train', '[data-action="start-today"]', 'workout-log'],
  ['home', '[data-testid="open-account"]', 'settings']
];
for (const [from, sel, to] of pushes) {
  await goto(from);
  const clicked = await page.evaluate(([f, s]) => {
    const el = document.querySelector('#demo-screen-' + f).shadowRoot.querySelector(s);
    if (!el) return false;
    el.click();
    return true;
  }, [from, sel]);
  await page.waitForTimeout(400);
  ok(`push ${from} ${sel} -> ${to}`, clicked && (await visible()) === to, 'hash=' + (await page.evaluate(() => location.hash)));
  const backShown = await page.evaluate(() => !document.getElementById('demo-back').hidden);
  ok(`back affordance on ${to}`, backShown);
  await page.goBack();
  await page.waitForTimeout(350);
  ok(`browser back ${to} -> ${from}`, (await visible()) === from, 'hash=' + (await page.evaluate(() => location.hash)));
}

// screen's own back
await goto('train');
await page.evaluate(() => document.querySelector('#demo-screen-train').shadowRoot.querySelector('[data-action="new-split"]').click());
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('#demo-screen-split-builder').shadowRoot.querySelector('[data-action="manual-back"]').click());
await page.waitForTimeout(400);
ok("split-builder's own back returns to Train", (await visible()) === 'train', await page.evaluate(() => location.hash));

// pushed screen with no link in: reachable by route, demo back chip returns
await page.evaluate(() => { location.hash = '#/home/onboarding'; });
await page.waitForTimeout(400);
ok('onboarding reachable', (await visible()) === 'onboarding');
const chipLabel = await page.evaluate(() => document.getElementById('demo-back').textContent.trim());
await page.evaluate(() => document.getElementById('demo-back').click());
await page.waitForTimeout(400);
ok('demo back chip returns to where you came from', (await visible()) === 'train', 'label=' + chipLabel + ' now=' + (await page.evaluate(() => location.hash)));
ok('demo back chip names where it goes', /Train/.test(chipLabel), chipLabel);
const hookScoped = await page.evaluate(() => ({
  onWindow: typeof window.__locked, onScreen: typeof (window.DEMO.screens.onboarding.globals || {}).__locked
}));
ok('screen test hook stays on its screen', hookScoped.onWindow === 'undefined' && hookScoped.onScreen === 'object', JSON.stringify(hookScoped));

// ---------- demo-level index ----------
await page.click('[data-testid="demo-index-toggle"]');
await page.waitForTimeout(800);
const idx = await page.evaluate(() =>
  [...document.querySelectorAll('.demo-index__group')].map((g) => ({
    screen: g.querySelector('.demo-index__screen').textContent.trim(),
    states: [...g.querySelectorAll('.demo-index__state')].map((s) => s.textContent.trim())
  }))
);
const totalStates = idx.reduce((n, g) => n + g.states.length, 0);
ok('index lists every screen', idx.length === info.screens.length, idx.length + ' screens, ' + totalStates + ' states');
ok('every non-placeholder screen contributes states', idx.filter((g) => !g.states.length).length <= 2,
  'screens with no state list: ' + idx.filter((g) => !g.states.length).map((g) => g.screen).join(', '));
results.index = idx;
// drive one state entry per screen end to end
let stateNavOk = 0;
for (let i = 0; i < idx.length; i++) {
  if (!idx[i].states.length) continue;
  await page.evaluate(() => { const b = document.getElementById('demo-index'); if (b.hidden) document.getElementById('demo-index-toggle').click(); });
  await page.waitForTimeout(400);
  await page.evaluate((n) => document.querySelectorAll('.demo-index__group')[n].querySelector('.demo-index__state').click(), i);
  await page.waitForTimeout(400);
  if ((await visible()) !== null) stateNavOk++;
}
ok('index state entries navigate', stateNavOk === idx.filter((g) => g.states.length).length, stateNavOk + ' of ' + idx.filter((g) => g.states.length).length);
await page.evaluate(() => { const b = document.getElementById('demo-index'); if (!b.hidden) document.getElementById('demo-index-close').click(); });

// ---------- each screen's own dev toggle still works ----------
for (const id of info.screens) {
  await goto(id);
  const r = await page.evaluate((sid) => {
    const root = document.querySelector('#demo-screen-' + sid).shadowRoot;
    const t = root.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]');
    if (!t) return 'none';
    t.click();
    const panel = root.querySelector('[data-testid="dev-menu"], [data-testid="dev-panel"]');
    const open = panel && !panel.hidden;
    t.click();
    return open ? 'works' : 'no-panel';
  }, id);
  ok(`screen dev toggle: ${id}`, r !== 'no-panel', r);
}

// ---------- style isolation ----------
const PROPS = ['background-color', 'color', 'font-size', 'font-weight', 'min-height', 'height', 'width', 'padding-top', 'padding-left', 'border-radius', 'line-height', 'letter-spacing', 'display', 'position'];
const probes = {
  home: ['[data-testid="primary-action"]', '.hdr', '.tabbar__item'],
  train: ['.tabbar__item', '.hdr', '.btn--primary'],
  progress: ['.hdr', '.row', '.tabbar'],
  coach: ['.tabbar', '.composer, .body'],
  'exercise-library': ['.search__input, .input', '.body'],
  'split-builder': ['.hdr', '.btn, button'],
  onboarding: ['.btn--primary, .btn', '.screen:not([hidden])'],
  settings: ['.hdr', '.row'],
  review: ['.hdr', '.btn, button'],
  'workout-log': ['.hdr', '.btn, button']
};
const readStyles = async (target, sel, inDemo) =>
  target.evaluate(([s, props, sid]) => {
    const scope = sid ? document.querySelector('#demo-screen-' + sid).shadowRoot : document;
    let el = null;
    for (const one of s.split(', ')) { el = scope.querySelector(one); if (el) break; }
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = {};
    props.forEach((p) => (o[p] = cs.getPropertyValue(p)));
    return o;
  }, [sel, PROPS, inDemo]);

let probeCount = 0, probePass = 0;
for (const [id, sels] of Object.entries(probes)) {
  if (!info.screens.includes(id)) continue;
  await goto(id);
  const p2 = await ctx.newPage();
  await p2.goto('file://' + ROOT + '/08-build/' + id + '.html');
  await p2.waitForTimeout(700);
  for (const sel of sels) {
    const a = await readStyles(page, sel, id);
    const b = await readStyles(p2, sel, null);
    probeCount++;
    const same = a && b && JSON.stringify(a) === JSON.stringify(b);
    if (same) probePass++;
    else ok(`computed style ${id} ${sel}`, false, 'demo=' + JSON.stringify(a) + ' standalone=' + JSON.stringify(b));
  }
  await p2.close();
}
ok('computed styles identical to standalone', probePass === probeCount, probePass + '/' + probeCount + ' control probes across ' + Object.keys(probes).length + ' screens, ' + PROPS.length + ' properties each');

// ---------- axe in demo ----------
await page.addScriptTag({ content: AXE });
for (const id of info.screens) {
  await goto(id);
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length }));
  });
  results.axeDemo[id] = res;
  ok(`axe ${id} (in demo)`, res.length === 0, res.length ? JSON.stringify(res) : '0 violations');
}

// ---------- axe standalone, for the delta ----------
for (const id of info.screens) {
  if (/-placeholder$/.test(id)) { results.axeStandalone[id] = []; continue; }
  const p2 = await ctx.newPage();
  await p2.goto('file://' + ROOT + '/08-build/' + id + '.html');
  await p2.waitForTimeout(700);
  await p2.addScriptTag({ content: AXE });
  results.axeStandalone[id] = await p2.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length }));
  });
  await p2.close();
}
const sig = (a) => a.map((v) => v.id + 'x' + v.n).sort().join(',');
const introduced = info.screens.filter((id) => sig(results.axeDemo[id]) !== sig(results.axeStandalone[id]));
ok('demo introduces no axe violation', introduced.length === 0,
  introduced.length ? introduced.map((id) => id + ': demo[' + sig(results.axeDemo[id]) + '] standalone[' + sig(results.axeStandalone[id]) + ']').join(' | ') : 'per-screen counts identical to the standalone files');

// ---------- targets ----------
for (const id of info.screens) {
  await goto(id);
  const small = await page.evaluate((sid) => {
    const root = document.querySelector('#demo-screen-' + sid).shadowRoot;
    const els = [...root.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="switch"], [role="radio"], [tabindex]:not([tabindex="-1"])')];
    const bad = [];
    for (const el of els) {
      if (el.disabled) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (r.width < 44 || r.height < 44) bad.push(`${el.dataset.testid || el.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return bad;
  }, id);
  ok(`targets >= 44x44 ${id}`, small.length === 0, small.length ? small.slice(0, 6).join('; ') : '0 under 44');
}
// demo chrome itself
const chromeSmall = await page.evaluate(() =>
  [...document.querySelectorAll('.demo-chrome button, .demo-index button')]
    .filter((el) => { const r = el.getBoundingClientRect(); return (r.width || r.height) && (r.width < 44 || r.height < 44); })
    .map((el) => el.id + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height)));
ok('demo chrome targets >= 44x44', chromeSmall.length === 0, chromeSmall.join('; ') || '0 under 44');

// ---------- the body map, inside the demo ----------
// A component that works from a file on disk can still fail here: every screen
// runs behind a document/window proxy in its own shadow root, and a global the
// assembler forgets to inline is only missing at the moment the map mounts.
// So it is driven, not merely looked for.
await goto('exercise-library');
const inLib = (fn) => page.evaluate((src) => {
  const r = [...document.querySelectorAll('.demo-screen')].find((d) => !d.hidden).shadowRoot;
  return (new Function('root', src))(r);
}, fn.toString().slice(fn.toString().indexOf('{') + 1, fn.toString().lastIndexOf('}')));

await inLib(function () { root.querySelector('[data-testid="browse-toggle"]').click(); });
await page.waitForTimeout(700);
const drawn = await inLib(function () {
  return root.querySelectorAll('[data-testid="bodymap"] .mg[data-g]').length;
});
ok('body map draws inside the demo', drawn >= 9, drawn + ' muscle groups');

const pecBox = await inLib(function () {
  const e = root.querySelector('[data-testid="bodymap"] .mg--chest .mg__gnd');
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return [b.x + b.width / 2, b.y + b.height / 2];
});
if (pecBox) { await page.mouse.click(pecBox[0], pecBox[1]); await page.waitForTimeout(600); }
const opened = await inLib(function () {
  const h = root.querySelector('.hdr h1');
  return h ? h.textContent.trim() : null;
});
ok('tapping the pectoral opens Chest', opened === 'Chest', 'header reads ' + JSON.stringify(opened));

// ---------- horizontal overflow ----------
for (const id of info.screens) {
  await goto(id);
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(`no horizontal overflow at 393px ${id}`, o.sw <= o.cw, `scrollWidth=${o.sw} clientWidth=${o.cw}`);
}
// with the index open
await page.evaluate(() => document.getElementById('demo-index-toggle').click());
await page.waitForTimeout(500);
const oIdx = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
ok('no horizontal overflow with the index open', oIdx.sw <= oIdx.cw, `scrollWidth=${oIdx.sw} clientWidth=${oIdx.cw}`);
await page.evaluate(() => document.getElementById('demo-index-close').click());

// ---------- console ----------
console.log('\nconsole messages:', JSON.stringify(results.console, null, 1));
console.log('page errors:', JSON.stringify(results.pageerrors, null, 1));
ok('zero console errors and warnings', results.console.length === 0, results.console.length + ' messages');
ok('zero uncaught page errors', results.pageerrors.length === 0, results.pageerrors.length + ' errors');

const failed = results.checks.filter((c) => !c.pass);
console.log(`\n${results.checks.length - failed.length}/${results.checks.length} checks passed`);
if (failed.length) console.log('failed:\n' + failed.map((f) => ' - ' + f.name + ': ' + f.detail).join('\n'));
fs.writeFileSync(path.join(ROOT, '10-final/verify-results.json'), JSON.stringify(results, null, 1));
await browser.close();
process.exit(failed.length ? 1 : 0);
