/* LOCKED — the live session record.

   A workout is the one thing in this app that spans screens. You start it
   on Train, and then you look up a substitution in the library, check what
   you ate, answer the coach. Every one of those is a tab away, and until
   this file existed the session was held in the workout log's own memory:
   leaving the screen lost the sets, the timer and the session itself, with
   nothing anywhere saying a workout was ever running.

   So the record lives here instead, in localStorage, and the workout log
   becomes one reader of it rather than its owner. Every other screen mounts
   a shelf from it -- the strip above the tab bar that names the session and
   gets back in one tap.

   THE RECORD, under lk_liveSession:
     name        what the session is called, e.g. "PPL - Push"
     startedAt   epoch ms. The timer is derived from this, never stored as
                 a count, so it stays right across a reload or a phone that
                 slept for twenty minutes.
     done        sets logged
     total       sets in the session. Sets rather than exercises because
                 that is what the workout log's own header counts, and one
                 workout described in two units in two places is how a
                 person loses track of which one they are reading
     updatedAt   epoch ms of the last change, which is what tells a session
                 you are training from one you walked away from

   ELAPSED IS DERIVED, NEVER STORED. A stored count drifts the moment
   anything stops running it, and a workout timer that lies is worse than
   no timer.

   STALE SESSIONS. A record with no update for STALE_AFTER is not a live
   workout, it is one you left. The shelf says so rather than counting up
   to fourteen hours and pretending. It is never deleted on its own: those
   sets were real work, and only a person decides they are not worth
   keeping.

   localStorage throws in private mode and on some file:// origins. Every
   access is guarded, and the failure mode is a session that does not
   survive navigation -- the behaviour before this file -- never a broken
   screen. */
