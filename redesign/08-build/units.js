/* LOCKED — one weight unit, for the whole app.

   Settings offers "Weight unit — Kilograms or Pounds", with the subtitle
   "Weights and body weight show as lb". It converted Settings' own rows and
   nothing else: Home, Train, Profile, Progress, Recap, Review, Coach and
   workout-detail all printed kg whatever the setting said, and the choice was
   never written down, so it did not survive a reload either. The workout log
   had a second, independent switch that converted its own screen correctly
   and toasted "Showing lb everywhere" while changing nothing anywhere else.

   So the unit lives here, in lk_profile.useKg, and every screen that prints a
   weight asks this file what to print. There is one switch, one stored
   answer, and one conversion.

   THE MODEL IS ALWAYS KILOGRAMS. Nothing stored is ever converted; conversion
   happens on the way to the screen and never on the way back into the data.
   That is what makes switching units reversible: the history does not change,
   only the reading of it.

   ROUNDING. Pounds to one decimal, because 72.5 kg is 159.8 lb and a whole
   number there loses a plate. Kilograms keep whatever precision they were
   given. A total is summed in kilograms and converted once, EXCEPT where a
   screen shows the rows it is made of -- there the rows are converted first
   and summed as displayed, so a header equals the rows under it.

   localStorage throws in private mode and on some file:// origins. Every
   access is guarded and the failure mode is kilograms, which is the model. */
(function (g) {
  'use strict';

  var KEY = 'lk_profile';
  var LB_PER_KG = 2.20462;
  var listeners = [];

  function profile() {
    var raw;
    try { raw = g.localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function fallback() {
    var fx = g.LKFixtures && g.LKFixtures.profile;
    return fx && fx.useKg !== undefined ? fx.useKg !== false : true;
  }

  var API = {
    key: KEY,
    lbPerKg: LB_PER_KG,

    /* true for kilograms, false for pounds. */
    useKg: function () {
      var p = profile();
      if (p && p.useKg !== undefined) return p.useKg !== false;
      return fallback();
    },

    set: function (useKg) {
      var p = profile() || (g.LKFixtures && g.LKFixtures.profile
        ? JSON.parse(JSON.stringify(g.LKFixtures.profile)) : {});
      p.useKg = !!useKg;
      try { g.localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
      for (var i = 0; i < listeners.length; i++) {
        try { listeners[i](API.useKg()); } catch (e) {}
      }
      return API.useKg();
    },

    onChange: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
      /* Another tab, or another screen in the same demo page. */
      return fn;
    },

    label: function () { return API.useKg() ? 'kg' : 'lb'; },

    /* A number of kilograms, as the number this app would show. */
    v: function (kg) {
      if (kg === null || kg === undefined || isNaN(kg)) return kg;
      if (API.useKg()) return kg;
      return Math.round(kg * LB_PER_KG * 10) / 10;
    },

    /* The same, rounded to whole units -- for totals, where a tenth of a
       pound on a four-thousand-pound figure is noise. */
    vRound: function (kg) {
      var x = API.v(kg);
      return x === null || x === undefined || isNaN(x) ? x : Math.round(x);
    },

    /* "1,234 kg". `d` is decimal places; omit it for "as given". */
    fmt: function (kg, d) {
      var x = API.v(kg);
      if (x === null || x === undefined || isNaN(x)) return '';
      var n = d === undefined ? x : Number(x.toFixed(d));
      return n.toLocaleString('en-GB') + ' ' + API.label();
    },

    /* A total, converted once and rounded to a whole unit. */
    fmtTotal: function (kg) {
      var x = API.vRound(kg);
      if (x === null || x === undefined || isNaN(x)) return '';
      return x.toLocaleString('en-GB') + ' ' + API.label();
    }
  };

  if (g.addEventListener) {
    g.addEventListener('storage', function (e) {
      if (e.key !== KEY) return;
      for (var i = 0; i < listeners.length; i++) {
        try { listeners[i](API.useKg()); } catch (err) {}
      }
    });
  }

  g.LKUnits = API;
})(typeof window !== 'undefined' ? window : this);
