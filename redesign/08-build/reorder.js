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
   - The held row lifts to scale 1.03 and holds still.
   - Everything else wiggles, because a thing that is wiggling is a thing
     you can move and every phone owner already knows that.
   - A row being pushed aside travels ONE SLOT, which is its own height
     plus the gap between it and the next one, over 300ms on
     cubic-bezier(0.2,0.7,0.3,1), and it does not overshoot.
   - Near either edge of the scroller the list creeps: 100px of trigger
     zone, 150ms of dwell before it engages, and a speed that ramps from
     2px a frame at the edge of the zone to 14.5px a frame at the very
     edge of the screen.
   - The drop is a spring, not a cut: response 0.35, damping 1, seeded
     with the speed the finger was travelling at, and the lift scale
     bleeds off with the remaining distance so the row shrinks back into
     the list as it lands.
   - A haptic tick on the lift, one on each swap, a lighter one on the
     drop. One per swap, never one per frame.

   THESE NUMBERS WERE MEASURED, NOT REMEMBERED. They come off v6 driven
   in a browser with a real drag and the transforms sampled frame by
   frame, because a constant read out of v6's source is only what v6
   intended and half of them were overridden somewhere else.

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

  /* v6's SPRING.snap, which is what its drop ran on. Response is the time
     the thing would take to cross its target if it were not damped;
     damping 1 means it never overshoots, so a row lands and stays landed
     rather than wobbling into place. Measured off v6: a 63px drop takes
     about 570ms to come to rest, and about 300ms of that is the part you
     can see. */
  var DROP_RESPONSE = 0.35;
  var DROP_DAMPING = 1;
  /* Below these it is at rest and the rAF loop would only be burning
     frames to move a fraction of a pixel. v6's numbers. */
  var DROP_STILL_V = 2;
  var DROP_STILL_D = 0.5;
  /* How much bigger the lifted row is, and the distance over which that
     extra size bleeds off as it lands. */
  var LIFT_SCALE = 0.03;
  var LIFT_FADE_PX = 60;

  /* The edge creep. 100px of zone measured in from each end of the
     scroller; 150ms of sitting in it before anything moves, so brushing
     past the edge on the way somewhere else does not drag the list with
     you; then 2px a frame at the inside boundary rising to 14.5px at the
     very edge. All four are v6's and all four were measured. */
  var EDGE_ZONE = 100;
  var EDGE_DWELL = 150;
  var EDGE_BASE = 2;
  var EDGE_DIV = 8;

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

  /* The row under the finger. No transition: it tracks the hand.
     1.03, not 1.04. v6 lifted by three percent and the extra percent
     reads as the row swelling rather than rising. */
  function carry(el, dy, scale) {
    if (!el) return;
    el.style.transition = 'none';
    el.style.translate = '0 ' + dy + 'px';
    el.style.scale = String(scale == null ? 1 + LIFT_SCALE : scale);
  }

  /* A row being pushed out of the way.

     NO PER-ROW DELAY. This used to stagger the rows by 16ms each so the
     list opened like a row of objects rather than a block. It looks good
     in isolation and it is wrong in the hand: with the delay the row you
     are about to drop onto is still moving when you let go, so the gap
     you aimed at is not where the gap ends up. v6 moved every row at
     once on one curve and that is what the drop lands against. */
  function shift(el, px) {
    if (!el) return;
    el.style.transition = '';                 /* the class owns the curve */
    el.style.transitionDelay = '';
    el.style.translate = px ? '0 ' + px + 'px' : '';
  }

  /* Back to nothing, on every property this module ever writes. Leaving
     `scale` behind is how a dropped row stayed 4% too big for the rest
     of the session.

     `transition: none` goes on FIRST and in the same style pass as the
     reset. The class that opened the gap carries a 300ms curve on
     `translate`, so without this every neighbour spends 300ms sliding
     back to zero AFTER the host has already repainted the list in its
     new order -- you see the list shuffle a second time, the wrong way.
     v6 never had it because it killed the transition and the transform
     in the same two lines. The curve is handed back a frame later so the
     next drag still has it. */
  function clear(el) {
    if (!el) return;
    el.style.transition = 'none';
    el.style.transitionDelay = '';
    el.style.translate = '';
    el.style.scale = '';
    el.style.transform = '';
    el.style.zIndex = '';
    el.style.opacity = '';
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () {
        if (el.style && el.style.transition === 'none') el.style.transition = '';
      });
    }
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
      shift(r, shiftFor(i, from, to, h));
    });
  }

  /* ONE SLOT IS NOT ONE ROW. The distance a neighbour travels to take
     over the gap is the pitch of the list -- row height plus the space
     between rows -- and this shifted by the height alone, so every gap
     opened about eleven pixels short and the rows ended up overlapping
     where the lifted one used to be. v6 measured the real gap between
     the first two rows, clamped it to something sane, and added it.

     Falls back to the dragged row's own height when there is only one
     row to look at, which is the case where nothing can move anyway. */
  function pitch(boxes, from) {
    var fallback = boxes[from] ? boxes[from].h : 0;
    if (!boxes || boxes.length < 2) return fallback;
    var a = boxes[0], b = boxes[1];
    var gap = b.top - (a.top + a.h);
    if (!(gap > 0) || gap >= 40) gap = 12;    /* v6's clamp and default */
    return a.h + gap;
  }

  /* THE DROP IS A SPRING, NOT A CUT.

     This is the whole complaint about the rebuild. v6 let go of the row
     and it flew to its slot and settled; this dropped every inline
     style in one frame and the row teleported. A teleport reads as the
     app losing the object rather than putting it down.

     Seeded with the speed the finger was going, so a row thrown down the
     list carries on for a moment and a row placed carefully does not.
     `to` and `from` are translate values on the row, not page
     coordinates: the row never leaves the flow, so the slot it is headed
     for is just a different translate. */
  function drop(el, from, to, v0, done) {
    if (!el) { if (done) done(); return function () {}; }
    var omega = 2 * Math.PI / DROP_RESPONSE;
    var k = omega * omega, c = 2 * DROP_DAMPING * omega;
    var y = from, v = v0 || 0, last = null, raf = null, dead = false;
    el.style.transition = 'none';
    function step(ts) {
      if (dead) return;
      if (last == null) last = ts;
      /* Capped, or a tab that was in the background for a second
         integrates one enormous step and the row shoots off screen. */
      var dt = Math.min((ts - last) / 1000, 0.064);
      last = ts;
      v += (-k * (y - to) - c * v) * dt;
      y += v * dt;
      if (Math.abs(v) < DROP_STILL_V && Math.abs(y - to) < DROP_STILL_D) {
        dead = true;
        if (done) done();
        return;
      }
      el.style.translate = '0 ' + y + 'px';
      el.style.scale = String(1 + LIFT_SCALE *
        Math.min(1, Math.abs(y - to) / LIFT_FADE_PX));
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return function cancel() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }

  /* The nearest thing above this row that actually scrolls. Asked for
     rather than configured, because three screens host this and each one
     buries its list at a different depth. */
  function scrollerFor(el) {
    var n = el;
    while (n && n.nodeType === 1) {
      if (n.scrollHeight - n.clientHeight > 4) {
        var oy = getComputedStyle(n).overflowY;
        if (oy === 'auto' || oy === 'scroll') return n;
      }
      n = n.parentElement || (n.getRootNode && n.getRootNode().host) || null;
    }
    return null;
  }

  /* THE LIST CREEPS WHEN YOU REACH THE EDGE WITH IT.

     Without this a list longer than the screen can only be reordered
     within one screenful, which on the workout log means you cannot move
     the last exercise to the front at all. `at` reports where the finger
     is now; `tick` is called after each nudge so the host can recompute
     its drop target against the list that just moved. Returns a stop. */
  function edgeScroll(scroller, at, tick) {
    if (!scroller) return function () {};
    var raf = null, engaged = 0, dead = false;
    /* HOW FAR IT IS ALLOWED TO GO, decided once, before anything moves.

       v6 lifted its row out of the flow with position:fixed, so the list
       it was scrolling never changed size. Here the row stays in the
       flow and rides on a transform, and a transform counts towards the
       scrollable area -- so dragging a card 300px down makes the
       scroller 300px taller, which moves the bottom the creep is
       chasing, which lets it creep further, which makes it taller again.
       It runs away and never stops. The honest end of the list is where
       it was when the row was picked up. */
    var limit = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    function loop(ts) {
      if (dead) return;
      var box = scroller.getBoundingClientRect();
      var y = at();
      var dy = 0;
      if (y > box.top && y < box.top + EDGE_ZONE) {
        dy = -((EDGE_ZONE - (y - box.top)) / EDGE_DIV + EDGE_BASE);
      } else if (y > box.bottom - EDGE_ZONE && y < box.bottom) {
        dy = (y - (box.bottom - EDGE_ZONE)) / EDGE_DIV + EDGE_BASE;
      }
      if (dy !== 0) {
        if (!engaged) engaged = ts;
        if (ts - engaged > EDGE_DWELL) {
          var was = scroller.scrollTop;
          scroller.scrollTop = Math.max(0, Math.min(limit, was + Math.round(dy)));
          if (scroller.scrollTop !== was && tick) tick();
        }
      } else engaged = 0;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return function stop() { dead = true; if (raf) cancelAnimationFrame(raf); };
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

    /* LET GO, WATCH IT LAND, THEN CHANGE THE MODEL.

       The order matters. Committing first and animating afterwards means
       the host re-renders under a row that is still flying, and the row
       it was animating is not on the page any more. v6 ran the spring on
       the element that was already there and only touched the data once
       it had stopped, which is also why its drop never flickered. */
    function end(commit) {
      if (!DRAG) return;
      var d = DRAG; DRAG = null;
      if (d.stopEdge) d.stopEdge();
      var el = d.rows[d.from];
      var adj = d.to > d.from ? d.to - 1 : d.to;
      var landed = commit && d.to !== null ? (adj - d.from) * d.h : 0;

      function settle() {
        clearStyles(d.rows);
        if (commit && d.to !== null && d.to !== d.from && opts.move) {
          if (adj !== d.from) { buzz(8); opts.move(d.from, adj, d.item); }
        }
        if (opts.lift) opts.lift(-1, null);
      }

      /* Nothing to fly to, or the row is already there: put it down. */
      if (!el || Math.abs(d.dy - landed) < DROP_STILL_D) { settle(); return; }
      drop(el, d.dy, landed, d.v, settle);
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
        var scroller = opts.scroller ? opts.scroller(live) : scrollerFor(live);
        DRAG = { from: from, to: from, y0: y0, rows: rows, boxes: boxes,
                 h: pitch(boxes, from), item: live, dy: 0, v: 0, t: 0,
                 scroller: scroller, s0: scroller ? scroller.scrollTop : 0,
                 y: y0 };
        if (rows[from]) rows[from].style.zIndex = '20';
        DRAG.stopEdge = edgeScroll(scroller,
          function () { return DRAG ? DRAG.y : 0; },
          function () { if (DRAG) place(DRAG.y, 0); });
        /* ONE BUZZ, 20ms. v6 fired 30 and then 20 back to back from two
           different places, and a second vibrate() cancels the first --
           so what the shipped app's hand actually felt was the 20. */
        buzz(20);
      }, holdMs);
    }

    /* Where the row goes and what it is now over. Called from the move
       and from every nudge of the edge scroll, because a list that slid
       under a finger that did not move is still a different list.

       THE SCROLL OFFSET IS PART OF THE GEOMETRY. The boxes were read once,
       in viewport coordinates, at the moment of the lift. As soon as the
       list can scroll under the drag those numbers are only true relative
       to where the scroller was then, so every comparison carries the
       difference. Without it the row creeps to the bottom of a long list
       and drops itself four places above where it is sitting. */
    function place(clientY, dt) {
      if (!DRAG) return;
      var ds = DRAG.scroller ? DRAG.scroller.scrollTop - DRAG.s0 : 0;
      var dy = clientY - DRAG.y0 + ds;
      DRAG.dy = dy;
      DRAG.y = clientY;
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

    function onMove(ev) {
      if (!DRAG) return;
      ev.preventDefault();
      /* The speed the drop spring is seeded with. Smoothed the way v6
         smoothed it -- three parts of this sample to one of the running
         value -- because a raw frame-to-frame delta on a finger that has
         paused is noise, and noise here throws the row. */
      var now = ev.timeStamp || Date.now();
      var dy = ev.clientY - DRAG.y0 +
        (DRAG.scroller ? DRAG.scroller.scrollTop - DRAG.s0 : 0);
      if (DRAG.t) {
        var dtm = Math.max(now - DRAG.t, 1);
        DRAG.v = 0.75 * ((dy - DRAG.dy) / dtm * 1000) + 0.25 * DRAG.v;
      }
      DRAG.t = now;
      place(ev.clientY);
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
                  layout: layout, shiftFor: shiftFor, pitch: pitch,
                  drop: drop, edgeScroll: edgeScroll,
                  scrollerFor: scrollerFor,
                  DROP_RESPONSE: DROP_RESPONSE, DROP_DAMPING: DROP_DAMPING,
                  LIFT_SCALE: LIFT_SCALE, EDGE_ZONE: EDGE_ZONE };
})(typeof window !== 'undefined' ? window : this);
