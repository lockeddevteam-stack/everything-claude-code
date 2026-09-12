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
      var seed = seedFor(key);
      if (seed !== undefined) return clone(seed);
      return fallback;
    },

    /* Has a person actually written this, or is it still the seed? */
    touched: function (key) {
      return rawGet(key) !== null && rawGet(key) !== undefined;
    },

    set: function (key, value) {
      var str = typeof value === 'string' ? value : JSON.stringify(value);
      var ok = rawSet(key, str);
      fire(key, value);
      return ok;
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
    dump: function () {
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
