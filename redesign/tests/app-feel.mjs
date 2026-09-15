/* THE THINGS THAT GIVE AWAY A WEB PAGE.

   Installed to a home screen this is the app somebody opens, and a
   handful of browser behaviours are the difference between an app and a
   website in a costume. None of them belong to anything in here:

   - a pinch that leaves you zoomed into a form with no chrome to zoom
     back out with
   - a double tap on a rep counter read as zoom-to-fit
   - the long-press menu offering Copy and Look Up on top of a gesture
     the app has already claimed
   - a translucent ghost of an image being dragged around the screen
   - the grey flash under a tapped row
   - text turning blue under a held thumb
   - the rubber band past the top of a list, and pull-to-refresh under it
   - iOS inflating the type in landscape

   Every one of them is checked here against the BROWSER'S computed
   answer, on real elements across every screen, rather than against the
   rule we hoped applied.

   What is deliberately NOT done: user-scalable=no. It fails the axe
   meta-viewport rule, it breaks WCAG 1.4.4, and Safari has ignored it
   since iOS 10 -- so it would cost the audit and buy nothing on the
   phone this ships to. The gesture is refused instead, which leaves
   browser zoom, the kind somebody chooses from a menu, working. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP = path.join(ROOT, '10-final/locked-app.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' }); r.end(await readFile(APP));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
  } catch (e) {}
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens &&
  Object.keys(window.DEMO.screens).length > 0, null, { timeout: 15000 });
await page.waitForTimeout(900);

console.log('=== it installs as an app, not a bookmark ===\n');

const head = await page.evaluate(() => {
  const m = (sel, attr) => {
    const el = document.querySelector(sel);
    return el ? el.getAttribute(attr || 'content') : null;
  };
  return {
    viewport: m('meta[name="viewport"]'),
    manifest: !!document.querySelector('link[rel="manifest"]'),
    standalone: m('meta[name="apple-mobile-web-app-capable"]'),
    statusBar: m('meta[name="apple-mobile-web-app-status-bar-style"]'),
    icon: !!document.querySelector('link[rel="apple-touch-icon"]'),
    tel: m('meta[name="format-detection"]'),
    theme: !!document.querySelector('meta[name="theme-color"]')
  };
});
ok(head.manifest && head.standalone === 'yes' && head.icon,
   'a manifest, a standalone flag and a home-screen icon', JSON.stringify(head.standalone));
ok(/viewport-fit=cover/.test(head.viewport || ''),
   'the viewport reaches under the notch', head.viewport);
ok(/telephone=no/.test(head.tel || ''),
   'and a set of 8 reps is not a phone number', head.tel);
ok(head.statusBar === 'black-translucent' && head.theme,
   'the status bar belongs to the app');

console.log('\n=== nothing zooms ===\n');

const zoom = await page.evaluate(() => {
  const h = getComputedStyle(document.documentElement);
  const b = getComputedStyle(document.body);
  return { html: h.touchAction, body: b.touchAction,
           adjust: h.webkitTextSizeAdjust || h.textSizeAdjust };
});
ok(/pan-x/.test(zoom.html) && /pan-y/.test(zoom.html) && !/pinch/.test(zoom.html),
   'the page may be panned and not scaled, which is pinch gone in Chrome',
   zoom.html);
ok(zoom.body === 'manipulation',
   'and a double tap is a double tap, not zoom-to-fit', zoom.body);
ok(zoom.adjust === '100%', 'iOS does not inflate the type in landscape', zoom.adjust);

/* Safari ignores touch-action for pinch, so the gesture events are
   refused as well. Chromium does not fire them, so what is checked is
   that the refusal is installed rather than that it fires. */
const refuses = await page.evaluate(() => {
  let stopped = false;
  const e = new Event('gesturestart', { cancelable: true, bubbles: true });
  document.dispatchEvent(e);
  stopped = e.defaultPrevented;
  return stopped;
});
ok(refuses, 'and a Safari pinch is refused at the document');

console.log('\n=== nothing behaves like a document ===\n');

