/* ===================================================================
   LKTutor — the walkthrough that drives the real app.

   The tutorial this replaces was five cards, one per tab, three lines
   each. A reader finished it knowing the names of five screens and
   having watched nothing happen. This one makes the reader do the
   tapping, on the actual screens, with their own data underneath.

   HOW IT WORKS, in one paragraph. The demo shell mounts all eighteen
   screens once, each in an open shadow root. This file adds one layer
   above them all: a spotlight that springs to a rect, a pulse ring, a
   pointer tag, a coach card and a ghost cursor. Arming a step sets
   pointer-events: none on the whole screen host and pointer-events:
   auto on one element inside it. That is the entire trick. There is no
   invisible click-blocking overlay to get wrong, no cloned screen to
   drift from the real one: the screen is simply inert and one control
   is not, so the tap the reader makes is the tap the app receives and
   everything that follows is the app actually working.

   WHAT THIS FILE MUST NEVER DO. It must not simulate. If a step cannot
   find its control, the step is wrong and the suite that reads the same
   table will say so before a build ships. Nothing here fakes a screen,
   a number or a result -- the reason the old tutorial had to be thrown
   away is that one of its cards taught a feature the app did not have.

   REDUCED MOTION is not a degraded path. The spotlight cuts instead of
   springing, the ghost jumps instead of gliding, captions hold longer,
   and not one word is lost.
   =================================================================== */
