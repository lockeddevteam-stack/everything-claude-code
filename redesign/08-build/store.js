/* LOCKED — the store. What you do is still there tomorrow.

   Every screen in this build held its own state in a variable and rebuilt it
   from the fixture on load. That is what made it a demo rather than an app:
   you could log a meal, tick a set, save a target or answer a check-in, and a
   refresh threw all of it away. The sign-off pass put it plainly — "no Fuel
   figure survives a refresh" — and it is true of every screen.

   So this file is the one place anything is written down, and localStorage is
   the truth once anything has been written to it.

   THE SEED AND THE TRUTH. window.LKFixtures is the seed: it is what a key
   holds before a person has touched it. The moment they do, the stored value
   wins and the fixture is never consulted for that key again. That is what
   makes the demo open populated AND makes a logged meal survive a reload
   without the two fighting.

   ONE KEY PER THING. The keys are the shipped app's own -- lk_history,
   lk_prs, lk_shoppingList, lk_coachLastMsgs -- so a screen reading a key here
   is reading the same key the real app reads.

   EVERY ACCESS IS GUARDED. localStorage throws in private mode and on some
   file:// origins. A screen that cannot write must still work: the failure
   mode is the behaviour this build had before this file, a session that does
   not survive navigation, never a broken screen. `LKStore.writable` says
   which world you are in, so a screen can say so rather than pretending.

   CHANGES TRAVEL. set() notifies this page's listeners and the browser
   notifies other tabs through the storage event, so two screens open on the
   same data cannot drift. */