const doc = await page.evaluate(() => {
  const h = getComputedStyle(document.documentElement);
  return { overscroll: h.overscrollBehaviorY || h.overscrollBehavior,
           overflowX: h.overflowX };
});
ok(doc.overscroll === 'none',
   'no rubber band past the ends, and no pull-to-refresh', doc.overscroll);
ok(doc.overflowX === 'hidden', 'and nothing drifts sideways', doc.overflowX);

/* The long-press menu and the ghost drag, refused for real. */
const menu = await page.evaluate(() => {
  const row = document.querySelector('.tabbar__item') || document.body;
  const e = new MouseEvent('contextmenu', { cancelable: true, bubbles: true });
  row.dispatchEvent(e);
  return e.defaultPrevented;
});
ok(menu, 'the long-press menu does not open over the app');

const ghost = await page.evaluate(() => {
  const row = document.querySelector('.tabbar__item') || document.body;
  const e = new Event('dragstart', { cancelable: true, bubbles: true });
  row.dispatchEvent(e);
  return e.defaultPrevented;
});
ok(ghost, 'and nothing can be dragged out of it as a ghost');

/* But both stay where typing happens, because there they ARE the
   interface: cut, copy, paste and the spelling suggestions live in that
   menu. */
const typingKeeps = await page.evaluate(() => {
  const i = document.createElement('input');
  document.body.appendChild(i);
  const e = new MouseEvent('contextmenu', { cancelable: true, bubbles: true });
  i.dispatchEvent(e);
  const kept = !e.defaultPrevented;
  i.remove();
  return kept;
});
ok(typingKeeps, 'except in a field, where the menu is how you paste');

console.log('\n=== nothing flashes, and nothing turns blue ===\n');

const surfaces = await page.evaluate(() => {
  const out = { flash: [], selectable: [], n: 0 };
  for (const name of Object.keys(window.DEMO.screens)) {
    const root = window.DEMO.screens[name].root;
    root.querySelectorAll('button, .row, .card, .chip, h1, h2, p, span').forEach((el) => {
      out.n++;
      const s = getComputedStyle(el);
      const hl = s.webkitTapHighlightColor || '';
      /* Transparent in any spelling: rgba(0,0,0,0) is what it computes to. */
      if (hl && !/rgba\(0, 0, 0, 0\)|transparent/.test(hl)) {
        if (out.flash.length < 4) out.flash.push(name + ':' + el.className);
      }
      const us = s.userSelect || s.webkitUserSelect;
      if (us !== 'none' && out.selectable.length < 4) {
        out.selectable.push(name + ':' + el.tagName + '.' + el.className);
      }
    });
  }
  return out;
});
ok(surfaces.n > 500, 'checked across every screen', surfaces.n + ' elements');
ok(surfaces.flash.length === 0,
   'nothing flashes grey under a tap, rows and cards included',
   surfaces.flash.join(', '));
ok(surfaces.selectable.length === 0,
   'and nothing turns blue under a held thumb',
   surfaces.selectable.join(', '));

const fields = await page.evaluate(() => {
  const bad = [];
  let n = 0;
  for (const name of Object.keys(window.DEMO.screens)) {
    window.DEMO.screens[name].root.querySelectorAll('input, textarea').forEach((el) => {
      n++;
      const s = getComputedStyle(el);
      const us = s.userSelect || s.webkitUserSelect;
      if (us !== 'text' && us !== 'auto') bad.push(name + ':' + (el.id || el.type));
      /* And 16px or more, or iOS zooms the page when it takes focus. */
      if (parseFloat(s.fontSize) < 16) bad.push(name + ':' + (el.id || el.type) + '@' + s.fontSize);
    });
  }
  return { n: n, bad: bad };
});
ok(fields.bad.length === 0,
   'every field still selects, and none is small enough to make iOS zoom',
   fields.n + ' fields, ' + fields.bad.slice(0, 4).join(', '));

console.log('\n=== the two tabs made of sheets ===\n');

