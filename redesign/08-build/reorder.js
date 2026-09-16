/* LKReorder — ONE DRAG, EVERYWHERE SOMETHING CAN BE REORDERED.
   ==========================================================================
   Four surfaces in this app let you change an order: the exercises in a
   live workout, the lifts in a planned quick workout, the exercises and
   days in the split builder, and the saved cardio favourites. They were
   three different implementations and one absence.

   That matters more than it sounds. A gesture is learned once and then
   expected everywhere, so a list that lifts on a hold and a list that
   lifts instantly are two different controls wearing the same clothes --
   and the one that lifts instantly steals every scroll that starts on a
   handle.

   WHAT THE FEEL IS, and every number here is the shipped app's:

   - 350ms hold before anything lifts. Without it a drag down the page
     picks a row up instead of scrolling, which is the single thing that
     makes a list like this unusable on a phone.
   - 10px of movement during that hold hands the gesture back to the
     scroller. A flick down a long list must never pick anything up.
   - The held row lifts: scale 1.03, and it holds still.
   - Everything else wiggles, because a thing that is wiggling is a thing
     you can move and every phone owner already knows that.
   - The gap opens under the row on a spring as the drop target changes,
     so you can see where it will land before you let go.
   - A haptic tick on the lift, one on each swap, one on the drop. One per
     swap, never one per frame.

   WHAT THE HOST OWNS. This module does geometry and gesture; it never
   touches anybody's data. `move` is asked to change the model and say
   whether it did, and the host re-renders however it likes. That is what
   lets one implementation serve a screen that patches its DOM, one that
   replaces it wholesale, and one that keeps its rows in a sheet.
   ========================================================================== */
