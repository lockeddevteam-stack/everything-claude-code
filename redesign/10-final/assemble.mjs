#!/usr/bin/env node
/* LOCKED redesign — demo assembler.
 *
 *   node 10-final/assemble.mjs
 *
 * Reads the built screens from 08-build/ and emits 10-final/locked-demo.html:
 * one self-contained file that opens from file:// with no server and no
 * external request.
 *
 * Idempotent: same inputs produce a byte-identical output. Adding a screen to
 * 08-build/ needs no edit here — the screen is discovered, inlined and listed
 * in the demo's screen index automatically. The MANIFEST below only says which
 * screens are tabs, in what order, and which taps cross from one screen to
 * another.
 *
 * Isolation, since every screen is a whole HTML document with its own #screen,
 * #body, #dev-menu and its own top-level script:
 *   - each screen's markup goes into its own shadow root, so ids, aria
 *     references and styles cannot collide or bleed;
 *   - each screen's script is wrapped in its own closure and handed a document
 *     proxy scoped to that shadow root, so getElementById / querySelector /
 *     activeElement / document-level listeners all resolve inside the screen;
 *   - tokens.css and components.css are inlined once and adopted by every root.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* =================================================================
   MANIFEST — the only thing to touch when the app's shape changes.
   ================================================================= */

const MANIFEST = {
  srcDir: '../08-build',
  outFile: 'locked-demo.html',
  css: ['tokens.css', 'components.css'],

  /* Shared scripts every screen links with <script src=...> in <head>. They
     are inlined once, at the top of the page and outside every screen closure,
     so the globals they define — LKPatch, LKBodyArt, LKBodyMap — are the same
     objects for every screen, exactly as the two stylesheets are one parsed
     copy adopted by every root. Order matters: bodymap.js reads the art at
     load and throws if it is not there yet. */
  js: ['theme.js', 'app.js', 'chrome.js', 'vendor/body-art.js', 'bodymap.js'],

  /* Files in srcDir that are not app screens. */
  exclude: [/^mockup-/],

  /* The five tabs, in bar order. `screen: null` means "not built here". */
  /* The five tabs the app ships. Progress is not one of them: it lives under
     Home, which is where the live app puts it, reached by pushing rather than
     by switching. Shopping and Budget live under Fuel the same way. */
  tabs: [
    { id: 'home', label: 'Home', screen: 'home' },
    { id: 'train', label: 'Train', screen: 'train' },
    { id: 'fuel', label: 'Fuel', screen: 'fuel' },
    { id: 'coach', label: 'Coach', screen: 'coach' },
    { id: 'profile', label: 'Profile', screen: 'profile' }
  ],

  /* Screens that are pushed from somewhere rather than being a tab.
     Anything discovered in srcDir and not listed here is still included and
     still reachable from the demo's screen index; this table only adds the
     nicety of a named parent and a back control the screen already owns. */
  pushed: {
    'split-builder': { parent: 'train', backSelector: '[data-action="manual-back"]' },
    'exercise-library': { parent: 'train' },
    onboarding: { parent: 'home', standalone: true },
    settings: { parent: 'profile', backSelector: '[data-testid="back"]' },
    'workout-log': { parent: 'train' },
    shopping: { parent: 'fuel', backSelector: '[data-testid="back"]' },
    review: { parent: 'train', backSelector: '[data-testid="action-back"]' },
    /* Progress lives under Home. It was reachable only through the demo
       index, which pushes; the one tap that led to it from a screen was
       declared as a tab and there is no Progress tab, so it wrote a route
       nothing owned and the app went blank. */
    progress: { parent: 'home' }
  },

  /* Taps that leave a screen. Selector is matched with closest() inside the
     source screen's shadow root; the demo takes the click before the screen's
     own handler sees it. */
  nav: [
    { from: 'home', selector: '[data-testid="primary-action"]', to: 'train', mode: 'tab' },
    { from: 'home', selector: '[data-testid="action-choose-session"]', to: 'train', mode: 'tab' },
    { from: 'home', selector: '[data-testid="row-last-session"]', to: 'train', mode: 'tab' },
    { from: 'home', selector: '[data-testid="row-climbing-lift"]', to: 'progress', mode: 'push' },
    { from: 'train', selector: '[data-action="open-library"]', to: 'exercise-library', mode: 'push' },
    { from: 'train', selector: '[data-action="new-split"]', to: 'split-builder', mode: 'push' },
    { from: 'train', selector: '[data-action="edit-split"]', to: 'split-builder', mode: 'push' },
    { from: 'coach', selector: '[data-act="open-split"]', to: 'split-builder', mode: 'push' },
    { from: 'coach', selector: '[data-act="plan-start"]', to: 'train', mode: 'tab' },
    { from: 'home', selector: '[data-testid="open-account"]', to: 'settings', mode: 'push' },
    { from: 'train', selector: '[data-action="start-today"]', to: 'workout-log', mode: 'push' },
    { from: 'workout-log', selector: '[data-action="finish"]', to: 'review', mode: 'push' },
    { from: 'fuel', selector: '[data-testid="chip-more"]', to: 'shopping', mode: 'push' },
    { from: 'progress', selector: '[data-testid="empty-action"]', to: 'train', mode: 'tab' },
    { from: 'profile', selector: '[data-testid="open-settings"]', to: 'settings', mode: 'push' }
  ],

  /* Where a screen keeps its own state switcher. Harvested for the demo-level
     index so every state is listed in one place. */
  devStateSelector:
    '[data-testid="dev-menu"] button, [data-testid="dev-panel"] button, ' +
    '[data-testid="dev-list"] button, .dev__item, .devpanel button, .dev-list button',
  devToggleSelector: '[data-testid="dev-toggle"], [data-testid="dev-open"]',

  /* Every tab has a screen now, so there is nothing to stand in for. */
  placeholders: {}
};

