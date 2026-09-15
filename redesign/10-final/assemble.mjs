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

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* =================================================================
   MANIFEST — the only thing to touch when the app's shape changes.
   ================================================================= */

/* PRODUCTION vs DEMO — `node 10-final/assemble.mjs --prod`.

   The difference is the seed, and it is not cosmetic. fixtures.js defines
   LKFixtures, and LKStore.get falls back to it for any key nobody has
   written -- which is what makes the demo demonstrate anything, and what
   makes it unshippable as the product. A real person signing up with an
   empty account was shown "22 sessions logged", "288 sets", "140k kg" and
   a stranger's personal records as their own, because none of those keys
   were theirs and every one of them fell back to the seed.

   So the product build omits fixtures.js entirely and hides the dev state
   switcher, and writes to its own files so the demo keeps working as a
   demo. Nothing else differs: same screens, same scripts, same order. */
const PROD = process.argv.includes('--prod');

const MANIFEST = {
  srcDir: '../08-build',
  outFile: PROD ? 'locked-app.html' : 'locked-demo.html',
  css: ['tokens.css', 'components.css'],

  /* Shared scripts every screen links with <script src=...> in <head>. They
     are inlined once, at the top of the page and outside every screen closure,
     so the globals they define — LKPatch, LKBodyArt, LKBodyMap — are the same
     objects for every screen, exactly as the two stylesheets are one parsed
     copy adopted by every root. Order matters: bodymap.js reads the art at
     load and throws if it is not there yet. */
  /* session.js and fixtures.js belong here for the same reason: they define
     one global each (LKSession, LKFixtures) that sixteen screens read. Both
     were linked by the standalone screens and missing from this list, so in
     the demo every `if (window.LKSession)` guard failed silently and the
     session shelf did not exist on any route. */
  /* cloud-config.js before cloud.js: the seam reads window.LK_CLOUD on
     every call, but a screen that asks ready() during its own load would
     get false and paint the no-server state permanently.
     tutor-steps.js before tutor.js, and both at page level rather than
     inside a screen: the walkthrough is a layer ABOVE every shadow root
     and reaches into them, so it cannot live in one of them.
     store.js before cloud.js: the cloud seam reads the session out of the
     store on load. coach-actions.js before any screen that renders a coach
     card, for the same reason.
     exercises.js before store.js: store.js runs the migrations as it
     loads, and the one that puts a name on a record and on a split day
     reads the catalogue. Loaded after, the catalogue is not there when it
     is wanted and the migration has to wait for the next boot. */
  js: ['theme.js', 'app.js', 'chrome.js', 'vendor/body-art.js', 'bodymap.js',
       'session.js',
       /* the seed, and only in the demo */
       ...(PROD ? [] : ['fixtures.js']),
       'exercises.js', 'food-table.js', 'store.js', 'units.js',
       'cloud-config.js', 'cloud.js', 'voice.js', 'coach-actions.js',
       'tutor-steps.js', 'tutor.js'],

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
    onboarding: { parent: 'profile', standalone: true },
    settings: { parent: 'profile', backSelector: '[data-testid="back"]' },
    'workout-log': { parent: 'train' },
    shopping: { parent: 'fuel', backSelector: '[data-testid="back"]' },
    review: { parent: 'train', backSelector: '[data-testid="action-back"]' },
    /* Every history row on Train points here. It was in the shipped app and
       the rebuild dropped it without a note; the rows pointed at nothing. */
    'workout-detail': { parent: 'train', backSelector: '[data-testid="back"]' },
    /* The shipped app's entry was a card on Home, and it is a card on Home
       here. Gated, so the row only appears when the switch is on. */
    cycle: { parent: 'home', backSelector: '[data-testid="back"]' },
    /* Progress lives under Home. It was reachable only through the demo
       index, which pushes; the one tap that led to it from a screen was
       declared as a tab and there is no Progress tab, so it wrote a route
       nothing owned and the app went blank. */
    progress: { parent: 'home' },
    /* Three surfaces the rebuild cut -- the Weekly Recap, the month
       calendar and a daily view the old app never had -- restored as one
       screen with three segments, so Home gains one row rather than three. */
    recap: { parent: 'home', backSelector: '[data-testid="back"]' },
    /* Gated behind lk_perfTracking and off by default, so the chip that
       leads here does not exist until Settings turns it on. */
    stack: { parent: 'fuel', backSelector: '[data-testid="back"]' },
    /* The first-run walkthrough. Standalone like onboarding: it is a
       takeover, not a screen inside a tab. */
    tutorial: { parent: 'home', standalone: true }
  },

  /* Taps that leave a screen. Selector is matched with closest() inside the
     source screen's shadow root; the demo takes the click before the screen's
     own handler sees it. */
  nav: [
    { from: 'home', selector: '[data-testid="primary-action"]', to: 'workout-log', mode: 'push' },
    { from: 'home', selector: '[data-testid="action-choose-session"]', to: 'train', mode: 'tab' },
    /* Both rows name one session and open it. row-last-session went to the
       list of every session instead, and row-recent and See all were in no
       manifest row at all -- so in the demo they left for a file that is not
       beside locked-demo.html and the whole demo died on the tap. */
    { from: 'home', selector: '[data-testid="row-last-session"]', to: 'workout-detail', mode: 'push' },
    { from: 'home', selector: '[data-testid="row-recent"]', to: 'workout-detail', mode: 'push' },
    { from: 'home', selector: '[data-testid="recent-see-all"]', to: 'train', mode: 'tab' },
    { from: 'home', selector: '[data-testid="row-climbing-lift"]', to: 'progress', mode: 'push' },
    { from: 'home', selector: '[data-testid="row-recap"]', to: 'recap', mode: 'push' },
    /* Every session row on the recap, at all three scales, opens that
       session. Same destination as a history row on Train. */
    { from: 'recap', selector: '[data-action="open-session"]', to: 'workout-detail', mode: 'push' },
    { from: 'fuel', selector: '[data-testid="chip-stack"]', to: 'stack', mode: 'push' },
    /* Into the walkthrough from Settings' Help row, which is the only route
       to it: nothing opened tutorial.html at all. */
    { from: 'settings', selector: '[data-testid="row-tutorial"]', to: 'tutorial', mode: 'push' },
    { from: 'settings', selector: '[data-testid="row-tutorial-tour"]', to: 'tutorial', mode: 'push' },
    { from: 'tutorial', selector: '[data-testid="tut-skip"]', to: 'home', mode: 'tab' },
    { from: 'tutorial', selector: '[data-testid="tut-finish"]', to: 'home', mode: 'tab' },
    { from: 'train', selector: '[data-action="open-library"]', to: 'exercise-library', mode: 'push' },
    { from: 'train', selector: '[data-action="new-split"]', to: 'split-builder', mode: 'push' },
    { from: 'train', selector: '[data-action="edit-split"]', to: 'split-builder', mode: 'push' },
    { from: 'coach', selector: '[data-act="open-split"]', to: 'split-builder', mode: 'push' },
    { from: 'coach', selector: '[data-testid="plan-start"]', to: 'train', mode: 'tab' },
    /* The plan-binding toast's own action. On the shared toast-action id this
       crossing could not be declared without claiming every Undo on the
       screen, so it was not declared and its raw location.href took the demo
       with it. */
    { from: 'coach', selector: '[data-testid="toast-open-train"]', to: 'train', mode: 'tab' },
    { from: 'home', selector: '[data-testid="open-account"]', to: 'settings', mode: 'push' },
    { from: 'train', selector: '[data-action="start-today"]', to: 'workout-log', mode: 'push' },
    /* endsSession: the router swallows this click before the screen's own
       handler runs -- it has to, because that handler navigates with
       location.href and would take the whole demo with it. But that handler is
       also what ends the live session, so swallowing it left every route
       offering to Resume the workout you had just finished. The router does
       the ending itself instead. */
    { from: 'workout-log', selector: '[data-testid="btn-finish"]', to: 'review', mode: 'push', endsSession: true },
    { from: 'fuel', selector: '[data-testid="chip-more"]', to: 'shopping', mode: 'push' },
    { from: 'progress', selector: '[data-testid="empty-action"]', to: 'train', mode: 'tab' },
    { from: 'profile', selector: '[data-testid="open-settings"]', to: 'settings', mode: 'push' },
    /* Onboarding is a seventeen-step flow that nothing pushed. A guest had
       no way to become an account holder from inside the app. */
    /* Out of onboarding and into the app. The last screen's two controls
       carried no handler, so the flow ended there with the app behind them. */
    { from: 'onboarding', selector: '[data-testid="overview-start"]', to: 'workout-log', mode: 'push' },
    { from: 'onboarding', selector: '[data-testid="overview-freestyle"]', to: 'workout-log', mode: 'push' },
    { from: 'onboarding', selector: '[data-testid="overview-week"]', to: 'train', mode: 'tab' },
    /* Settings' guest card offers the same upgrade Profile's does, and it
       navigates for real now rather than toasting. */
    /* Cycle's rough-day card offers to open Train, which is the point of it:
       the guidance is about today's session. */
    { from: 'cycle', selector: '[data-testid="open-train"]', to: 'train', mode: 'tab' },
    /* Out of onboarding and back to the app, for a reader who opened it
       from Settings or Profile and already has one. Hidden on a genuine
       first run, where there is nothing behind it. */
    { from: 'onboarding', selector: '[data-testid="welcome-back"]', to: 'home', mode: 'tab' },
    { from: 'settings', selector: '[data-testid="create-account"]', to: 'onboarding', mode: 'push' },
    { from: 'settings', selector: '[data-testid="sign-in"]', to: 'onboarding', mode: 'push' },
    { from: 'profile', selector: '[data-testid="signup"]', to: 'onboarding', mode: 'push' },
    { from: 'profile', selector: '[data-testid="start-first"]', to: 'onboarding', mode: 'push' },
    /* The session shelf exists so a running session is not lost. It used to
       live on Home and Fuel only, and on both it was hand-written markup
       gated on a dev state -- a picture of the feature rather than the
       feature, with nothing anywhere writing a session down. It now reads
       the record in session.js and appears on every screen you can reach
       mid-workout, which is every screen but the workout log itself and
       onboarding, where there is no workout to be in the middle of. */
    { from: 'home', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'fuel', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'train', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'coach', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'profile', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'progress', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    /* The library's own way out. Without it the screen could only be left
       with the browser's back gesture, which an installed app does not have. */
    { from: 'exercise-library', selector: '[data-testid="library-exit"]', to: 'train', mode: 'tab' },
    /* Progress had no exit of its own either. Same arrow, same place. */
    { from: 'progress', selector: '[data-action="progress-back"]', to: 'home', mode: 'tab' },
    { from: 'exercise-library', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'shopping', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'cycle', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'settings', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'split-builder', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'workout-detail', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'review', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    /* Save used to end on a disabled button. Done is the way out of a
       finished session, and it goes to Home rather than back to the log,
       because the log is the thing that just ended. */
    { from: 'review', selector: '[data-testid="action-done"]', to: 'home', mode: 'tab' },
    /* THE WAYS OUT OF A SESSION THAT WAS NOT SAVED. Review draws no tab
       bar, so when a workout is finished with nothing in it -- which is
       what pressing Finish after a discard does -- these three are the
       only exits on the screen, and every one of them used to stop at a
       toast. Back and "Back to workout" return to Train when there is no
       session left to go back to; discarding goes there too, because the
       session it was reviewing is gone. */
    { from: 'review', selector: '[data-testid="action-back"]', to: 'train', mode: 'tab' },
    { from: 'review', selector: '[data-testid="action-back-to-workout"]', to: 'train', mode: 'tab' },
    { from: 'review', selector: '[data-testid="action-discard-confirm"]', to: 'train', mode: 'tab',
      endsSession: true },
    /* Discarding from the log itself leaves the same way. endsSession
       because the router claims this click in the capture phase, so the
       screen's own handler never runs to end the record -- without it the
       resume shelf went on offering the workout that had just been
       thrown away. */
    { from: 'workout-log', selector: '[data-testid="discard-confirm"]', to: 'train', mode: 'tab',
      endsSession: true },
    { from: 'recap', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    { from: 'stack', selector: '[data-testid="shelf-resume"]', to: 'workout-log', mode: 'push' },
    /* Coach's "open this lift in Progress", and Train's session-picker day.
       Both toasted a sentence describing what a working button would do. */
    { from: 'coach', selector: '[data-act="target"]', to: 'progress', mode: 'push' },
    { from: 'train', selector: '[data-action="start-day"]', to: 'workout-log', mode: 'push' },
    { from: 'train', selector: '[data-action="open-session"]', to: 'workout-detail', mode: 'push' },
    /* Repeat crosses; the screen writes lk_repeatWorkout on the lk:handoff
       announcement first, the way Finish already hands its session over.
       Without that the router left before the handler ran and the log
       opened as an empty "Quick Workout" with nothing carried across. */
    { from: 'workout-detail', selector: '[data-testid="detail-repeat"]', to: 'workout-log', mode: 'push' },
    /* EDIT DOES NOT CROSS. The editor is on this screen -- ed-name,
       ed-kg-*, ed-delset-*, ed-delex-*, ed-save, all built and all
       unreachable, because this crossing navigated to the workout log
       before the handler could render it. "Edit the sets" therefore threw
       the session away and opened an empty new one, and there was no way
       for anybody to correct a logged workout at all. */
    { from: 'home', selector: '[data-testid="row-cycle"]', to: 'cycle', mode: 'push' },
    { from: 'cycle', selector: '[data-testid="cycle-open-settings"]', to: 'settings', mode: 'push' }
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

  function failBoundary(rec, err) {
    try {
      var label = (rec.label || rec.id || 'This screen');
      var host = document.createElement('div');
      host.setAttribute('data-testid', 'screen-error');
      host.setAttribute('role', 'alert');
      host.style.cssText = 'padding:24px;display:flex;flex-direction:column;gap:12px;' +
        'align-items:flex-start;font:15px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif';
      var h = document.createElement('p');
      h.style.cssText = 'font-weight:600;margin:0';
      h.textContent = label + ' could not start.';
      var p1 = document.createElement('p');
      p1.style.cssText = 'margin:0;opacity:.7';
      p1.textContent = 'Nothing you have saved is affected, and the other screens still work. ' +
        'The tab bar below will take you to them.';
      var p2 = document.createElement('p');
      p2.style.cssText = 'margin:0;opacity:.55;font-size:13px;font-family:ui-monospace,monospace';
      p2.textContent = String((err && err.message) || err || 'Unknown error');
      var b2 = document.createElement('button');
      b2.type = 'button';
      b2.setAttribute('data-testid', 'screen-error-retry');
      b2.style.cssText = 'min-height:44px;padding:0 18px;border-radius:10px;border:1px solid currentColor;' +
        'background:none;color:inherit;font:inherit';
      b2.textContent = 'Try again';
      b2.addEventListener('click', function () {
        rec.booted = false;
        if (rec.root) rec.root.innerHTML = '';
        boot(rec);
      });
      host.appendChild(h); host.appendChild(p1); host.appendChild(p2); host.appendChild(b2);
      if (rec.root) { rec.root.innerHTML = ''; rec.root.appendChild(host); }
    } catch (e2) {
      /* The boundary itself must never throw, or the failure it is reporting
         becomes two failures and the page goes blank. */
      console.error('[demo] error boundary failed', e2);
    }
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
      /* SOMETHING ON THE SCREEN. A screen that threw on boot left its root
         empty, so the page rendered the word "SCREENS" and the error went to
         a console nobody on a phone can open. A reader cannot tell that from
         a screen that has genuinely finished loading and has nothing to say.

         The rest of the app keeps working: one screen failing is not a
         reason to take the other seventeen down with it. */
      failBoundary(rec, err);
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

  /* Takes a hash so the Back label can parse a route off the trail, not only
     the one in the address bar. */
  function parseHash(h) {
    var raw = (h === undefined ? (location.hash || '') : (h || '')).replace(/^#\/?/, '');
    var parts = raw.split('/').filter(Boolean);
    /* A bare screen id in the first segment is a pushed screen over its own
       parent tab. Only a tab id was accepted here, so #/onboarding -- which
       is exactly what the first-run gate sets -- fell back to Home and a
       brand-new reader landed on a stranger's five weeks of training. */
    if (parts[0] && !tabOf(parts[0]) && screens[parts[0]]) {
      var owner = (PUSHED[parts[0]] && PUSHED[parts[0]].parent) || TABS[0].id;
      return { base: tabOf(owner) ? owner : TABS[0].id, top: parts[0] };
    }
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
    /* A screen is entered, not merely un-hidden. In the demo every screen
       stays mounted for the life of the page, so a screen with a lifecycle --
       the workout log, which has to know it is being opened for a new session
       rather than still showing a finished one -- has no other way to hear it.
       Screens listen with document.addEventListener('lk:enter'), which their
       scoped document routes to their own root. */
    var er = screens[id];
    if (er && er.booted && er.root) {
      try { er.root.dispatchEvent(new CustomEvent('lk:enter', { detail: { id: id } })); } catch (e) {}
    }
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
      /* Named for where Back actually goes, which is the top of the trail --
         the route this document last navigated AWAY from and would return to.

         prevRoute is not that. It is the previous render, and after a Back
         the previous render is the screen you just left, which is FORWARD:
         standing on the workout log after log -> review -> back, the button
         read "Back to Review" and went to Train. */
      var fromLabel = trail.length
        ? labelOfRoute(parseHash(trail[trail.length - 1]))
        : (tabOf(route.base) || {}).label || route.base;
      bar.hidden = false;
      bar.querySelector('.demo-back__label').textContent = 'Back to ' + fromLabel;
      bar.setAttribute('aria-label', 'Back to ' + fromLabel);
    } else {
      bar.hidden = true;
    }
    /* The product is not called "LOCKED demo". The tab, the installed app's
       name and anything that shares a link all read this. */
    document.title = CFG.appTitle + ' — ' + ((screens[id] || {}).label || id);
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
  var lastHash = location.hash;
  /* One place maintains the trail: the hashchange handler, which sees every
     route change however it was made. Pushing from goTab and push() alone
     missed a hash set from outside the router -- a deep link, or the demo's
     own screen index -- and then the Back label named a route from further
     back than the one history.back() would actually return to. */
  function walked() {
    if (trail.length && trail[trail.length - 1] === location.hash) trail.pop();
    else if (lastHash !== location.hash) trail.push(lastHash);
    lastHash = location.hash;
  }
  function goTab(tabId) { location.hash = '#/' + tabId; }
  function push(screenId) {
    var route = parseHash();
    var parent = (PUSHED[screenId] && PUSHED[screenId].parent) || route.base;
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
        var crossed = hit(n.selector);
        if (crossed) {
          e.preventDefault(); e.stopPropagation();
          /* The screen's own handler is never going to run -- it navigates
             with location.href and would take the demo with it -- so tell the
             screen the crossing is happening and let it hand over first.
             Without this the log's Finish wrote no lk_lastSession and Review
             opened on a session nobody had done. */
          try {
            rec.root.dispatchEvent(new CustomEvent('lk:handoff', {
              detail: { selector: n.selector, from: n.from, to: n.to, el: crossed }
            }));
          } catch (err) {}
          if (n.endsSession && window.LKSession) window.LKSession.end();
          if (n.mode === 'push') push(n.to); else goTab(n.to);
          return;
        }
      }

      var p = PUSHED[rec.id];
      if (p && p.backSelector && hit(p.backSelector) && parseHash().top === rec.id) {
        e.preventDefault(); e.stopPropagation();
        /* THE SCREEN CAN SAY NOT YET. This called back() immediately, so a
           screen with unsaved work never got to ask about it: the split
           builder's "Save this split first?" dialog exists, is wired, and
           could not fire, because the router had already left. A screen
           that wants the question preventDefault()s this and shows its
           own; anything that does not is unaffected. */
        var veto = false;
        try {
          var ev = new CustomEvent('lk:beforeback', {
            cancelable: true, detail: { from: rec.id, to: p.parent }
          });
          rec.root.dispatchEvent(ev);
          veto = ev.defaultPrevented;
        } catch (err) {}
        if (!veto) back();
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
      walked();
      render();
    });
    /* FIRST RUN GOES TO ONBOARDING. A cleared phone landed on Home, which is
       a screen about training somebody has not done, with a split they have
       not built, under a name the app does not know. lk_onboarded is written
       when setup finishes; without it, and with nothing else stored either,
       the first screen is the one that asks.

       Gated on BOTH, so a reader upgrading from a build that predates the
       marker is not sent back through setup on top of their own data. */
    if (!location.hash) {
      var first = TABS[0].id;
      try {
        var done = window.localStorage.getItem('lk_onboarded');
        var used = window.localStorage.getItem('lk_profile') ||
                   window.localStorage.getItem('lk_splits') ||
                   window.localStorage.getItem('lk_history');
        if (!done && !used && screens.onboarding) first = 'onboarding';
        /* Setup done, the walkthrough not yet seen: show it once. tutorial.html
           writes lk_tutorialSeen on both finish and skip and nothing read it,
           so the walkthrough was built, animated, and never shown to anybody
           who had not gone looking for it in Settings. */
        else if (done && !window.localStorage.getItem('lk_tutorialSeen') && screens.tutorial) {
          first = 'tutorial';
        }
      } catch (e) {}
      location.replace(location.href.split('#')[0] + '#/' + first);
    }
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

/* A square mark rather than a letter: an icon is what somebody taps for on a
   crowded home screen, and a glyph at 48px is a smudge. Inlined as an SVG
   data URL so the build stays one file with no assets beside it. */
const APP_ICON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
  '<rect width="512" height="512" rx="114" fill="#0b0b0c"/>' +
  '<rect x="150" y="150" width="212" height="212" rx="46" fill="none" stroke="#f2f2f4" stroke-width="34"/>' +
  '<rect x="222" y="222" width="68" height="68" rx="18" fill="#f2f2f4"/>' +
  '</svg>');

function manifest() {
  return {
    name: 'LOCKED',
    short_name: 'LOCKED',
    description: 'Training, food and recovery, on your phone, on your device.',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    categories: ['health', 'fitness'],
    icons: [
      { src: APP_ICON, sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
      { src: APP_ICON, sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
    ]
  };
}

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
    /* Both spellings: the old direct navigation, and LKGo, which is what
       a programmatic crossing uses now. The check is about whether the
       crossing is declared, not about how it is spelled. */
    const re = /(?:location\.href\s*=\s*['"]([A-Za-z0-9_-]+)\.html['"]|LKGo\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\))/g;
    let m;
    while ((m = re.exec(src))) {
      const to = m[1] || m[2];
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
    /* Not a template string: this object is JSON.stringify'd into the
       page, so it has to carry the resolved value, not the expression. */
    appTitle: PROD ? 'LOCKED' : 'LOCKED demo',
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
<!-- NO maximum-scale, NO user-scalable=no. The app feel that was asked for
     is the double-tap zoom and the sideways drift, and those are gone
     through touch-action: manipulation and overflow-x: hidden in the CSS.
     Blocking PINCH zoom is a different thing: it is a critical axe failure
     on every screen, it is WCAG 1.4.4, and Safari has ignored it since iOS
     10 anyway -- so it cost the audit and bought nothing on the phone this
     ships to. The standalone screens never carried it; the assembled build
     was the only thing that did. -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${PROD ? 'LOCKED' : 'LOCKED demo'}</title>
<!-- Installable, and it says what it is on the home screen. None of this
     existed: a web app with no manifest and no apple metas installs as a
     browser bookmark with a screenshot for an icon and a browser chrome
     around it, which is a different product from the one being built. The
     manifest is inlined as a data URL so the whole build stays one file. -->
<link rel="manifest" href="data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest()))}">
<meta name="theme-color" content="#0b0b0c" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f7f7f8" media="(prefers-color-scheme: light)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="LOCKED">
<meta name="mobile-web-app-capable" content="yes">
<meta name="color-scheme" content="dark light">
<meta name="format-detection" content="telephone=no">
<meta name="description" content="LOCKED. Training, food and recovery, on your phone, on your device.">
<link rel="apple-touch-icon" href="${APP_ICON}">
<link rel="icon" href="${APP_ICON}">
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
${PROD ? `
/* THE DEV STATE SWITCHER IS NOT A PRODUCT CONTROL. Every screen carries
   one so a reviewer can jump to its empty, loading and error states. It is
   markup inside the screen rather than something the assembler adds, so
   the product build hides it here -- one rule, adopted by all eighteen
   roots -- rather than by editing eighteen files and risking the states
   the suite drives through it. */
.dev, .dev__toggle, .dev__menu,
[data-testid="dev-toggle"], [data-testid="dev-menu"] { display: none !important; }
` : ''}
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
<script>
/* Registered only where a service worker can actually run: a secure origin,
   and not from disk. Opened as a file the demo has no worker and claims
   none. A failed registration is not worth a word on screen -- the page
   works either way, and offline is the only thing that changes. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1') return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}());
</script>
</body>
</html>
`;
}

/* THE SERVICE WORKER. One page, no network calls of its own, so caching it
   is the whole job: fetch from the network, fall back to the copy, and keep
   one version's files and nothing else. It is a separate file because a
   service worker cannot be inlined -- which also means the single-file demo
   opened from disk has none, and says nothing about having one.

   The version string is the build's own byte length, so a rebuilt demo
   invalidates the cache without anybody remembering to bump a number. */
function serviceWorker(version) {
  return `/* LOCKED — generated by 10-final/assemble.mjs. Do not edit. */
var CACHE = 'locked-${version}';
var FILES = ['./', './index.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })
    .then(function () { return self.skipWaiting(); }));
});

/* One version's cache and nothing else: an old build's files are deleted
   rather than left to fill the quota. */
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      return k === CACHE ? null : caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

/* Network first, so a rebuilt demo is never served stale while online, and
   the cached copy answers when there is no network. Only GETs on this
   origin: anything else is none of this worker's business. */
/* ---- reminders ----------------------------------------------------
   A push subscription with no push handler is a subscription that does
   nothing: the reminder arrives, the worker ignores it, and the browser
   shows its own "this site was updated in the background" notice instead
   -- which is the penalty for a userVisibleOnly subscription that fails
   to be visible. Settings says "this phone is registered for reminders",
   so it has to be.

   The server sends { type, title, body, url }. Nothing is invented here:
   a payload that will not parse gets the one generic line rather than a
   guess at what the reminder was about. */
/* ---- the rest timer, while the app is not on screen ------------------
   A closed PWA runs no JavaScript, so the page cannot ring its own bell.
   The worker outlives the page for a while though, so the page hands it
   the DEADLINE when a rest starts and the worker posts the notification
   at that moment. A deadline rather than a duration, because the page
   may have been shut for a minute before this arrives.

   This is best-effort by nature: the browser may stop the worker, and
   then nothing fires until the app is opened, where the page's own
   catch-up says the rest is over. The CLOCK is always right -- that is
   held as a timestamp and cannot drift. Only the buzz is a maybe. */
var restTimer = null;

function armRest(endsAt, label) {
  if (restTimer) { clearTimeout(restTimer); restTimer = null; }
  var wait = endsAt - Date.now();
  if (!(wait > 0)) return;
  restTimer = setTimeout(function () {
    restTimer = null;
    /* If a window is open and visible, it is already showing the strip
       counting to zero and saying it out loud; a notification on top of
       that is noise. */
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (list) {
        for (var i = 0; i < list.length; i++) {
          if (list[i].visibilityState === 'visible') return null;
        }
        return self.registration.showNotification('Rest over', {
          body: label ? ('Next set: ' + label) : 'Time for your next set.',
          tag: 'lk-rest',
          renotify: true,
          data: { url: './?open=workout', type: 'rest' }
        });
      }).catch(function () {});
  }, wait);
}

self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.type === 'lk-rest-arm') armRest(Number(d.endsAt) || 0, d.label || '');
  else if (d.type === 'lk-rest-cancel') {
    if (restTimer) { clearTimeout(restTimer); restTimer = null; }
  }
});

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {}; }
  var title = d.title || 'LOCKED';
  var body = d.body || 'A reminder from LOCKED.';
  e.waitUntil(self.registration.showNotification(title, {
    body: body,
    tag: d.type || 'lk',
    renotify: false,
    data: { url: d.url || './', type: d.type || '' }
  }));
});

/* WHERE A REMINDER GOES WHEN IT IS TAPPED. The server addresses screens
   as ?open=workout; this app routes by hash, so the two are mapped here
   rather than leaving every reminder to land on Home and make the person
   find the thing it was about. An already-open window is focused and
   told where to go, because opening a second copy of an installed app
   loses whatever was on the first. */
var OPENS = {
  workout: '#/train/workout-log',
  checkin: '#/coach',
  fuel: '#/fuel',
  train: '#/train',
  progress: '#/home/progress'
};

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  /* Built against the registration's own scope, not against the origin.
     The app is not necessarily at the root, and a relative './#/fuel'
     resolves against whatever page is open -- so a reminder tapped from
     a pushed screen would have gone somewhere neither of us chose. */
  var base = self.registration.scope;
  var raw = (e.notification.data && e.notification.data.url) || '';
  var want = base;
  try {
    var u = new URL(raw, base);
    var open = u.searchParams.get('open');
    var hash = OPENS[open] || u.hash || '';
    want = base + hash;
  } catch (err) { want = base; }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(base) === 0 && 'focus' in c) {
          /* An installed app has one window and whatever was on it. Opening
             a second copy loses that, so the open one is told where to go. */
          if ('navigate' in c) { try { c.navigate(want); } catch (err2) {} }
          return c.focus();
        }
      }
      return self.clients.openWindow(want);
    }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
`;
}

const out = join(HERE, MANIFEST.outFile);
const html = build();
writeFileSync(out, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`wrote ${out} (${kb} KB)`);

/* The same file again, as the whole contents of demo/ at the repo root.
   That directory is what the hosted build serves, and it holds nothing else
   on purpose: a static host publishes every file under its root, so pointing
   it at the repo would put the audits, the fixtures and the working notes on
   a public URL beside the demo. Written here rather than copied by hand so a
   rebuilt demo cannot ship a stale one. */
const web = join(HERE, '..', '..', PROD ? 'app' : 'demo', 'index.html');
mkdirSync(dirname(web), { recursive: true });
writeFileSync(web, html);
console.log(`wrote ${web} (${kb} KB)`);

/* Beside it, because a service worker has to be a file of its own and has to
   sit at or above the scope it claims. The single-file demo never registers
   one -- a worker cannot run from file:// and claiming otherwise would be
   the build lying about what it does offline. */
const sw = join(dirname(web), 'sw.js');
writeFileSync(sw, serviceWorker(Buffer.byteLength(html)));
console.log(`wrote ${sw}`);