/* Coach and Fuel are where the sheets are -- search results, a meal's
   detail, the portion sheet, the plan, the recipes, the whole chat -- and
   a scroller that hands its scroll on to the document is the loudest
   remaining tell. .body had overscroll containment and nothing else did,
   so reaching the end of any sheet moved the page behind it. */
const scrollers = await page.evaluate(() => {
  const out = { n: 0, leaky: [] };
  for (const name of Object.keys(window.DEMO.screens)) {
    const root = window.DEMO.screens[name].root;
    root.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el);
      const scrolls = /auto|scroll/.test(s.overflowY) || /auto|scroll/.test(s.overflowX);
      if (!scrolls) return;
      /* Every scroll container, not only the ones overflowing right now.
         One that fits today scrolls tomorrow with a longer list in it,
         and it will chain then. */
      out.n++;
      const b = s.overscrollBehaviorY + ' ' + s.overscrollBehaviorX;
      if (/auto/.test(b) && out.leaky.length < 6) {
        out.leaky.push(name + ':' + (el.className || el.tagName) + ' = ' + b);
      }
    });
  }
  return out;
});
ok(scrollers.n > 0, 'there are scrollers to check', String(scrollers.n));
ok(scrollers.leaky.length === 0,
   'no scroller hands its scroll to the page behind it',
   scrollers.leaky.join(' | '));

/* Driven rather than read: open Fuel's search and Coach's chat, which
   are the two surfaces somebody types into every day, and check the
   sheet they raise contains its own scroll. */
async function sheetOf(screen, openTestid) {
  await page.evaluate((s) => window.DEMO.go(s), screen);
  await page.waitForTimeout(600);
  const opened = await page.evaluate(([s, t]) => {
    const rec = window.DEMO.screens[s];
    const root = rec.root || rec.host.shadowRoot;
    const b = root.querySelector('[data-testid="' + t + '"]');
    if (!b) return false;
    b.click();
    return true;
  }, [screen, openTestid]);
  await page.waitForTimeout(700);
  if (!opened) return null;
  return page.evaluate((s) => {
    const rec = window.DEMO.screens[s];
    const root = rec.root || rec.host.shadowRoot;
    const body = root.querySelector('.sheet__body');
    if (!body) return null;
    const st = getComputedStyle(body);
    return { contain: st.overscrollBehaviorY, momentum: st.webkitOverflowScrolling || 'n/a' };
  }, screen);
}

const fuelSheet = await sheetOf('fuel', 'log-search');
ok(fuelSheet && fuelSheet.contain === 'contain',
   'Fuel: the food search sheet keeps its scroll to itself',
   JSON.stringify(fuelSheet));

/* Coach's chat is the .body rather than a sheet, and it is the one
   surface in the app that grows under a keyboard. */
await page.evaluate(() => window.DEMO.go('coach'));
await page.waitForTimeout(700);
const chat = await page.evaluate(() => {
  const rec = window.DEMO.screens.coach;
  const root = rec.root || rec.host.shadowRoot;
  const body = root.querySelector('.body');
  const input = root.querySelector('.composer__input, textarea, input[type="text"]');
  if (!body) return null;
  const s = getComputedStyle(body);
  return { contain: s.overscrollBehaviorY,
           inputSize: input ? parseFloat(getComputedStyle(input).fontSize) : null,
           inputSelects: input ? (getComputedStyle(input).userSelect ||
                                  getComputedStyle(input).webkitUserSelect) : null };
});
ok(chat && chat.contain === 'none' || (chat && chat.contain === 'contain'),
   'Coach: the chat does not rubber-band the page', JSON.stringify(chat && chat.contain));
ok(chat && chat.inputSize >= 16,
   'and its composer is big enough that iOS will not zoom into it',
   String(chat && chat.inputSize));
ok(chat && (chat.inputSelects === 'text' || chat.inputSelects === 'auto'),
   'while still being a field you can select inside', String(chat && chat.inputSelects));

ok(errs.length === 0, 'nothing threw', errs.slice(0, 2).join(' | '));

await br.close(); site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