/* =================================================================
   Read and parse
   ================================================================= */

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, MANIFEST.srcDir);

const read = (p) => readFileSync(p, 'utf8');

function stripTag(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
  const found = [];
  const rest = html.replace(re, (m) => {
    found.push(m.replace(new RegExp(`^<${tag}\\b[^>]*>`, 'i'), '').replace(new RegExp(`<\\/${tag}>$`, 'i'), ''));
    return '';
  });
  return { found, rest };
}

function parseScreen(file) {
  const raw = read(join(SRC, file));
  const id = file.replace(/\.html$/, '');

  const headMatch = raw.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error(`${file}: no <body>`);

  const head = headMatch ? headMatch[1] : '';
  const title = (head.match(/<title>([\s\S]*?)<\/title>/i) || [, id])[1].trim();

  const headStyles = stripTag(head, 'style').found;
  const bodyNoScript = stripTag(bodyMatch[1], 'script');
  const scripts = bodyNoScript.found;
  const bodyNoStyle = stripTag(bodyNoScript.rest, 'style');

  for (const s of scripts) {
    if (/<\/script/i.test(s)) throw new Error(`${file}: script contains a closing script tag`);
  }

  /* stripTag keeps the text BETWEEN the tags, so a <script src> in the body
     contributes an empty string and its file is never inlined — the screen
     then boots with a function it needs simply absent. No screen does this
     today; the point is that none can start to without the build saying so.
     A head-level inline script has the same problem: the head is mined for
     <title> and <style> and nothing else. */
  const bodySrc = bodyMatch[1].match(/<script[^>]*\ssrc=/i);
  if (bodySrc) throw new Error(`${file}: <script src> in the body would be dropped. Put it in the head and add it to MANIFEST.js.`);
  const headInline = head.replace(/<script[^>]*\ssrc=[^>]*>\s*<\/script>/gi, '').match(/<script[\s>]/i);
  if (headInline) throw new Error(`${file}: an inline <script> in the head would be dropped.`);

  /* External files the screen fetches. They are inlined so the demo makes no
     request from file://. */
  const assets = [];
  for (const s of scripts) {
    for (const m of s.matchAll(/fetch\(\s*['"]([^'"]+)['"]/g)) assets.push(m[1]);
  }

  return {
    id,
    file,
    title,
    label: title.replace(/^LOCKED\s*[—-]\s*/, '').trim() || id,
    css: [...headStyles, ...bodyNoStyle.found].join('\n').trim(),
    markup: bodyNoStyle.rest.trim(),
    scripts,
    assets: [...new Set(assets)]
  };
}

function discover() {
  const files = readdirSync(SRC)
    .filter((f) => f.endsWith('.html'))
    .filter((f) => !MANIFEST.exclude.some((re) => re.test(f)))
    .sort();

  const tabScreens = MANIFEST.tabs.map((t) => t.screen).filter(Boolean);
  const rank = (id) => {
    const i = tabScreens.indexOf(id);
    if (i >= 0) return [0, i, id];
    if (MANIFEST.pushed[id]) return [1, Object.keys(MANIFEST.pushed).indexOf(id), id];
    return [2, 0, id];
  };

  return files
    .map(parseScreen)
    .sort((a, b) => {
      const ra = rank(a.id);
      const rb = rank(b.id);
      return ra[0] - rb[0] || ra[1] - rb[1] || String(ra[2]).localeCompare(String(rb[2]));
    });
}

/* =================================================================
   Emit
   ================================================================= */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const jsonForScript = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/* The tab bar is lifted from a built screen so the Fuel placeholder carries the
   real bar rather than a hand-drawn copy of it. */
function tabbarFor(screens, currentTabId) {
  const donor = screens.find((s) => /<nav class="tabbar"/.test(s.markup));
  if (!donor) return '';
  const nav = donor.markup.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  return nav
    .replace(/\s+aria-current="page"/g, '')
    .replace(new RegExp(`(<button[^>]*data-testid="tab-${currentTabId}")`), '$1 aria-current="page"');
}

/* A tab whose screen is not built yet. Says what is coming and why, rather
   than rendering an empty shell that reads as a bug. */
function placeholderMarkup(screens, tabId, copy) {
  const f = copy;
  return `<div class="stage">
  <div class="phone">
    <div class="screen" id="screen" data-testid="screen-${tabId}" data-state="placeholder">

      <header class="hdr">
        <div class="hdr__title stack stack--1">
          <span class="t-meta">${esc(f.kicker)}</span>
          <h1 class="t-title">${esc(f.title)}</h1>
        </div>
      </header>

      <main class="body" id="body" tabindex="-1" data-testid="${tabId}-scroll">
        <div class="card card--sunken mt-4" data-testid="${tabId}-placeholder">
          <h2 class="t-section">${esc(f.heading)}</h2>
          <p class="t-detail mt-3">${esc(f.body)}</p>
          <p class="t-detail mt-3">${esc(f.truth)}</p>
          <p class="t-meta mt-4">Source: ${esc(f.source)}</p>
        </div>
      </main>

      ${tabbarFor(screens, tabId)}

    </div>
  </div>
</div>`;
}

function buildAssets(screens) {
  const map = {};
  for (const s of screens) {
    for (const a of s.assets) {
      const p = resolve(SRC, a);
      /* A missing asset used to be dropped here and surface much later as
         "demo is offline" from scopedFetch, at runtime, on whichever screen
         happened to need it. A build knows now. */
      if (!existsSync(p)) throw new Error(`${s.id}.html fetches "${a}", which does not exist in ${MANIFEST.srcDir}`);
      map[a] = read(p);
    }
  }
  return map;
}

const RUNTIME = String.raw`
(function () {
  "use strict";

  var CFG = window.__DEMO_CFG__;
  var GLOBAL_CSS = document.getElementById('demo-global-css').textContent;

  /* One parsed copy of the design system, adopted by every shadow root. */
  var SHEET = null;
  if (window.CSSStyleSheet && CSSStyleSheet.prototype.replaceSync) {
    try { SHEET = new CSSStyleSheet(); SHEET.replaceSync(GLOBAL_CSS); } catch (e) { SHEET = null; }
  }

  var screens = {};        /* id -> record */
  var defs = {};           /* id -> boot function */
  var order = [];
  var leaked = [];
  var booted = false;

  /* ---------------------------------------------------------------
     A document scoped to one shadow root. Every screen was written as
     a standalone page; this is what lets it keep that code unchanged.
     --------------------------------------------------------------- */
  function scopedDocument(root) {
    return new Proxy(document, {
      get: function (target, prop) {
        switch (prop) {
          case 'getElementById': return function (id) { return root.getElementById(id); };
          case 'querySelector': return function (s) { return root.querySelector(s); };
          case 'querySelectorAll': return function (s) { return root.querySelectorAll(s); };
          case 'getElementsByClassName': return function (c) { return root.querySelectorAll('.' + c); };
          case 'getElementsByTagName': return function (t) { return root.querySelectorAll(t); };
          case 'activeElement': return root.activeElement;
          case 'contains': return function (n) { return root.contains(n); };
          case 'addEventListener': return root.addEventListener.bind(root);
          case 'removeEventListener': return root.removeEventListener.bind(root);
          case 'dispatchEvent': return root.dispatchEvent.bind(root);
          default: {
            var v = target[prop];
            return typeof v === 'function' ? v.bind(target) : v;
          }
        }
      }
    });
  }

  /* A window whose writes land on the screen, not on the page. Screens ship
     test hooks (onboarding sets window.__locked); two screens setting the same
     name would otherwise overwrite each other. Reads still see the real window,
     so setTimeout, matchMedia and the rest behave normally. */
  function scopedWindow(rec, doc) {
    var store = rec.globals;
    return new Proxy(window, {
      get: function (t, p) {
        if (Object.prototype.hasOwnProperty.call(store, p)) return store[p];
        if (p === 'document') return doc;
        var v = t[p];
        return (typeof v === 'function' && !v.prototype) ? v.bind(t) : v;
      },
      set: function (t, p, v) { store[p] = v; return true; },
      has: function (t, p) { return Object.prototype.hasOwnProperty.call(store, p) || (p in t); },
      deleteProperty: function (t, p) { delete store[p]; return true; },
      getOwnPropertyDescriptor: function (t, p) {
        if (Object.prototype.hasOwnProperty.call(store, p)) {
          return { value: store[p], writable: true, enumerable: true, configurable: true };
        }
        return Object.getOwnPropertyDescriptor(t, p);
      }
    });
  }

  /* Screens fetch their seed data. Nothing is on the network here: the
     assembler inlined those files, and anything else fails fast. */
  function scopedFetch(id) {
    return function (url) {
      var key = String(url);
      var text = CFG.assets[key];
      if (text == null) return Promise.reject(new Error('demo is offline: ' + key));
      return Promise.resolve({
        ok: true, status: 200, url: key,
        json: function () { return Promise.resolve(JSON.parse(text)); },
        text: function () { return Promise.resolve(text); }
      });
    };
  }

  /* A hidden screen must never steal focus from the visible one. */
  var nativeFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function () {
    var r = this.getRootNode && this.getRootNode();
    if (r && r.host && r.host.classList && r.host.classList.contains('demo-screen') && r.host.hidden) return;
    return nativeFocus.apply(this, arguments);
  };

  function define(id, fn) { defs[id] = fn; }

  function mount(rec) {
    var host = document.createElement('div');
    host.className = 'demo-screen';
    host.id = 'demo-screen-' + rec.id;
    host.setAttribute('data-screen', rec.id);
    host.hidden = true;
    document.getElementById('demo-screens').appendChild(host);

    var root = host.attachShadow({ mode: 'open' });
    var frag = document.getElementById('demo-tpl-' + rec.id).content.cloneNode(true);

    /* The screen's own CSS has to land AFTER the design system, exactly as it
       did in the standalone page: some screens rely on cascade order rather
       than specificity (onboarding's trailing [hidden] { display: none }).
       Adopted sheets cascade after anything in the tree, so the screen's style
       is adopted second rather than left as a <style> in the tree. */
    var own = Array.prototype.slice.call(frag.querySelectorAll('style[data-screen-css]'));
    var ownCss = own.map(function (s) { return s.textContent; }).join('\n');
    own.forEach(function (s) { s.parentNode.removeChild(s); });

    if (SHEET) {
      var sheets = [SHEET];
      if (ownCss.trim()) {
        try { var s2 = new CSSStyleSheet(); s2.replaceSync(ownCss); sheets.push(s2); }
        catch (e) { var f = document.createElement('style'); f.textContent = ownCss; frag.insertBefore(f, frag.firstChild); }
      }
      root.adoptedStyleSheets = sheets;
    } else {
      var g = document.createElement('style'); g.textContent = GLOBAL_CSS; root.appendChild(g);
      if (ownCss.trim()) { var o = document.createElement('style'); o.textContent = ownCss; root.appendChild(o); }
    }
    root.appendChild(frag);

    rec.host = host;
    rec.root = root;
    return rec;
  }

  function boot(rec) {
    if (rec.booted || !defs[rec.id]) { rec.booted = true; return; }
    rec.booted = true;
    var before = Object.getOwnPropertyNames(window);
    try {
      var doc = scopedDocument(rec.root);
      defs[rec.id](doc, scopedWindow(rec, doc), window.location, scopedFetch(rec.id));
    } catch (err) {
      console.error('[demo] ' + rec.id + ' failed to boot', err);
    }
    var after = Object.getOwnPropertyNames(window);
    for (var i = 0; i < after.length; i++) {
      if (before.indexOf(after[i]) === -1 && after[i].indexOf('__DEMO') !== 0) {
        leaked.push(rec.id + ':' + after[i]);
      }
    }

    /* chrome.js self-inits against the real document on DOMContentLoaded,
       which here is a page with no screens in it. Six screens call
       LKChrome.init themselves because they re-render their own chrome; the
       other seven relied on that self-init and got nothing, so their large
       title, tab bar minimize, scroll edge and sheet detents were all dead in
       the demo while working from a file on disk.

       Wired here rather than by adding a call to seven screens: whether a
       screen's chrome works should not depend on the screen remembering to
       ask. init is idempotent, so the six that do call it are unaffected. */
    if (window.LKChrome) {
      try { window.LKChrome.init(rec.root); } catch (e) { console.error('[demo] chrome ' + rec.id, e); }
    }
  }

  /* ---------------------------------------------------------------
     Router. Hash-driven, so browser back works from file://.
       #/train                     a tab
       #/train/split-builder       a screen pushed on top of that tab
     --------------------------------------------------------------- */
  var TABS = CFG.tabs;
  var PUSHED = CFG.pushed;

  function tabOf(id) { for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return TABS[i]; return null; }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('/').filter(Boolean);
    var base = tabOf(parts[0]) ? parts[0] : TABS[0].id;
    var top = parts[1] && screens[parts[1]] ? parts[1] : null;
    return { base: base, top: top };
  }

  function screenForTab(tabId) {
    var t = tabOf(tabId);
    return t && t.screen ? t.screen : t.id + '-placeholder';
  }

  var current = null;
  var prevRoute = null;

  function labelOfRoute(r) {
    if (!r) return null;
    if (r.top) return (screens[r.top] || {}).label || r.top;
    var t = tabOf(r.base);
    return t ? t.label : r.base;
  }

  function show(id) {
    order.forEach(function (sid) {
      var rec = screens[sid];
      if (!rec) return;
      var on = sid === id;
      if (on && !rec.booted) boot(rec);
      rec.host.hidden = !on;
    });
    current = id;
    /* Charts and any other size-derived drawing redraw once visible. */
    window.dispatchEvent(new Event('resize'));
  }

  function syncTabs(route) {
    var rec = screens[current];
    if (!rec) return;
    var items = rec.root.querySelectorAll('[data-testid^="tab-"]');
    Array.prototype.forEach.call(items, function (b) {
      var name = b.getAttribute('data-testid').slice(4);
      if (name === route.base) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  function render() {
    var route = parseHash();
    var id = route.top || screenForTab(route.base);
    show(id);
    syncTabs(route);

    var bar = document.getElementById('demo-back');
    if (route.top) {
      /* Named for where you actually came from, since that is where it goes. */
      var fromLabel = (prevRoute && (prevRoute.top !== route.top || prevRoute.base !== route.base))
        ? labelOfRoute(prevRoute)
        : (tabOf(route.base) || {}).label || route.base;
      bar.hidden = false;
      bar.querySelector('.demo-back__label').textContent = 'Back to ' + fromLabel;
      bar.setAttribute('aria-label', 'Back to ' + fromLabel);
    } else {
      bar.hidden = true;
    }
    document.title = 'LOCKED demo — ' + ((screens[id] || {}).label || id);
    prevRoute = route;
  }

  /* The hashes THIS document navigated away from, so Back knows whether
     there is one of its own entries behind it.

     The old guard asked "not prevRoute or not route.top", and on the case its own
     comment named -- a deep link straight into a pushed screen -- prevRoute
     has already been set by the first render and route.top IS the pushed
     screen, so the guard was false, history.back() ran, and the browser left
     for whatever document was open before. Load #/fuel/shopping directly and
     press Back and the demo is gone. history.length cannot answer this
     either: it counts entries the demo did not create. This can. */
  var trail = [];
  function goTab(tabId) { trail.push(location.hash); location.hash = '#/' + tabId; }
  function push(screenId) {
    var route = parseHash();
    var parent = (PUSHED[screenId] && PUSHED[screenId].parent) || route.base;
    trail.push(location.hash);
    location.hash = '#/' + parent + '/' + screenId;
  }
  function back() {
    if (trail.length) { trail.pop(); history.back(); return; }
    /* Nothing of ours behind us: go to the parent rather than leaving. */
    var route = parseHash();
    location.hash = '#/' + ((PUSHED[route.top] && PUSHED[route.top].parent) || route.base || TABS[0].id);
  }

  /* ---------------------------------------------------------------
     Clicks that leave a screen: taken in the capture phase, before the
     screen's own delegated handler runs.
     --------------------------------------------------------------- */
  function wire(rec) {
    rec.root.addEventListener('click', function (e) {
      var path = e.composedPath();
      function hit(sel) {
        for (var i = 0; i < path.length; i++) {
          var n = path[i];
          if (n.nodeType === 1 && n.matches && n.matches(sel)) return n;
          if (n === rec.root) return null;
        }
        return null;
      }

      var tab = hit('[data-testid^="tab-"]');
      if (tab && tab.closest('.tabbar')) {
        e.preventDefault(); e.stopPropagation();
        goTab(tab.getAttribute('data-testid').slice(4));
        return;
      }

      for (var i = 0; i < CFG.nav.length; i++) {
        var n = CFG.nav[i];
        if (n.from !== rec.id) continue;
        if (hit(n.selector)) {
          e.preventDefault(); e.stopPropagation();
          if (n.mode === 'push') push(n.to); else goTab(n.to);
          return;
        }
      }

      var p = PUSHED[rec.id];
      if (p && p.backSelector && hit(p.backSelector) && parseHash().top === rec.id) {
        e.preventDefault(); e.stopPropagation();
        back();
      }
    }, true);
  }

  /* ---------------------------------------------------------------
     Demo-level index: every screen, and every state each screen's own
     switcher offers, in one list. The states are read from the screens
     themselves, so a new screen needs no entry here.
     --------------------------------------------------------------- */
  function devButtons(rec) {
    return Array.prototype.slice.call(rec.root.querySelectorAll(CFG.devStateSelector))
      .filter(function (b) { return b.textContent.trim() && !b.matches(CFG.devToggleSelector); });
  }

  function harvest(rec) {
    var found = devButtons(rec);
    if (found.length) return found;
    var toggle = rec.root.querySelector(CFG.devToggleSelector);
    if (toggle) {
      toggle.click();
      found = devButtons(rec);
      toggle.click();
    }
    return found;
  }

  function buildIndex() {
    var list = document.getElementById('demo-index-list');
    list.innerHTML = '';
    order.forEach(function (sid) {
      var rec = screens[sid];
      if (!rec) return;
      if (!rec.booted) { boot(rec); }
      var group = document.createElement('section');
      group.className = 'demo-index__group';

      var h = document.createElement('button');
      h.type = 'button';
      h.className = 'demo-index__screen';
      h.textContent = rec.label + (rec.tab ? '  ·  tab' : '  ·  pushed');
      h.addEventListener('click', function () { openScreen(sid); });
      group.appendChild(h);

      var states = harvest(rec);
      if (states.length) {
        var wrap = document.createElement('div');
        wrap.className = 'demo-index__states';
        states.forEach(function (b) {
          var s = document.createElement('button');
          s.type = 'button';
          s.className = 'demo-index__state';
          s.textContent = b.textContent.trim();
          s.addEventListener('click', function () {
            openScreen(sid);
            b.click();
          });
          wrap.appendChild(s);
        });
        group.appendChild(wrap);
      }
      list.appendChild(group);
    });
  }

  function openScreen(sid) {
    var rec = screens[sid];
    if (!rec) return;
    if (rec.tab) goTab(rec.tab);
    else if (/-placeholder$/.test(sid)) goTab(sid.replace('-placeholder', ''));
    else push(sid);
    closeIndex();
  }

  function openIndex() {
    var panel = document.getElementById('demo-index');
    var btn = document.getElementById('demo-index-toggle');
    buildIndex();
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }
  function closeIndex() {
    var panel = document.getElementById('demo-index');
    var btn = document.getElementById('demo-index-toggle');
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  /* --------------------------------------------------------------- */
  function start() {
    if (booted) return;
    booted = true;

    CFG.screens.forEach(function (meta) {
      var rec = mount({ id: meta.id, label: meta.label, tab: meta.tab || null, booted: false, globals: {} });
      screens[meta.id] = rec;
      order.push(meta.id);
      wire(rec);
    });

    /* Boot every screen up front so the index can read their states and so
       no screen pops in on first visit. Hidden screens cannot take focus. */
    order.forEach(function (sid) { boot(screens[sid]); });

    document.getElementById('demo-index-toggle').addEventListener('click', function () {
      var open = document.getElementById('demo-index').hidden;
      if (open) openIndex(); else closeIndex();
    });
    document.getElementById('demo-index-close').addEventListener('click', closeIndex);
    document.getElementById('demo-back').addEventListener('click', back);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.getElementById('demo-index').hidden) closeIndex();
    });

    window.addEventListener('hashchange', function () {
      /* The browser's own Back button walks the trail too, or Back-then-Back
         would try to pop an entry that is already behind us. */
      if (trail.length && trail[trail.length - 1] === location.hash) trail.pop();
      render();
    });
    if (!location.hash) location.replace(location.href.split('#')[0] + '#/' + TABS[0].id);
    render();
  }

  window.DEMO = {
    define: define,
    start: start,
    go: goTab,
    push: push,
    back: back,
    route: parseHash,
    screens: screens,
    leakedGlobals: leaked
  };
})();
`;

function demoCss() {
  return `
/* Demo chrome. Namespaced so it cannot touch a screen, and outside every
   shadow root so no screen's CSS can touch it. */
.demo-screen[hidden] { display: none; }
.demo-chrome {
  position: fixed; z-index: 40;
  left: 0; bottom: calc(56px + var(--sp-4) + var(--safe-bottom, 0px));
  display: flex; flex-direction: row; align-items: center; gap: var(--sp-2);
  /* On a narrow window there is nowhere off the phone to put this, so it goes
     off the canvas instead: an 8px sliver at rest, the whole strip when it is
     reached for. A "SCREENS" pill sitting on the app's own content is the
     scaffolding covering the thing it exists to show. */
  transform: translateX(calc(-100% + 8px));
  transition: transform var(--dur-slow, 300ms) var(--spring-snappy, ease);
}
.demo-chrome:hover, .demo-chrome:focus-within { transform: none; }
/* Given room, the demo's own controls sit off the phone entirely, so nothing
   in the design is ever covered. */
@media (min-width: 900px) {
  .demo-chrome {
    left: calc(50% - 196px - 216px); bottom: auto; top: var(--sp-5);
    flex-direction: column; align-items: flex-start;
    /* Room to sit beside the phone, so nothing needs hiding. */
    transform: none;
  }
  .demo-index { left: calc(50% - 196px - 216px); bottom: var(--sp-5); }
}
.demo-btn {
  display: inline-flex; align-items: center; gap: var(--sp-2);
  min-height: 44px; min-width: 44px; padding: 0 var(--sp-3);
  border-radius: var(--r-full);
  background: var(--surface-raised); color: var(--text-secondary);
  font-size: var(--type-11); line-height: var(--lh-11); letter-spacing: var(--tr-11);
  font-weight: var(--w-semibold); text-transform: uppercase;
  box-shadow: var(--shadow-raised);
}
.demo-btn[aria-expanded="true"] { color: var(--accent-text); }
.demo-btn[hidden] { display: none; }
.demo-index {
  position: fixed; z-index: 41;
  left: var(--sp-3); bottom: calc(56px + var(--sp-4) + var(--safe-bottom, 0px) + 44px + var(--sp-2));
  width: min(300px, calc(100vw - var(--sp-5)));
  max-height: min(70vh, 620px); overflow-y: auto;
  padding: var(--sp-3);
  border-radius: var(--r-lg);
  background: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
}
.demo-index[hidden] { display: none; }
.demo-index__head { display: flex; align-items: center; gap: var(--sp-2); min-height: 44px; }
.demo-index__head h2 {
  flex: 1; font-size: var(--type-17); line-height: var(--lh-17);
  letter-spacing: var(--tr-17); font-weight: var(--w-semibold); color: var(--text);
}
.demo-index__note {
  font-size: var(--type-11); line-height: var(--lh-11); letter-spacing: var(--tr-11);
  color: var(--text-tertiary); padding: 0 var(--sp-1) var(--sp-2);
}
.demo-index__group { padding-top: var(--sp-2); border-top: 1px solid var(--hairline); }
.demo-index__group:first-of-type { border-top: 0; }
.demo-index__screen {
  display: flex; align-items: center; width: 100%;
  min-height: 44px; padding: 0 var(--sp-2);
  border-radius: var(--r-sm);
  color: var(--text); text-align: left;
  font-size: var(--type-15); line-height: var(--lh-15); font-weight: var(--w-semibold);
}
.demo-index__screen:hover, .demo-index__state:hover { background: var(--hairline); }
.demo-index__states { display: flex; flex-direction: column; padding-bottom: var(--sp-2); }
.demo-index__state {
  display: flex; align-items: center; width: 100%;
  min-height: 44px; padding: 0 var(--sp-2) 0 var(--sp-4);
  border-radius: var(--r-sm);
  color: var(--text-secondary); text-align: left;
  font-size: var(--type-13); line-height: var(--lh-13); letter-spacing: var(--tr-13);
}
`.trim();
}

function build() {
  const screens = discover();
  const cssText = MANIFEST.css.map((f) => read(join(SRC, f))).join('\n\n');
  const sharedJs = MANIFEST.js.map((f) => {
    const text = read(join(SRC, f));
    if (/<\/script/i.test(text)) throw new Error(`${f}: contains a closing script tag`);
    return `<script>\n/* ${f} — inlined verbatim from 08-build/${f} */\n${text}\n</script>`;
  }).join('\n');
  const assets = buildAssets(screens);

  const tabByScreen = new Map(MANIFEST.tabs.filter((t) => t.screen).map((t) => [t.screen, t.id]));

  const records = [];
  for (const t of MANIFEST.tabs) {
    if (t.screen) {
      const s = screens.find((x) => x.id === t.screen);
      /* Throws. It used to skip: a tab whose screen file was renamed or
         deleted produced no record, no placeholder and no error, while
         cfg.tabs still carried the id — so the tab rendered a blank screen in
         a demo that built successfully. */
      if (!s) throw new Error(`tab "${t.id}" names screen "${t.screen}", which is not in ${MANIFEST.srcDir}`);
      records.push({ id: s.id, label: s.label, tab: t.id, css: s.css, markup: s.markup, scripts: s.scripts });
    } else {
      const copy = MANIFEST.placeholders[t.id];
      if (copy) {
        records.push({ id: t.id + '-placeholder', label: copy.title, tab: t.id,
                       css: '', markup: placeholderMarkup(screens, t.id, copy), scripts: [] });
      }
    }
  }
  for (const s of screens) {
    if (tabByScreen.has(s.id)) continue;
    records.push({ id: s.id, label: s.label, tab: null, css: s.css, markup: s.markup, scripts: s.scripts });
  }

  /* Every crossing has to land somewhere. `mode: 'tab'` writes a top-level
     route, and a top-level route that no tab owns renders nothing: the app
     goes blank with the hash changed, which reads as a freeze. That is what
     the Climbing lift row on Home did, and the build succeeded. It throws
     now, the way the other four silent-drop paths in this file do. */
  const tabIds = new Set(MANIFEST.tabs.map((t) => t.id));
  const screenIds = new Set(records.map((r) => r.id));
  for (const n of MANIFEST.nav) {
    /* mode first. Nothing used to assert it was one of the two, so an
       omitted or misspelled mode passed both checks below and the router
       falls through to goTab -- which is exactly the failure those checks
       exist to prevent. */
    if (n.mode !== 'tab' && n.mode !== 'push') {
      throw new Error(`nav ${n.from} -> ${n.to}: mode is ${JSON.stringify(n.mode)}, must be "tab" or "push"`);
    }
    if (!screenIds.has(n.from)) throw new Error(`nav from "${n.from}": no such screen`);
    if (!screenIds.has(n.to)) throw new Error(`nav ${n.from} -> ${n.to}: no such screen`);
    if (n.mode === 'tab' && !tabIds.has(n.to)) {
      throw new Error(`nav ${n.from} -> ${n.to} is mode "tab", but "${n.to}" is not a tab. Use mode "push" and give it a parent in MANIFEST.pushed.`);
    }
    if (n.mode === 'push' && !MANIFEST.pushed[n.to]) {
      throw new Error(`nav ${n.from} -> ${n.to} is mode "push", but "${n.to}" has no entry in MANIFEST.pushed.`);
    }
  }

  /* Every page navigation a screen performs has to be declared as a
     crossing, or the demo dies on it.

     A screen written to open from disk navigates with location.href, and the
     location it is handed here is the REAL window.location -- there is no
     scoped stand-in for it. If the demo has not claimed that click first,
     the browser leaves for a file that does not exist beside locked-demo.html
     and the whole demo is gone in one tap. Progress shipped exactly that:
     a "Start a workout" button under a comment asserting the router would
     take the click, and no manifest row to make it true.

     The check above cannot see an undeclared crossing, because there is
     nothing declared to look at. This one reads the screens themselves. */
  for (const s of screens) {
    const src = s.scripts.join('\n');
    const re = /location\.href\s*=\s*['"]([A-Za-z0-9_-]+)\.html['"]/g;
    let m;
    while ((m = re.exec(src))) {
      const to = m[1];
      if (!screenIds.has(to)) continue;          /* leaves the build entirely */
      const pushed = MANIFEST.pushed[s.id];
      /* A pushed screen going back to its parent is claimed by its
         backSelector rather than by a nav row -- the demo intercepts the
         same control to pop the route. That counts as declared. */
      const isBack = pushed && pushed.parent === to && pushed.backSelector;
      const declared = isBack || MANIFEST.nav.some((n) => n.from === s.id && n.to === to);
      if (!declared) {
        throw new Error(
          `${s.id}.html navigates to ${to}.html but MANIFEST.nav declares no ${s.id} -> ${to} crossing. ` +
          `In the demo that click leaves the page. Add the row, or stop navigating.`);
      }
    }
  }

  const cfg = {
    tabs: MANIFEST.tabs.map((t) => ({ id: t.id, label: t.label,
      screen: t.screen || (MANIFEST.placeholders[t.id] ? t.id + '-placeholder' : null) })),
    pushed: MANIFEST.pushed,
    nav: MANIFEST.nav,
    devStateSelector: MANIFEST.devStateSelector,
    devToggleSelector: MANIFEST.devToggleSelector,
    assets,
    screens: records.map((r) => ({ id: r.id, label: r.label, tab: r.tab }))
  };

  const templates = records
    .map(
      (r) =>
        `<template id="demo-tpl-${attr(r.id)}">\n` +
        (r.css ? `<style data-screen-css>\n/* ${r.id}: this screen's own CSS, scoped to this screen's shadow root */\n${r.css}\n</style>\n` : '') +
        `${r.markup}\n</template>`
    )
    .join('\n\n');

  const definitions = records
    .filter((r) => r.scripts.length)
    .map(
      (r) =>
        `<script>\n/* ${r.id} — original page script, unchanged, in its own closure.\n` +
        `   document is scoped to this screen's shadow root. */\n` +
        `DEMO.define(${JSON.stringify(r.id)}, function (document, window, location, fetch) {\n` +
        r.scripts.join('\n') +
        `\n});\n</script>`
    )
    .join('\n\n');

  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>LOCKED demo</title>
<!--
  Generated by 10-final/assemble.mjs. Do not hand-edit: run the assembler.

  Screens in this build: ${records.map((r) => r.id).join(', ')}.

  Every screen is a separate shadow root, so ids, aria references and CSS
  cannot cross between screens. Every screen's script runs in its own closure
  with a document proxy bound to that root. tokens.css and components.css are
  inlined once and adopted by each root. No iframes, no network.

  app.js (LKPatch) is inlined once, before anything else runs, and every
  screen's render goes through it instead of assigning innerHTML.
-->
<style id="demo-global-css">
${cssText}
</style>
<style id="demo-chrome-css">
${demoCss()}
</style>
${sharedJs}
</head>
<body>

<div id="demo-screens"></div>

<div class="demo-chrome">
  <button type="button" class="demo-btn" id="demo-index-toggle" aria-expanded="false" aria-controls="demo-index"
          data-testid="demo-index-toggle">Screens</button>
  <button type="button" class="demo-btn" id="demo-back" hidden data-testid="demo-back" aria-label="Back">
    <span aria-hidden="true">&#8592;</span><span class="demo-back__label">Back</span>
  </button>
</div>

<aside class="demo-index" id="demo-index" hidden aria-label="Every screen and state" data-testid="demo-index">
  <div class="demo-index__head">
    <h2>Screens and states</h2>
    <button type="button" class="demo-btn" id="demo-index-close" data-testid="demo-index-close" aria-label="Close the screen index">Close</button>
  </div>
  <p class="demo-index__note">Read from each screen's own state switcher, which still works inside the screen.</p>
  <div id="demo-index-list"></div>
</aside>

${templates}

<script>
window.__DEMO_CFG__ = ${jsonForScript(cfg)};
</script>
<script>${RUNTIME}</script>

${definitions}

<script>DEMO.start();</script>
</body>
</html>
`;
}

const out = join(HERE, MANIFEST.outFile);
const html = build();
writeFileSync(out, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`wrote ${out} (${kb} KB)`);
