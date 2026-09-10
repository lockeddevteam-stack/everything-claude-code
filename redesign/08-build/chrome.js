/* LOCKED — the chrome behaviours.

   Loaded next to app.js. Four things, all of them scroll-driven, all of them
   things iOS does that a web page does not:

     the large title collapsing into the bar
     the tab bar shrinking out of the way and coming back
     the soft edge under a bar that content scrolls beneath
     a sheet you can drag between heights

   Every one is opt-in by markup. A screen that does not want a collapsing
   title does not get one, and nothing here runs on a screen that has no
   scroller. Reduced motion turns the movement off and leaves the behaviour:
   the title still shrinks, it just does not travel.

   WHY SCROLL AND NOT AN OBSERVER
   An IntersectionObserver fires when a threshold is crossed, which is enough
   to swap a class but not enough to interpolate. The collapse is a continuous
   morph from 34px to 17px across 52px of scroll, so it needs the offset on
   every frame, not a notification twice.
*/
(function (global) {
  'use strict';

  var doc = global.document;
  if (!doc) return;

  function reduced() {
    return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* One rAF across all handlers: scroll fires far faster than the screen
     refreshes and doing layout per event is how a scroll drops frames. */
  function onScrollFrame(scroller, fn) {
    var queued = false;
    function run() { queued = false; fn(scroller.scrollTop || 0); }
    scroller.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }, { passive: true });
    fn(scroller.scrollTop || 0);
  }

  /* ---------------------------------------------------------------
     Large title

     34px bold on the left at rest, 17px semibold centred once the content has
     scrolled past it. The travel is 52px, which is the difference between a
     large-title bar and a plain one.
     --------------------------------------------------------------- */
  var TRAVEL = 52;

  /* init() runs after every render on the screens that re-render their own
     chrome. LKPatch morphs rather than replaces, so the same element comes
     back each time and would collect another scroll listener on every pass.
     Each initialiser marks what it has wired. */
  function once(el, key) {
    if (el['__lk_' + key]) return false;
    el['__lk_' + key] = true;
    return true;
  }

  function initLargeTitle(root) {
    var bars = root.querySelectorAll('[data-large-title]');
    Array.prototype.forEach.call(bars, function (bar) {
      var scroller = root.querySelector(bar.getAttribute('data-large-title'));
      if (!scroller) return;
      var big = bar.querySelector('[data-title-large]');
      var small = bar.querySelector('[data-title-small]');
      if (!big) return;
      if (!once(bar, 'title')) return;

      /* The bar's height is interpolated, not switched. The shipped version
         put the whole 30px height change on a class that flipped at t > 0.98,
         so the page lurched once, in one frame, halfway through a scroll --
         and at the bottom of a short page the grown scroll container clamped
         scrollTop and dragged the content back down with it. Measured on
         Fuel: clientHeight 714 -> 744 in one frame, scrollTop 73 -> 43. */
      var expanded = 0;

      onScrollFrame(scroller, function (y) {
        var t = Math.min(1, Math.max(0, y / TRAVEL));
        if (!expanded && t === 0) expanded = bar.offsetHeight;
        if (expanded) {
          var compact = parseFloat(getComputedStyle(bar).getPropertyValue('--nav-h-compact')) || 44;
          if (compact < expanded) bar.style.height = (expanded - t * (expanded - compact)) + 'px';
        }
        bar.setAttribute('data-collapsed', t > 0.98 ? 'true' : 'false');
        if (reduced()) {
          big.style.opacity = t > 0.5 ? '0' : '1';
          if (small) small.style.opacity = t > 0.5 ? '1' : '0';
          return;
        }
        /* The large title shrinks toward the small one and fades; the small
           one arrives late so the two are never both fully present. */
        big.style.transform = 'scale(' + (1 - t * 0.28) + ')';
        big.style.opacity = String(1 - Math.min(1, t * 1.6));
        if (small) small.style.opacity = String(Math.max(0, (t - 0.45) / 0.55));
      });
    });
  }

  /* ---------------------------------------------------------------
     Tab bar minimize

     Collapses on the way down, comes back the moment the finger reverses.
     Reversing is the signal, not position: a person scrolling back up wants
     the bar before they reach the top.
     --------------------------------------------------------------- */
  function initTabBar(root) {
    var bar = root.querySelector('.tabbar[data-minimize]');
    if (!bar) return;
    var scroller = root.querySelector(bar.getAttribute('data-minimize'));
    if (!scroller) return;
    if (!once(bar, 'minimize')) return;
    var last = 0, min = false;
    onScrollFrame(scroller, function (y) {
      var down = y > last;
      var delta = Math.abs(y - last);
      last = y;
      if (delta < 4) return;                 /* ignore the jitter of a settling scroll */
      if (down && y > 64 && !min) { min = true; set('true'); }
      else if (!down && min) { min = false; set('false'); }
    });

    /* The accessory shelf is the same piece of bottom chrome as the bar, so
       it leaves and returns with it. A strip left hanging over nothing after
       the bar slides away reads as a bug rather than as a design. */
    function set(v) {
      bar.setAttribute('data-minimized', v);
      var shelf = root.querySelector('.shelf[data-minimize]');
      if (shelf) shelf.setAttribute('data-minimized', v);
    }
  }

  /* ---------------------------------------------------------------
     Scroll edge effect

     A bar that content scrolls under needs a soft edge, or the text runs into
     the bar and both become unreadable. It appears only once something is
     actually behind it.
     --------------------------------------------------------------- */
  function initScrollEdge(root) {
    var els = root.querySelectorAll('[data-scroll-edge]');
    Array.prototype.forEach.call(els, function (el) {
      var scroller = root.querySelector(el.getAttribute('data-scroll-edge'));
      if (!scroller) return;
      if (!once(el, 'edge')) return;
      onScrollFrame(scroller, function (y) {
        el.setAttribute('data-edge', y > 2 ? 'true' : 'false');
      });
    });
  }

  /* ---------------------------------------------------------------
     Sheet detents

     A sheet with more than one height is draggable between them, shows a
     grabber, and throws to the nearest detent carrying the velocity of the
     drag. A sheet with one height does none of this and shows no grabber,
     because a grabber is a promise that the thing moves.
     --------------------------------------------------------------- */
  function initSheets(root) {
    var sheets = root.querySelectorAll('.sheet[data-detents]');
    Array.prototype.forEach.call(sheets, function (sheet) {
      if (sheet.__detents) return;
      sheet.__detents = true;

      var detents = sheet.getAttribute('data-detents').split(/\s+/).map(Number)
        .filter(function (n) { return n > 0 && n <= 1; }).sort(function (a, b) { return a - b; });
      if (detents.length < 2) return;

      var grip = sheet.querySelector('.sheet__grab, .sheet__grip');
      if (grip) grip.setAttribute('data-grabber', 'true');

      var handle = sheet.querySelector('[data-sheet-drag]') || grip || sheet;
      var startY = 0, startH = 0, dragging = false, vy = 0, lastT = 0, lastY = 0;
      var vh = function () { return (root.host ? root.host.clientHeight : global.innerHeight) || 1; };

      /* Open at the smallest detent. The larger ones are what the drag is
         for: a sheet that opens fully has nothing to reveal and covers the
         screen it was asked to sit in front of. */
      var current = detents[0];
      var setH = function (frac) {
        current = frac;
        sheet.style.height = (frac * 100) + '%';
      };
      setH(current);

      handle.addEventListener('pointerdown', function (e) {
        dragging = true;
        startY = e.clientY;
        startH = current * vh();
        lastY = e.clientY;
        lastT = e.timeStamp;
        vy = 0;
        handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
        sheet.style.transition = 'none';
      });

      handle.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dt = e.timeStamp - lastT;
        if (dt > 0) vy = (e.clientY - lastY) / dt * 1000;   /* px per second */
        lastY = e.clientY; lastT = e.timeStamp;
        var h = startH - (e.clientY - startY);
        var frac = Math.min(1, Math.max(detents[0] * 0.5, h / vh()));
        sheet.style.height = (frac * 100) + '%';
        current = frac;
      });

      function release() {
        if (!dragging) return;
        dragging = false;
        sheet.style.transition = '';
        /* Throw to the detent the gesture is heading for, not the nearest one:
           a fast flick past the middle should not land on the middle. */
        var projected = current - (vy / vh()) * 0.18;
        var best = detents[0], bestD = Infinity;
        detents.forEach(function (d) {
          var dist = Math.abs(d - projected);
          if (dist < bestD) { bestD = dist; best = d; }
        });
        if (global.LKSpring && !reduced()) {
          global.LKSpring.to(sheet, 'sheet-h', {
            from: current * 100, to: best * 100, velocity: -(vy / vh()) * 100,
            preset: 'snappy',
            apply: function (v) { sheet.style.height = v + '%'; }
          });
          current = best;
        } else {
          setH(best);
        }
      }
      handle.addEventListener('pointerup', release);
      handle.addEventListener('pointercancel', release);
    });
  }

  function init(root) {
    root = root || doc;
    initLargeTitle(root);
    initTabBar(root);
    initScrollEdge(root);
    initSheets(root);
  }

  global.LKChrome = { init: init };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { init(doc); });
  else init(doc);
})(typeof window !== 'undefined' ? window : this);
