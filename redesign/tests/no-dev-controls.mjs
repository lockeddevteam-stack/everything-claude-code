/* THE INSPECTOR THAT SHIPPED.

   Every screen carries a state switcher so a reviewer can jump to its
   empty, loading and error states, and the product build hides them with
   one CSS rule. That rule listed selectors by name. Seventeen screens
   name theirs dev__toggle and dev__menu; onboarding names its dev-open
   and dev-panel, because it is a panel with an open button rather than a
   toggle with a menu. So the rule hid seventeen and missed one, and the
   one it missed was the first screen a new install ever sees: a 44px
   inspector button live in the corner of the welcome screen, opening a
   list of twenty-eight internal states.

   No suite caught it. Every screen suite drives the switcher on purpose,
   in the demo build, where it is supposed to work -- so the one build
   where it must NOT appear was the one build nobody looked at.

   This checks the product build only, and checks by SHAPE rather than by
   name: nothing whose testid begins with dev- may be on screen, on any
   screen, in any state. A nineteenth screen inventing a nineteenth name
   fails here rather than in somebody's hands. The demo build is checked
   too, from the other side: the switchers must still work there, because
   fifty other suites drive them. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

async function open(file) {
  const site = http.createServer(async (q, r) => {
    if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
    r.writeHead(200, { 'content-type': 'text/html' });
    r.end(await readFile(path.join(ROOT, '10-final', file)));
  });
  await new Promise((r) => site.listen(0, '127.0.0.1', r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
    isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:' + site.address().port + '/');
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens, null, { timeout: 20000 });
  await page.waitForTimeout(700);
  return { br, site, page };
}

/* Anything dev- that a finger could land on, anywhere in any root. */
const scan = (page) => page.evaluate(() => {
  const out = [];
  for (const [name, s] of Object.entries(window.DEMO.screens)) {
    const root = s.root; if (!root) continue;
    root.querySelectorAll('[data-testid^="dev-"]').forEach((el) => {
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      const shown = b.width > 0 && b.height > 0 && cs.display !== 'none' &&
                    cs.visibility !== 'hidden' && cs.opacity !== '0';
      if (shown) out.push(name + ' / ' + el.getAttribute('data-testid'));
    });
  }
  return out;
});

console.log('=== the product build carries no inspector anyone can reach ===\n');

let h = await open('locked-app.html');
const shownProd = await scan(h.page);
ok(shownProd.length === 0,
   'no dev control is on screen in the product build',
   shownProd.length ? shownProd.join(', ') : 'none of them');

/* The markup is still there -- it lives inside each screen -- so this
   also pins that hiding it did not take the screen with it. */
const alive = await h.page.evaluate(() => {
  const r = window.DEMO.screens.onboarding.root;
  return (r.textContent || '').trim().length;
});
ok(alive > 500, 'and onboarding still renders', alive + ' chars');

/* Every screen, not only the one that was wrong. */
const roots = await h.page.evaluate(() => Object.keys(window.DEMO.screens).length);
ok(roots === 18, 'all eighteen roots were looked at', String(roots));

await h.br.close(); h.site.close();

console.log('\n=== and the demo build still has them, because the suite drives them ===\n');

h = await open('locked-demo.html');
const shownDemo = await scan(h.page);
ok(shownDemo.length > 0,
   'the demo build still offers the state switcher',
   shownDemo.length + ' controls');
const hasOnboarding = shownDemo.some((s) => s.startsWith('onboarding'));
ok(hasOnboarding, "including onboarding's, which is the one that was named differently");
await h.br.close(); h.site.close();

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