(function (g) {
  'use strict';

  var PREFIX = 'lk_';
  var listeners = {};
  var any = [];
  var mem = {};          /* the fallback store when localStorage throws */
  var writable = null;   /* decided once, lazily */

  function canWrite() {
    if (writable !== null) return writable;
    try {
      var k = '__lk_probe__';
      g.localStorage.setItem(k, '1');
      g.localStorage.removeItem(k);
      writable = true;
    } catch (e) {
      writable = false;
    }
    return writable;
  }

  function rawGet(key) {
    if (!canWrite()) return mem[key] === undefined ? null : mem[key];
    try { return g.localStorage.getItem(key); } catch (e) { return null; }
  }

  function rawSet(key, str) {
    if (!canWrite()) { mem[key] = str; return true; }
    try { g.localStorage.setItem(key, str); return true; }
    catch (e) {
      /* Out of quota, or a private window that only throws on write. Keep the
         value for this session rather than losing it mid-edit. */
      mem[key] = str;
      return false;
    }
  }

  /* Keys a person has deleted, kept under one key of their own so the
     decision survives a reload. Without it a delete only lasted until the
     next read, which fell back to the seed and put the thing back. */
  var GONE_KEY = 'lk_removedKeys';
  var goneMem = null;
  function goneSet() {
    if (goneMem) return goneMem;
    var raw = null;
    if (canWrite()) { try { raw = g.localStorage.getItem(GONE_KEY); } catch (e) {} }
    else raw = mem[GONE_KEY] === undefined ? null : mem[GONE_KEY];
    var list = [];
    if (raw) { try { list = JSON.parse(raw) || []; } catch (e) { list = []; } }
    goneMem = {};
    list.forEach(function (k) { goneMem[k] = 1; });
    return goneMem;
  }
  function writeGone() {
    var str = JSON.stringify(Object.keys(goneSet()));
    if (canWrite()) { try { g.localStorage.setItem(GONE_KEY, str); return; } catch (e) {} }
    mem[GONE_KEY] = str;
  }
  function isGone(key) { return key !== GONE_KEY && !!goneSet()[key]; }
  function markGone(key) {
    if (key === GONE_KEY) return;
    goneSet()[key] = 1; writeGone();
  }
  function unGone(key) {
    if (key === GONE_KEY || !goneSet()[key]) return;
    delete goneSet()[key]; writeGone();
  }
  function clearGone() {
    goneMem = {};
    if (canWrite()) { try { g.localStorage.removeItem(GONE_KEY); } catch (e) {} }
    delete mem[GONE_KEY];
  }

  /* The stamps, under one key of their own. Kept beside the data rather than
     inside each value, so a key's shape is still exactly what the app stores
     and a screen reading it sees no bookkeeping. */
  var STAMP_KEY = 'lk_changedAt';
  var stampMem = null;
  function stamps() {
    if (stampMem) return stampMem;
    var raw = null;
    if (canWrite()) { try { raw = g.localStorage.getItem(STAMP_KEY); } catch (e) {} }
    else raw = mem[STAMP_KEY] === undefined ? null : mem[STAMP_KEY];
    try { stampMem = raw ? (JSON.parse(raw) || {}) : {}; } catch (e) { stampMem = {}; }
    return stampMem;
  }
  function stamp(key) {
    if (key === STAMP_KEY || key === GONE_KEY) return;
    var all = stamps();
    all[key] = Date.now();
    var str = JSON.stringify(all);
    if (canWrite()) { try { g.localStorage.setItem(STAMP_KEY, str); return; } catch (e) {} }
    mem[STAMP_KEY] = str;
  }

  function fire(key, value) {
    (listeners[key] || []).forEach(function (fn) {
      try { fn(value, key); } catch (e) {}
    });
    any.forEach(function (fn) {
      try { fn(value, key); } catch (e) {}
    });
  }

  /* The fixture's value for a key, or undefined when it has none. The map is
     deliberately explicit: a key that is not here has no seed, and reads back
     the caller's own fallback. */
  /* Every key the seed answers for, so a backup can carry what the app is
     actually showing rather than only what has been written over it. */
  var SEEDED_KEYS = [
    'lk_history', 'lk_prs', 'lk_weightLog', 'lk_bfLog', 'lk_profile', 'lk_splits',
    'lk_goals', 'lk_progressPhotos', 'lk_supplements', 'lk_shoppingList',
    'lk_pantryItems', 'lk_budgetData', 'lk_myStores', 'lk_customEx',
    'lk_featuredLifts', 'lk_nutrition', 'lk_mcProfile', 'lk_mcDays',
    'lk_mcFuelAdjust', 'lk_cardioPrefs', 'lk_cardioFavorites', 'lk_cycles',
    'lk_suppLog', 'lk_feedback', 'lk_coachPlan'
  ];

  function seedFor(key) {
    var F = g.LKFixtures;
    if (!F) return undefined;
    switch (key) {
      case 'lk_history':        return F.history;
      case 'lk_prs':            return F.prs;
      case 'lk_weightLog':      return F.weightLog;
      case 'lk_bfLog':          return F.bfLog;
      case 'lk_profile':        return F.profile;
      case 'lk_splits':         return F.splits;
      case 'lk_goals':          return F.goals;
      case 'lk_progressPhotos': return F.photos;
      case 'lk_supplements':    return F.supplements;
      case 'lk_shoppingList':   return F.shoppingList;
      case 'lk_pantryItems':    return F.pantry;
      case 'lk_budgetData':     return F.budget;
      case 'lk_myStores':       return F.stores;
      case 'lk_customEx':       return F.customEx;
      case 'lk_featuredLifts':  return F.featured;
      case 'lk_nutrition':      return F.nutrition;
      case 'lk_mcProfile':     return F.mcProfile;
      case 'lk_mcDays':        return F.mcDays;
      case 'lk_mcFuelAdjust':  return F.mcFuelAdjust;
      case 'lk_cardioPrefs':   return F.cardioPrefs;
      case 'lk_cardioFavorites': return F.cardioFavorites;
      case 'lk_cycles':        return F.cycles;
      case 'lk_suppLog':       return F.suppLog;
      case 'lk_feedback':      return F.feedback;
      case 'lk_coachPlan':     return F.coachPlan;
      default:                  return undefined;
    }
  }

  var API = {
    prefix: PREFIX,

    get writable() { return canWrite(); },

    /* Stored value, else the fixture's, else `fallback`. Never throws. */
    get: function (key, fallback) {
      var raw = rawGet(key);
      if (raw !== null && raw !== undefined) {
        try { return JSON.parse(raw); }
        catch (e) { return raw; }          /* a plain string key, e.g. lk_theme */
      }
      /* DELETED IS NOT UNTOUCHED. Removing a key left it indistinguishable
         from one nobody had written, so the seed came back: deleting the
         coach plan emptied the pane, and a reload put the twelve-week block
         back in full. A removed key is remembered as removed. */
      if (isGone(key)) return fallback;
      var seed = seedFor(key);
      if (seed !== undefined) return clone(seed);
      return fallback;
    },

    /* TODAY. The build pinned every screen to the seed's own date, so a
       product with no seed read `undefined` and Fuel threw on the first
       paint. Today is the wall clock; the seed's date wins only while a seed
       is loaded, which is what keeps the tests deterministic. */
    today: function () {
      var F = g.LKFixtures;
      if (F && F.today) return F.today;
      var d = new Date();
      return d.getFullYear() + '-' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
        ('0' + d.getDate()).slice(-2);
    },

    /* Has a person actually written this, or is it still the seed? A key they
       deleted counts: they decided what is there, which is nothing. */
    touched: function (key) {
      var raw = rawGet(key);
      return (raw !== null && raw !== undefined) || isGone(key);
    },

    set: function (key, value) {
      var str = typeof value === 'string' ? value : JSON.stringify(value);
      unGone(key);
      var ok = rawSet(key, str);
      stamp(key);
      fire(key, value);
      return ok;
    },

    /* WHEN EACH KEY LAST CHANGED. Nothing recorded this, so two devices with
       the same key could never be merged: a sync can tell that both wrote,
       and not which wrote last. One stamp per key, written on every set and
       remove, is what makes last-write-wins possible at cutover.

       Returns a map of key to epoch milliseconds. */
    changedAt: function (key) {
      var all = stamps();
      return key === undefined ? all : (all[key] || 0);
    },

    /* Everything written since a moment, which is what a sync pushes. */
    changedSince: function (ms) {
      var all = stamps(), out = {};
      Object.keys(all).forEach(function (k) { if (all[k] > ms) out[k] = all[k]; });
      return out;
    },

    /* Merge into an object key. Reads the current value, so the caller does
       not have to. */
    patch: function (key, obj) {
      var cur = API.get(key, {}) || {};
      Object.keys(obj || {}).forEach(function (k) { cur[k] = obj[k]; });
      return API.set(key, cur);
    },

    /* Push onto an array key, newest-first by default. */
    push: function (key, item, atEnd) {
      var arr = API.get(key, []);
      if (!Array.isArray(arr)) arr = [];
      if (atEnd) arr.push(item); else arr.unshift(item);
      API.set(key, arr);
      return arr;
    },

    remove: function (key) {
      if (canWrite()) { try { g.localStorage.removeItem(key); } catch (e) {} }
      delete mem[key];
      markGone(key);
      stamp(key);
      fire(key, undefined);
    },

    /* Back to the seed. Settings' "Erase everything on this phone" is the one
       control that should do this, and it should do exactly this: remove what
       was written, so every screen falls back to the fixture rather than to
       an empty app that cannot demonstrate anything. */
    reset: function () {
      var keys = [];
      if (canWrite()) {
        try {
          for (var i = 0; i < g.localStorage.length; i++) {
            var k = g.localStorage.key(i);
            if (k && k.indexOf(PREFIX) === 0) keys.push(k);
          }
        } catch (e) {}
      }
      Object.keys(mem).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
      keys.forEach(function (k) { API.remove(k); });
      /* Erase everything means back to the seed, which is the one case where
         a removed key must NOT be remembered as removed. */
      clearGone();
      stampMem = {};
      if (canWrite()) { try { g.localStorage.removeItem(STAMP_KEY); } catch (e) {} }
      delete mem[STAMP_KEY];
      return keys.length;
    },

    /* fn(value, key). Called for this page's own writes and for another
       tab's, so two screens on the same data cannot drift. */
    onChange: function (key, fn) {
      if (typeof key === 'function') { any.push(key); return key; }
      if (typeof fn !== 'function') return fn;
      (listeners[key] = listeners[key] || []).push(fn);
      return fn;
    },

    /* Everything under the prefix, for export. */
    /* WHAT THE APP IS SHOWING, not only what has been written over the seed.
       "Export a backup -- one file with every workout, split and record"
       wrote five keys and three kilobytes: a name, a theme and a live
       session. Every key the seed answers for is included, unless the reader
       deleted it, so a restore onto a clean phone brings the app back.

       `writtenOnly` is for the caller that wants the overrides alone. */
    dump: function (writtenOnly) {
      var out = {};
      if (canWrite()) {
        try {
          for (var i = 0; i < g.localStorage.length; i++) {
            var k = g.localStorage.key(i);
            if (k && k.indexOf(PREFIX) === 0) out[k] = g.localStorage.getItem(k);
          }
        } catch (e) {}
      }
      Object.keys(mem).forEach(function (k) { if (out[k] === undefined) out[k] = mem[k]; });
      delete out[GONE_KEY];
      delete out[STAMP_KEY];
      if (writtenOnly) return out;
      SEEDED_KEYS.forEach(function (k) {
        if (out[k] !== undefined || isGone(k)) return;
        var seed = seedFor(k);
        if (seed === undefined) return;
        try { out[k] = JSON.stringify(seed); } catch (e) {}
      });
      return out;
    },

    /* The other half of export. Replaces what is stored with what is given,
       key by key, and reports how many landed. */
    load: function (obj) {
      var n = 0;
      Object.keys(obj || {}).forEach(function (k) {
        if (k.indexOf(PREFIX) !== 0) return;
        rawSet(k, typeof obj[k] === 'string' ? obj[k] : JSON.stringify(obj[k]));
        n++;
      });
      fire('*', null);
      return n;
    }
  };

  function clone(v) {
    if (v === null || typeof v !== 'object') return v;
    try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; }
  }

  if (g.addEventListener) {
    g.addEventListener('storage', function (e) {
      if (!e.key || e.key.indexOf(PREFIX) !== 0) return;
      var v;
      try { v = e.newValue === null ? undefined : JSON.parse(e.newValue); }
      catch (err) { v = e.newValue; }
      fire(e.key, v);
    });
  }

  g.LKStore = API;
})(typeof window !== 'undefined' ? window : this);