(function (g) {
  'use strict';

  var HOLD_MS = 350;
  var ESCAPE = 10;

  /* ---------------------------------------------------------------
     THE PHYSICS, in one place, because three surfaces drag the same
     list and they were writing three different inline styles.

     Everything here writes `translate`, `scale` and `rotate` -- the
     individual transform properties -- and never `transform`. That is
     not a style preference. The wiggle is a CSS animation, a CSS
     animation outranks an inline style, and the wiggle animated
     `transform`. So every neighbour's `transform: translateY(...)` was
     silently thrown away: the list shook and nothing moved aside. Split
     across three properties, the wiggle owns `rotate`, the drag owns
     `translate` and `scale`, and they compose.
     --------------------------------------------------------------- */

  /* Rows further from the drop point start later, so the list opens like
     a row of objects being pushed rather than a block sliding. Capped,
     or the far end of a long list is still settling after the drop. */
  function delayFor(distance) {
    return Math.min(Math.abs(distance), 5) * 16;
  }

  /* The row under the finger. No transition: it tracks the hand. */
  function carry(el, dy) {
    if (!el) return;
    el.style.transition = 'none';
    el.style.translate = '0 ' + dy + 'px';
    el.style.scale = '1.04';
  }

  /* A row being pushed out of the way. */
  function shift(el, px, distance) {
    if (!el) return;
    el.style.transition = '';                 /* the class owns the curve */
    el.style.transitionDelay = delayFor(distance) + 'ms';
    el.style.translate = px ? '0 ' + px + 'px' : '';
  }

  /* Back to nothing, on every property this module ever writes. Leaving
     `scale` behind is how a dropped row stayed 4% too big for the rest
     of the session. */
  function clear(el) {
    if (!el) return;
    el.style.transition = '';
    el.style.transitionDelay = '';
    el.style.translate = '';
    el.style.scale = '';
    el.style.transform = '';
    el.style.zIndex = '';
    el.style.opacity = '';
  }

  /* Where each row sits given a drop target, so the two hosts cannot
     disagree about which way a row moves. Returns pixels. */
  function shiftFor(i, from, to, h) {
    if (i === from) return 0;
    if (to <= from && i >= to && i < from) return h;
    if (to > from && i > from && i < to) return -h;
    return 0;
  }

  /* The whole list, laid out for one drop target. */
  function layout(rows, from, to, h) {
    rows.forEach(function (r, i) {
      if (i === from) return;
      shift(r, shiftFor(i, from, to, h), i - to);
    });
  }

  function buzz(p) { try { if (g.navigator && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  function attach(doc, opts) {
    if (!doc || !opts || !opts.grip || !opts.item) return function () {};
    var gripSel = opts.grip, itemSel = opts.item;
    var holdMs = opts.holdMs == null ? HOLD_MS : opts.holdMs;
    var DRAG = null, holdT = null, watch = null;

    function clearHold() {
      if (holdT) { clearTimeout(holdT); holdT = null; }
      if (watch) { doc.removeEventListener('pointermove', watch); watch = null; }
    }

    /* The rows of the list this item belongs to, asked for again after
       every repaint: a screen that rebuilds its DOM hands back different
       elements, and holding the old ones is how a drag ends up moving
       something that is no longer on screen. */
    function rowsFor(item) {
      if (opts.rows) return opts.rows(item) || [];
      var list = item.parentElement;
      if (!list) return [item];
      return Array.prototype.slice.call(list.children).filter(function (n) {
        return n.matches && n.matches(itemSel);
      });
    }

    function measure(rows) {
      return rows.map(function (r) {
        var b = r.getBoundingClientRect();
        return { mid: b.top + b.height / 2, h: b.height };
      });
    }

    function clearStyles(rows) { rows.forEach(clear); }

    function end(commit) {
      if (!DRAG) return;
      var d = DRAG; DRAG = null;
      clearStyles(d.rows);
      if (commit && d.to !== null && d.to !== d.from && opts.move) {
        var to = d.to > d.from ? d.to - 1 : d.to;
        if (to !== d.from) { buzz(12); opts.move(d.from, to, d.item); }
      }
      if (opts.lift) opts.lift(-1, null);
    }

    function onDown(ev) {
      if (DRAG) return;
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      var grip = ev.target.closest ? ev.target.closest(gripSel) : null;
      if (!grip) return;
      var item = grip.closest(itemSel);
      if (!item) return;
      if (opts.enabled && !opts.enabled(item)) return;
      var y0 = ev.clientY;

      watch = function (m) {
        if (Math.abs(m.clientY - y0) > ESCAPE) clearHold();
      };
      doc.addEventListener('pointermove', watch);

      holdT = setTimeout(function () {
        clearHold();
        var from = opts.index ? opts.index(item) : rowsFor(item).indexOf(item);
        if (from < 0) return;
        /* LIFTED FIRST, MEASURED SECOND. The lift class changes heights --
           a list that folds its rows changes them a lot -- and geometry
           read before that puts every drop target where the rows used to
           be. This cost two separate bugs before it was written down. */
        if (opts.lift) opts.lift(from, item);
        var live = opts.refind ? (opts.refind(item, from) || item) : item;
        var rows = rowsFor(live);
        if (!rows.length) { if (opts.lift) opts.lift(-1, null); return; }
        var boxes = measure(rows);
        DRAG = { from: from, to: from, y0: y0, rows: rows, boxes: boxes,
                 h: boxes[from] ? boxes[from].h : 0, item: live };
        if (rows[from]) rows[from].style.zIndex = '20';
        buzz(30);
      }, holdMs);
    }

    function onMove(ev) {
      if (!DRAG) return;
      ev.preventDefault();
      var dy = ev.clientY - DRAG.y0;
      carry(DRAG.rows[DRAG.from], dy);
      var y = (DRAG.boxes[DRAG.from] ? DRAG.boxes[DRAG.from].mid : 0) + dy;
      var to = DRAG.boxes.length;
      for (var i = 0; i < DRAG.boxes.length; i++) {
        if (y < DRAG.boxes[i].mid) { to = i; break; }
      }
      if (to === DRAG.from + 1) to = DRAG.from;
      if (to === DRAG.to) return;
      buzz(10);
      DRAG.to = to;
      layout(DRAG.rows, DRAG.from, to, DRAG.h);
    }

    function onUp() { clearHold(); end(true); }
    function onCancel() { clearHold(); end(false); }

    doc.addEventListener('pointerdown', onDown);
    doc.addEventListener('pointermove', onMove);
    doc.addEventListener('pointerup', onUp);
    doc.addEventListener('pointercancel', onCancel);

    return function detach() {
      clearHold(); end(false);
      doc.removeEventListener('pointerdown', onDown);
      doc.removeEventListener('pointermove', onMove);
      doc.removeEventListener('pointerup', onUp);
      doc.removeEventListener('pointercancel', onCancel);
    };
  }

  g.LKReorder = { attach: attach, HOLD_MS: HOLD_MS, ESCAPE: ESCAPE,
                  carry: carry, shift: shift, clear: clear,
                  layout: layout, shiftFor: shiftFor, delayFor: delayFor };
})(typeof window !== 'undefined' ? window : this);