(function () {
  'use strict';

  var KEY = 'lk_liveSession';
  var STALE_AFTER = 3 * 60 * 60 * 1000;   /* three hours */

  function read() {
    var raw;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    var r;
    try { r = JSON.parse(raw); } catch (e) { return null; }
    if (!r || typeof r !== 'object' || !r.startedAt) return null;
    return r;
  }

  function write(r) {
    try { window.localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) {}
    fire();
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* 21:01 under an hour, 1:04:09 over it. Minutes stay unpadded in the
     short form because a leading zero on the first minute of a workout
     reads like a stopwatch that has not started. */
  function clock(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60), h = Math.floor(m / 60);
    return (h ? h + ':' + pad(m % 60) : String(m)) + ':' + pad(s % 60);
  }

  /* "3 hours ago", for a session you walked away from. Coarse on purpose:
     the exact minute stopped mattering the moment it stopped being live. */
  function ago(ms) {
    var m = Math.round(ms / 60000);
    if (m < 60) return m + (m === 1 ? ' minute' : ' minutes') + ' ago';
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour' : ' hours') + ' ago';
    var d = Math.round(h / 24);
    return d + (d === 1 ? ' day' : ' days') + ' ago';
  }

  var listeners = [];
  function fire() {
    var r = API.get();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](r); } catch (e) {}
    }
  }

  var API = {
    key: KEY,
    staleAfter: STALE_AFTER,

    /* The record, with everything derived from it already worked out, or
       null when no workout is running. */
    get: function () {
      var r = read();
      if (!r) return null;
      var now = Date.now();
      var idle = now - (r.updatedAt || r.startedAt);
      return {
        name: r.name || 'Workout',
        startedAt: r.startedAt,
        updatedAt: r.updatedAt || r.startedAt,
        done: r.done || 0,
        total: r.total || 0,
        elapsed: now - r.startedAt,
        elapsedText: clock(now - r.startedAt),
        stale: idle > STALE_AFTER,
        idleText: ago(idle)
      };
    },

    start: function (o) {
      o = o || {};
      write({
        name: o.name || 'Workout',
        startedAt: o.startedAt || Date.now(),
        done: o.done || 0,
        total: o.total || 0,
        updatedAt: Date.now()
      });
      return API.get();
    },

    /* Called on every logged set. Starts the record if the workout log was
       opened straight into a session, so a session can never be running on
       screen without being running in the record. */
    update: function (o) {
      var r = read();
      if (!r) return API.start(o);
      o = o || {};
      if (o.name !== undefined) r.name = o.name;
      if (o.done !== undefined) r.done = o.done;
      if (o.total !== undefined) r.total = o.total;
      r.updatedAt = Date.now();
      write(r);
      return API.get();
    },

    /* Finished or discarded. Both end the session; what was kept is the
       workout log's business, not this record's. */
    end: function () {
      try { window.localStorage.removeItem(KEY); } catch (e) {}
      fire();
      return null;
    },

    onChange: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
      return fn;
    },

    /* The shelf, as markup. Screens hand this to their own patcher rather
       than having it written into them, so the strip is one object with one
       definition and cannot drift from screen to screen. */
    html: function () {
      var r = API.get();
      if (!r) return '';
      var nm = String(r.name).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      var count = r.total ? r.done + ' of ' + r.total + ' sets' : (r.done ? r.done + ' sets' : null);
      var inner =
        '<span class="shelf__main">' +
          '<span class="shelf__title">' + nm + '</span>' +
          '<span class="shelf__sub">' + (r.stale ? 'Left ' + r.idleText
            : (count ? count + ' · ' + r.elapsedText : r.elapsedText)) + '</span>' +
        '</span>';

      /* A session you walked away from gets TWO controls, not one.
         It used to be a single button whose word said Finish and whose tap
         went back into the log, where the first paint stamped updatedAt and
         the five-hour-old session flipped back to live. The word did the
         opposite of what it said. Now the strip carries the tap-back and a
         real Finish that ends the record. */
      if (r.stale) {
        return '<div class="shelf" data-minimize data-stale="true" data-testid="shelf-stale">' +
          '<button class="shelf__grab" type="button" data-action="resume" data-testid="shelf-resume" ' +
            'aria-label="' + ('Return to ' + r.name + ', left ' + r.idleText).replace(/"/g, '&quot;') + '">' +
            inner +
          '</button>' +
          '<button class="shelf__action t-body-em" type="button" data-action="shelf-finish" ' +
            'data-testid="shelf-finish" aria-label="' +
            ('Finish ' + r.name + ', left ' + r.idleText).replace(/"/g, '&quot;') + '">Finish</button>' +
        '</div>';
      }

      /* Sets, not exercises. The visible sub-line and the log's own header
         both count sets; saying "3 of 14 exercises" to a screen reader
         described a five-exercise workout in the wrong unit. */
      var label = 'Return to ' + r.name +
        (count ? ', ' + r.done + ' of ' + r.total + ' sets done' : '') +
        ', ' + r.elapsedText + ' elapsed';
      return '<button class="shelf" type="button" data-minimize data-action="resume" ' +
          'data-testid="shelf-resume" aria-label="' + label.replace(/"/g, '&quot;') + '">' +
        '<span class="shelf__live" aria-hidden="true"></span>' + inner +
        '<span class="shelf__action t-body-em" aria-hidden="true">Resume</span>' +
      '</button>';
    },

    /* Mount the shelf into a slot and keep it current. The timer ticks on
       its own, because a strip that says 38:12 for the whole time you are
       reading the library is a screenshot, not a session. */
    mount: function (slot, patch) {
      if (!slot) return;
      var put = patch || function (el, html) { el.innerHTML = html; };
      var lastKey = null;
      function paint() {
        var r = API.get();
        var k = r ? r.name + '|' + r.done + '|' + r.total + '|' + r.elapsedText + '|' + r.stale + '|' + r.idleText : '';
        if (k === lastKey) return;      /* nothing changed this second */
        lastKey = k;
        put(slot, API.html());
      }
      paint();
      /* Finish is handled here rather than in fifteen screens, so no screen
         can mount the shelf and quietly leave its Finish inert. */
      if (!API._finishWired) {
        API._finishWired = true;
        document.addEventListener('click', function (e) {
          var b = e.target && e.target.closest ? e.target.closest('[data-testid="shelf-finish"]') : null;
          if (!b) return;
          e.preventDefault();
          e.stopPropagation();
          API.end();
        }, true);
      }
      var timer = window.setInterval(paint, 1000);
      API.onChange(paint);
      window.addEventListener('storage', function (e) {
        if (e.key === KEY) { lastKey = null; paint(); }
      });
      /* A hidden tab does not need a running clock. */
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) { lastKey = null; paint(); }
      });
      return { stop: function () { window.clearInterval(timer); } };
    }
  };

  window.LKSession = API;
})();