(function (g) {
  'use strict';

  var doc = g.document;
  if (!doc) return;

  var REDUCED = false;
  try { REDUCED = g.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var IDLE_MS   = 6500;   /* before "Show me" offers to do it for you */
  var HOLD_MS   = 680;    /* a long press, matched to the app's own */
  var SETTLE_MS = 900;    /* after a tap, before the next step arms */
  var WAIT_MS   = 4000;   /* how long a step waits for its screen */

  /* ---- state ------------------------------------------------------ */
  var S = {
    running: false,
    track: null,      /* the track record */
    i: 0,             /* step index */
    armed: null,      /* the element made live */
    host: null,       /* the screen host made inert */
    handler: null,
    cancel: null,
    root: null,
    idleT: null,
    settleT: null,
    waitT: null,
    onEnd: null
  };

  /* ---- the layer --------------------------------------------------
     One element, appended to the body, outside every shadow root, so it
     measures in viewport coordinates and is styled by one stylesheet
     rather than eighteen. */
  var L = null;

  /* The layer lives in the light DOM, above every shadow root, so its
     CSS has to be at document level. It ships from here rather than from
     components.css because that sheet is adopted INTO each screen root,
     where this layer is not. One file, both ways of opening the app. */
  var CSS =
    '#lk-tutor{position:fixed;inset:0;z-index:9000;pointer-events:none;' +
      'font:inherit;color:var(--text,#f2f2f4)}' +
    '#lk-tutor[hidden]{display:none}' +
    '.tut__spot{position:absolute;border-radius:14px;pointer-events:none;' +
      'box-shadow:0 0 0 9999px rgba(4,4,6,.72);opacity:0;' +
      'transition:top .44s cubic-bezier(.22,1,.36,1),left .44s cubic-bezier(.22,1,.36,1),' +
      'width .44s cubic-bezier(.22,1,.36,1),height .44s cubic-bezier(.22,1,.36,1),opacity .28s}' +
    '.tut__pulse{position:absolute;border-radius:14px;pointer-events:none;opacity:0;' +
      'border:2px solid var(--accent,#f97316);animation:tutpulse 1.7s ease-out infinite;' +
      'transition:top .44s cubic-bezier(.22,1,.36,1),left .44s cubic-bezier(.22,1,.36,1),' +
      'width .44s cubic-bezier(.22,1,.36,1),height .44s cubic-bezier(.22,1,.36,1),opacity .28s}' +
    '@keyframes tutpulse{0%{box-shadow:0 0 0 0 rgba(249,115,22,.5)}' +
      '70%{box-shadow:0 0 0 14px rgba(249,115,22,0)}100%{box-shadow:0 0 0 0 rgba(249,115,22,0)}}' +
    '.tut__tag{position:absolute;transform:translateX(-50%);pointer-events:none;opacity:0;' +
      'background:var(--accent,#f97316);color:var(--on-accent,#0b0b0c);font-size:12px;' +
      'font-weight:800;padding:5px 11px;border-radius:999px;white-space:nowrap;' +
      'transition:opacity .3s;box-shadow:0 8px 22px rgba(0,0,0,.5)}' +
    '.tut__ghost{position:absolute;width:31px;height:31px;margin:-15.5px 0 0 -15.5px;' +
      'border-radius:50%;pointer-events:none;opacity:0;' +
      'background:radial-gradient(circle at 34% 32%,rgba(255,255,255,.96),' +
      'rgba(255,255,255,.36) 42%,rgba(249,115,22,.24) 70%,transparent 74%);' +
      'box-shadow:0 0 22px rgba(255,255,255,.32),0 0 46px rgba(249,115,22,.4);' +
      'transition:transform .6s cubic-bezier(.34,1.2,.42,1),opacity .3s}' +
    '.tut__card{position:absolute;left:16px;right:16px;pointer-events:auto;' +
      'background:var(--surface,#141416);border:1px solid rgba(255,255,255,.1);' +
      'border-radius:18px;padding:14px 16px 12px;box-shadow:0 18px 48px rgba(0,0,0,.6)}' +
    '.tut__card[data-at="bottom"]{bottom:16px}' +
    '.tut__card[data-at="top"]{top:16px}' +
    '.tut__where{display:flex;justify-content:space-between;font-size:11px;' +
      'letter-spacing:.08em;text-transform:uppercase;opacity:.6;margin-bottom:6px}' +
    '.tut__say{margin:0;font-size:16px;line-height:1.35;font-weight:650}' +
    '.tut__note{margin:6px 0 0;font-size:13.5px;line-height:1.4;opacity:.72}' +
    '.tut__note[hidden]{display:none}' +
    '.tut__row{display:flex;gap:8px;align-items:center;margin-top:12px}' +
    '.tut__row button{min-height:var(--tap,44px);padding:0 14px;border-radius:12px;' +
      'font:inherit;font-weight:700;font-size:14px;cursor:pointer;border:0}' +
    '.tut__row button[hidden]{display:none}' +
    /* SKIP IS AT FULL CONTRAST ON THE FIRST FRAME. A walkthrough whose exit
       is faint grey text under the primary is a walkthrough you cannot leave. */
    '.tut__skip{background:transparent;color:var(--text,#f2f2f4);' +
      'border:1px solid rgba(255,255,255,.22) !important}' +
    '.tut__show,.tut__go{margin-left:auto;background:var(--accent,#f97316);' +
      'color:var(--on-accent,#0b0b0c)}' +
    /* Reduced motion cuts rather than springs, and holds nothing back. */
    '#lk-tutor[data-reduced] .tut__spot,#lk-tutor[data-reduced] .tut__pulse,' +
      '#lk-tutor[data-reduced] .tut__ghost{transition:none}' +
    '#lk-tutor[data-reduced] .tut__pulse{animation:none}' +
    '@media (prefers-reduced-motion: reduce){#lk-tutor *{transition:none !important;' +
      'animation:none !important}}';

  function build() {
    if (L) return L;
    var st = doc.createElement('style');
    st.id = 'lk-tutor-css';
    st.textContent = CSS;
    doc.head.appendChild(st);
    L = doc.createElement('div');
    L.id = 'lk-tutor';
    L.setAttribute('data-testid', 'tutor-layer');
    L.innerHTML =
      '<div class="tut__spot" data-testid="tutor-spot"></div>' +
      '<div class="tut__pulse" data-testid="tutor-pulse"></div>' +
      '<div class="tut__tag" data-testid="tutor-tag"></div>' +
      '<div class="tut__ghost" data-testid="tutor-ghost"></div>' +
      '<div class="tut__card" data-testid="tutor-card" role="status" aria-live="polite">' +
        '<div class="tut__where"><span class="tut__mod" data-testid="tutor-module"></span>' +
          '<span class="tut__count" data-testid="tutor-count"></span></div>' +
        '<p class="tut__say" data-testid="tutor-say"></p>' +
        '<p class="tut__note" data-testid="tutor-note"></p>' +
        '<div class="tut__row">' +
          '<button type="button" class="tut__skip" data-testid="tutor-skip">Skip</button>' +
          '<button type="button" class="tut__show" data-testid="tutor-show" hidden>Show me</button>' +
          '<button type="button" class="tut__go" data-testid="tutor-continue" hidden>Continue</button>' +
        '</div>' +
      '</div>';
    doc.body.appendChild(L);
    if (REDUCED) L.setAttribute('data-reduced', '1');

    q('.tut__skip').addEventListener('click', function () { stop('skipped'); });
    q('.tut__show').addEventListener('click', function () { perform(step()); });
    q('.tut__go').addEventListener('click', function () { advance(); });
    return L;
  }

  function q(sel) { return L ? L.querySelector(sel) : null; }

  /* ---- reaching into the shell ------------------------------------
     The shadow roots are open on purpose, so a step can name a screen
     and a testid and this can find the real control. Nothing here
     reaches for anything the screen did not label. */
  function hostFor(screen) { return doc.getElementById('demo-screen-' + screen); }

  function currentScreen() {
    var on = doc.querySelector('.demo-screen:not([hidden])');
    return on ? on.getAttribute('data-screen') : null;
  }

  function elFor(st) {
    if (!st) return null;
    var h = hostFor(st.screen);
    if (!h || !h.shadowRoot) return null;
    var sel = st.sel || ('[data-testid="' + st.testid + '"]');
    var el = h.shadowRoot.querySelector(sel);
    /* A control inside a closed sheet is not a control anybody can tap,
       so an offscreen match is treated as not found. Catching it here
       turns a step that would hang into a step that reports. */
    if (el && !el.getClientRects().length) return null;
    return el;
  }

  /* ---- painting ---------------------------------------------------- */
  function press(el) {
    try {
      el.dispatchEvent(new MouseEvent('click',
        { bubbles: true, cancelable: true, composed: true, view: g }));
    } catch (e) { if (el.click) el.click(); }
  }

  function rectOf(el) {
    var r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, w: r.width, h: r.height };
  }

  function setSpot(el, pad) {
    var spot = q('.tut__spot'), pulse = q('.tut__pulse');
    if (!el) { spot.style.opacity = '0'; pulse.style.opacity = '0'; return; }
    var p = pad == null ? 6 : pad, r = rectOf(el);
    var css = 'top:' + (r.top - p) + 'px;left:' + (r.left - p) + 'px;' +
              'width:' + (r.w + p * 2) + 'px;height:' + (r.h + p * 2) + 'px;';
    spot.style.cssText = css + 'opacity:1';
    pulse.style.cssText = css + 'opacity:1';
  }

  function setPulse(on) { q('.tut__pulse').style.opacity = on ? '1' : '0'; }

  function setTag(el, text) {
    var tag = q('.tut__tag');
    if (!el || !text) { tag.style.opacity = '0'; return; }
    tag.textContent = text;
    var r = rectOf(el);
    /* Above the target, unless that would leave the screen. */
    var top = r.top - 34;
    if (top < 8) top = r.top + r.h + 10;
    tag.style.cssText = 'top:' + top + 'px;left:' + (r.left + r.w / 2) + 'px;opacity:1';
  }

  function moveGhost(el, dy) {
    var gh = q('.tut__ghost');
    if (!el) { gh.style.opacity = '0'; return; }
    var r = rectOf(el);
    gh.style.transform = 'translate(' + (r.left + r.w / 2) + 'px,' +
                                        (r.top + r.h / 2 + (dy || 0)) + 'px)';
    gh.style.opacity = '1';
  }

  /* THE CARD GOES INSIDE THE PHONE, NOT BESIDE IT, and flips to the top
     when the target sits low. Otherwise it covers the thing it is
     pointing at, and it would cover every bottom sheet in the app. */
  function placeCard(el) {
    var card = q('.tut__card');
    var low = false;
    if (el) {
      var r = rectOf(el);
      low = (r.top + r.h) > (g.innerHeight * 0.7);
    }
    card.setAttribute('data-at', low ? 'top' : 'bottom');
  }

  function caption(st, mod, n, total) {
    q('.tut__mod').textContent = mod || '';
    q('.tut__count').textContent = total ? ('Step ' + n + ' of ' + total) : '';
    q('.tut__say').textContent = st.say || '';
    var note = q('.tut__note');
    note.textContent = st.note || '';
    note.hidden = !st.note;
  }

  /* ---- arming ------------------------------------------------------ */
  function step() { return S.track && S.track.steps[S.i]; }

  function disarm() {
    clearTimeout(S.idleT); clearTimeout(S.settleT); clearTimeout(S.waitT);
    if (S.armed) {
      S.armed.style.pointerEvents = '';
      if (S.cancel) {
        S.armed.removeEventListener('pointerup', S.cancel);
        S.armed.removeEventListener('pointerleave', S.cancel);
      }
    }
    if (S.root && S.handler) {
      S.root.removeEventListener('click', S.handler, true);
      S.root.removeEventListener('pointerdown', S.handler, true);
    }
    S.root = null;
    if (S.host) S.host.style.pointerEvents = '';
    S.armed = null; S.host = null; S.handler = null; S.cancel = null;
    q('.tut__show').hidden = true;
    q('.tut__go').hidden = true;
    q('.tut__ghost').style.opacity = '0';
  }

  /* A step waits for its screen rather than navigating there itself. The
     step before it was a tap on a real control, so the app is already on
     its way; driving the hash as well would race the router and land the
     reader somewhere neither of them chose. */
  function waitForScreen(st, tries) {
    var el = elFor(st);
    if (el) return armOn(st, el);
    /* before() usually opens or fills the state the step needs, and the
       first attempt runs before the previous tap's sheet has finished
       opening. Running it again each turn is cheap and every one of them
       is idempotent by construction: they set a value, they do not
       append one. */
    if (st.before && (tries || 0) > 0 && (tries % 4) === 0) {
      try { st.before(); } catch (e) {}
    }
    if ((tries || 0) * 80 > WAIT_MS) return lost(st);
    S.waitT = setTimeout(function () { waitForScreen(st, (tries || 0) + 1); }, 80);
  }

  /* A step whose control never appears is not something to sit on
     silently. It says so, offers the way on, and the copy suite exists
     so this never reaches anybody. */
  function lost(st) {
    S.lost = true;
    caption({ say: 'That control is not on this screen.',
              note: 'Skip the rest, or carry on from the next step.' },
            S.track.name, S.i + 1, S.track.steps.length);
    q('.tut__go').hidden = false;
    setSpot(null); setTag(null);
    try { console.warn('LKTutor: no control for step', S.i + 1, st); } catch (e) {}
  }

  function arm() {
    var st = step();
    if (!st) return finish();
    S.lost = false;
    caption(st, S.track.name, S.i + 1, S.track.steps.length);
    if (st.before) { try { st.before(); } catch (e) {} }
    waitForScreen(st, 0);
  }

  function armOn(st, el) {
    if (st.scroll !== false) {
      try { el.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' }); } catch (e) {}
    }
    setTimeout(function () {
      setSpot(el, st.pad);
      placeCard(el);

      if (st.read) {
        /* A read step spotlights and waits. No ring, no tag: there is
           nothing to press, and a ring that means "look" one moment and
           "tap" the next teaches nothing. */
        setPulse(false); setTag(null);
        q('.tut__go').hidden = false;
        return;
      }

      setPulse(true);
      setTag(el, st.hint || 'Tap');

      var host = hostFor(st.screen);
      S.host = host;
      host.style.pointerEvents = 'none';
      el.style.pointerEvents = 'auto';
      S.armed = el;

      /* THE LISTENER GOES ON THE SHADOW ROOT, IN THE CAPTURE PHASE.

         The demo's router already listens there for taps that leave a
         screen, and it calls stopPropagation, so a listener on the
         target itself never runs: every crossing step -- Start the
         session, open Settings, the Fuel tab -- would sit there while
         the app navigated away underneath it. Two listeners on the same
         node both run regardless of stopPropagation, so this hears the
         tap whether the router claims it or not. */
      var root = hostFor(st.screen).shadowRoot;
      S.root = root;
      function mine(e) {
        var path = e.composedPath ? e.composedPath() : [];
        for (var i = 0; i < path.length; i++) if (path[i] === el) return true;
        return e.target === el;
      }

      if (st.hold) {
        var t = null;
        S.handler = function (e) {
          if (!mine(e)) return;
          if (e.cancelable) e.preventDefault();
          moveGhost(el, -28);
          clearTimeout(t);
          t = setTimeout(function () { succeed(st); }, HOLD_MS);
        };
        S.cancel = function () { clearTimeout(t); };
        root.addEventListener('pointerdown', S.handler, true);
        el.addEventListener('pointerup', S.cancel);
        el.addEventListener('pointerleave', S.cancel);
      } else {
        S.handler = function (e) { if (mine(e)) succeed(st); };
        root.addEventListener('click', S.handler, true);
      }

      /* NOBODY GETS STUCK. */
      S.idleT = setTimeout(function () { q('.tut__show').hidden = false; }, IDLE_MS);
    }, REDUCED ? 0 : 240);
  }

  /* Show me drives the same path a finger would: it moves the ghost onto
     the control and dispatches the real event. It does not shortcut to
     the next step, because a reader who watches a shortcut learns the
     shortcut. */
  function perform(st) {
    if (!st) return;
    var el = elFor(st);
    if (!el) return lost(st);
    q('.tut__show').hidden = true;
    moveGhost(el, st.hold ? -28 : 0);
    setTimeout(function () {
      if (st.hold) {
        try { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true })); } catch (e) {}
        setTimeout(function () { succeed(st); }, REDUCED ? 60 : HOLD_MS);
      } else {
        /* Dispatched rather than el.click(), because click() is on
           HTMLElement and half of what this points at is SVG: the body
           map's muscles are paths, and Show me would have thrown on
           every one of them. */
        press(el);
      }
    }, REDUCED ? 40 : 520);
  }

  function succeed(st) {
    disarm();
    setPulse(false); setTag(null);
    S.settleT = setTimeout(advance, st && st.settle != null ? st.settle
                                     : (REDUCED ? 350 : SETTLE_MS));
  }

  function advance() {
    disarm();
    S.i++;
    remember();
    arm();
  }

  /* ---- where somebody got to -------------------------------------- */
  function ST() { return g.LKStore || null; }

  function remember() {
    var s = ST(); if (!s || !S.track) return;
    var all = s.get('lk_tutorialSteps', {}) || {};
    if ((all[S.track.id] || 0) < S.i) { all[S.track.id] = S.i; s.set('lk_tutorialSteps', all); }
  }

  function markSeen() {
    var s = ST(); if (!s) return;
    s.set('lk_tutorialSeen', true);
    if (S.track) s.set('lk_tutorialTrack', S.track.id);
  }

  /* ---- the ends ----------------------------------------------------- */
  function finish() { end('finished'); }

  function stop(why) { end(why || 'stopped'); }

  function end(why) {
    disarm();
    setSpot(null); setTag(null);
    var track = S.track;
    S.running = false;
    /* BOTH EXITS WRITE lk_tutorialSeen. Quick start is the first-run gate,
       so leaving it early still satisfies it -- a walkthrough that comes
       back because you skipped it is a walkthrough you cannot leave. */
    if (track && track.gate) markSeen();
    if (L) L.hidden = true;
    doc.documentElement.removeAttribute('data-tutor');
    var cb = S.onEnd;
    S.track = null; S.i = 0; S.onEnd = null;
    if (cb) { try { cb({ track: track ? track.id : null, why: why }); } catch (e) {} }
    try {
      doc.dispatchEvent(new CustomEvent('lk:tutor-end',
        { detail: { track: track ? track.id : null, why: why } }));
    } catch (e) {}
  }

  /* ---- the API ------------------------------------------------------ */
  var API = {
    /* There is nothing to drive unless the shell mounted the screens.
       Opened on its own, tutorial.html keeps its own card deck and says
       so; pretending otherwise would spotlight thin air. */
    available: function () { return !!doc.querySelector('.demo-screen'); },

    reduced: function () { return REDUCED; },

    tracks: function () {
      var T = g.LKTutorSteps || {};
      return Object.keys(T).map(function (k) {
        return { id: k, name: T[k].name, blurb: T[k].blurb, steps: T[k].steps.length };
      });
    },

    /* How far through each track somebody got, so a half-finished module
       resumes where they left it instead of starting again. */
    progress: function () {
      var s = ST();
      return (s && s.get('lk_tutorialSteps', {})) || {};
    },

    start: function (id, opts) {
      var T = g.LKTutorSteps || {};
      var track = T[id];
      if (!track) return false;
      if (!API.available()) return false;
      build();
      L.hidden = false;
      doc.documentElement.setAttribute('data-tutor', id);
      S.running = true;
      S.track = { id: id, name: track.name, steps: track.steps, gate: !!track.gate };
      S.i = (opts && opts.resume) ? (API.progress()[id] || 0) : 0;
      if (S.i >= track.steps.length) S.i = 0;
      S.onEnd = opts && opts.onEnd;
      if (track.enter) { try { track.enter(); } catch (e) {} }
      setTimeout(arm, REDUCED ? 60 : 420);
      return true;
    },

    /* The control this step is waiting on, resolved exactly the way the
       player resolves it. The suite that drives all six tracks presses
       this rather than guessing a selector, so a step that passes the
       suite is a step a finger can complete. */
    target: function () { return elFor(step()); },
    lost: function () { return !!S.lost; },
    armed: function () { return !!S.armed; },
    waiting: function () { return !!(L && !q('.tut__go').hidden); },

    stop: function () { if (S.running) stop('stopped'); },
    running: function () { return S.running; },
    at: function () { return S.running ? { track: S.track.id, step: S.i } : null; }
  };

  g.LKTutor = API;
})(typeof window !== 'undefined' ? window : this);
