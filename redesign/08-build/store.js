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

   THERE IS NO ROOT COMPONENT, AND THAT IS THE DESIGN. v6 held global state
   in an App root and pushed it down; here every screen reads and writes this
   store directly and re-reads on lk:enter. So there is no global state to
   hold and nothing to keep in step: a root would be a second place that
   knows what a screen shows, which is the failure this build keeps finding
   under other names -- a hand-typed PB table, a private seed copy, a cached
   sentence. One key, one reader, no intermediary. (F-ROOT-001, cut.)

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

  /* A write that could not reach the disk. Kept for this session so nothing
     is lost mid-edit, and announced -- silently degrading to memory means a
     person logs a week of training and loses it on reload with no warning
     they were ever at risk. */
  var overflowed = false;
  function rawSet(key, str) {
    if (!canWrite()) { mem[key] = str; return true; }
    try { g.localStorage.setItem(key, str); return true; }
    catch (e) {
      mem[key] = str;
      if (!overflowed) {
        overflowed = true;
        fire('lk:storage-full', { key: key });
      }
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
      case 'lk_coachMemory':   return F.coachMemory;
      case 'lk_coachInstructions': return F.coachInstructions;
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
        var parsed;
        try { parsed = JSON.parse(raw); }
        catch (e) { return raw; }          /* a plain string key, e.g. lk_theme */
        /* THE SHAPE IS PART OF THE CONTRACT. A key that every reader
           iterates has to come back iterable. lk_history arriving as a
           string -- a bad sync, a hand-edited backup, an older build --
           took Train, Progress and Recap down together with
           "raw.forEach is not a function", and each one stayed down for
           the life of that storage because Try again re-threw. One guard
           here covers every reader, including the ones not written yet.
           A wrong shape is treated as nothing written: the caller's own
           fallback, which every caller already has. */
        if (LIST_KEYS[key] && !Array.isArray(parsed)) return fallback;
        if (MAP_KEYS[key] && (parsed === null || typeof parsed !== 'object' ||
                              Array.isArray(parsed))) return fallback;
        return parsed;
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

    /* Everything written since a moment, which is what a sync pushes.

       The comparison is inclusive on purpose. Stamps and the last-sync
       mark are both Date.now(), so a key written in the same millisecond
       a sync finished would test as older than the sync and never go up
       again -- not this time, but never. Being inclusive resends at most
       the keys written in one millisecond, and the server compares
       changed_at anyway, so a resend costs nothing and a miss costs
       somebody their data. */
    changedSince: function (ms) {
      var all = stamps(), out = {};
      Object.keys(all).forEach(function (k) { if (all[k] >= ms) out[k] = all[k]; });
      return out;
    },

    /* Deliberately deleted here, as opposed to never written. A sync has
       to be able to tell those apart: the first must be sent so the
       deletion reaches the other device, and the second must not. */
    removed: function (key) { return isGone(key); },

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
    /* HOW MUCH ROOM IS LEFT. A phone that cannot write is the one failure
       that loses work silently, so the number is readable rather than
       guessed at. localStorage has no quota API; the practical ceiling is
       about 5 MB per origin and what matters is the share used, not the
       exact cap. */
    usage: function () {
      var bytes = 0, keys = 0;
      if (canWrite()) {
        try {
          for (var i = 0; i < g.localStorage.length; i++) {
            var k = g.localStorage.key(i);
            if (!k || k.indexOf(PREFIX) !== 0) continue;
            keys++;
            bytes += k.length + (g.localStorage.getItem(k) || '').length;
          }
        } catch (e) {}
      }
      Object.keys(mem).forEach(function (k) { keys++; bytes += k.length + mem[k].length; });
      var cap = 5 * 1024 * 1024;
      return { bytes: bytes * 2, keys: keys, cap: cap,
               pct: Math.min(100, Math.round((bytes * 2) / cap * 100)),
               full: overflowed, writable: canWrite() };
    },

    /* THE KEYS A SYNC CARRIES. Everything a person made, and nothing about
       this device: a theme, a dev state or a live session belong to the phone
       they were set on and must not follow somebody to another one. */
    syncKeys: function () { return SYNC_KEYS.slice(); },

    /* SCHEMA MIGRATIONS. A product gets upgraded under people who already
       have data, and a shape that changes without a migration reads as an
       empty screen to exactly the users who have the most to lose. Each
       migration runs once, in order, and the version it reached is stored.

       Add to MIGRATIONS; never renumber or rewrite one that has shipped. */
    migrate: function () {
      var at = Number(API.get(SCHEMA_KEY, 0)) || 0;
      var r = runFrom(at);
      if (r.mark !== at) API.set(SCHEMA_KEY, r.mark);
      return { from: at, to: r.mark, ran: r.ran };
    },
    schemaVersion: function () { return Number(API.get(SCHEMA_KEY, 0)) || 0; },

    /* EVERY MIGRATION, AGAIN, WHATEVER THE VERSION SAYS.

       migrate() runs once at boot and records how far it got, which is
       right for data already on the phone and exactly wrong for data that
       arrives afterwards. A sync pulls rows written by the shipped app --
       lk_prs as a map keyed by exercise id, a session whose volume is the
       string "14363 kg", a split holding exercise ids instead of
       exercises -- and they land AFTER the version marker says there is
       nothing left to do. So the one case these migrations exist for, an
       upgrading reader with real history, is the one case they missed.

       This is safe to call as often as it is useful: every migration is
       written to be a no-op against data it has already converted, which
       is a property they needed anyway because a half-finished boot runs
       them twice. */
    /* The corrective passes, by number: 5 names records and split days,
       8 flattens a fuel day's buckets, 10 turns a saved memory string
       into the row Coach reads. Each returns quietly when there is
       nothing to do. */
    repair: function () {
      var ran = [];
      [4, 7, 9].forEach(function (i) {
        try { if (MIGRATIONS[i] && MIGRATIONS[i](API) === true) ran.push(i + 1); }
        catch (e) {}
      });
      return ran;
    },

    remigrate: function () {
      var r = runFrom(0);
      API.set(SCHEMA_KEY, r.mark);
      return r.ran;
    },

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

  /* ------------------------------------------------------------------
     The sync set, and the migrations.
     ------------------------------------------------------------------ */
  var SCHEMA_KEY = 'lk_schema';

  /* A MIGRATION THAT COULD NOT RUN IS NOT A MIGRATION THAT RAN.

     Returning DEFER says "the thing I need is not here yet". The marker is
     parked at the first migration that said so, and everything after it
     still runs -- they are independent, and every one of them is a no-op
     against data it has already converted, so running them again next boot
     costs nothing and finishing them now is free.

     This exists because migration 5 needs the exercise catalogue, and
     exercises.js is loaded AFTER store.js on the three screens that carry
     it and not at all on the other fifteen. It returned false, the old
     marker advanced regardless, and the migration was recorded as done
     having resolved nothing -- so an upgrading reader's records and split
     days stayed nameless on every screen, permanently. */
  var DEFER = 'defer';
  function runFrom(at) {
    var ran = [], stop = -1;
    for (var i = at; i < MIGRATIONS.length; i++) {
      var r;
      try { r = MIGRATIONS[i](API); }
      catch (e) { r = false; }      /* a bad row must not brick the boot */
      if (r === DEFER) { if (stop < 0) stop = i; continue; }
      if (r) ran.push(i + 1);
    }
    return { ran: ran, mark: stop < 0 ? MIGRATIONS.length : stop };
  }
  /* Keys whose readers iterate them, and keys whose readers index them.
     Anything not listed is read as-is; this is a guard against a shape
     that cannot work, not a schema. */
  function asSet(list) {
    var o = {};
    for (var i = 0; i < list.length; i++) o[list[i]] = true;
    return o;
  }
  /* NOT lk_prs. It legitimately arrives as a map from the shipped app and
     migration 1 converts it to the flat array everything reads -- guarding
     it here hid the map from the migration that exists to fix it, and the
     records were dropped instead of converted. A key a migration converts
     is a key whose "wrong" shape is real data. */
  var LIST_KEYS = asSet([
    'lk_history', 'lk_splits', 'lk_weightLog', 'lk_bfLog',
    'lk_goals', 'lk_photos', 'lk_supplements', 'lk_recipes',
    'lk_shoppingList', 'lk_pantryItems', 'lk_feedback',
    'lk_myFoods', 'lk_tdeeHistory', 'lk_removedKeys'
  ]);
  /* Same rule: lk_fuelLog, lk_profile, lk_customEx and lk_coachMemory are
     all read by a migration in a shape this build does not otherwise
     accept, so none of them is guarded. */
  var MAP_KEYS = asSet([
    'lk_exNotes', 'lk_exEquip', 'lk_changedAt',
    'lk_fuelTargets', 'lk_suppLog', 'lk_notifPrefs'
  ]);

  var SYNC_KEYS = [
    'lk_profile', 'lk_history', 'lk_prs', 'lk_splits', 'lk_customEx', 'lk_exNotes',
    'lk_exEquip', 'lk_featuredLifts', 'lk_weightLog', 'lk_bfLog', 'lk_goals',
    'lk_progressPhotos', 'lk_fuelLog', 'lk_fuelTargets', 'lk_fuelProfile',
    'lk_recipes', 'lk_supplements', 'lk_suppLog', 'lk_shoppingList',
    'lk_pantryItems', 'lk_myStores', 'lk_budgetData', 'lk_cycles', 'lk_feedback',
    'lk_coachPlan', 'lk_coachInstructions', 'lk_coachMemory', 'lk_coachLastMsgs',
    'lk_mcProfile', 'lk_mcDays', 'lk_mcFuelAdjust', 'lk_cardioPrefs',
    'lk_cardioFavorites', 'lk_cardioCustom', 'lk_onboarded', 'lk_removedKeys',

    /* Work somebody did that is not a workout. A custom food typed in by
       hand, a recipe the coach wrote, a saved meal plan: all of it is as
       much theirs as a logged set, and all of it was staying on one phone.
       Signing in on a new device and finding the food list empty is the
       same loss as finding the history empty. */
    'lk_myFoods', 'lk_coachRecipes', 'lk_fuelPlan', 'lk_fuelPlans',
    'lk_fuelFavourites', 'lk_tdeeHistory', 'lk_badges', 'lk_nutrition',

    /* The coach's setup. The interview is the longest thing anybody does
       in this app, and it was being asked again on every new device. */
    'lk_coachInterview', 'lk_coachName', 'lk_coachStyle', 'lk_coachDataPrefs',
    'lk_coachMemoryOn', 'lk_coachOpenersOff', 'lk_checkinPerDay',

    /* Whether a feature is on at all. lk_cycle and lk_perfTracking turn on
       compound tracking, which somebody switched on deliberately and does
       not want to go hunting for twice. */
    'lk_cycle', 'lk_perfTracking', 'lk_fuelAdaptive', 'lk_fuelRefeed',
    'lk_fuelRefeedNo', 'lk_fuelNumbers', 'lk_hidePartials', 'lk_homeLayout',
    /* lk_gamingLayer is the shipped app's name for the same switch this
       build calls lk_badges. It syncs so that migration 6 has something to
       read; without it the switch arrives off for anybody who turned it on. */
    'lk_gamingLayer',

    /* Preferences. Every one of these is a choice somebody made on purpose,
       and a preference that resets is read as the app forgetting them. */
    'lk_theme', 'lk_notifOn', 'lk_notifPrefs', 'lk_notifTimes',
    'lk_reminderOn', 'lk_reminderAt', 'lk_restEnabled', 'lk_restSec',
    'lk_restSound', 'lk_startDay', 'lk_weekStart', 'lk_plateKg',

    /* The walkthrough teaches the app, not the device. Somebody who took
       it on their phone should not be shown it again on their tablet, and
       a module left halfway should resume rather than restart. */
    'lk_tutorialSeen', 'lk_tutorialTrack', 'lk_tutorialSteps'
  ];

  /* WHAT IS DELIBERATELY NOT IN THAT LIST, so the next person to add a key
     has the rule rather than the list: anything true of a device and not of
     a person. A half-finished workout (lk_liveSession), what screen was open
     (lk_openLift, lk_openSplit, lk_openWorkout), a tip already dismissed
     (lk_holdTipSeen, lk_throwbackDismissed), a migration
     marker, and lk_session itself, which is the credential and would be a
     hole rather than a feature. Syncing a live session would resume a
     workout on a phone nobody is holding. */

  /* Each entry returns true when it changed something. Order is the version.
     A migration must be safe to run against data it has already migrated,
     because a half-finished boot will run it twice. */
  var MIGRATIONS = [
    /* 1 — lk_prs held two shapes: a map of exercise id to rows, and the flat
       array everything reads now. A phone that stored the map form reads as
       fewer records than it set. */
    function (ST) {
      if (!ST.touched('lk_prs')) return false;
      var raw = ST.get('lk_prs', null);
      if (!raw || Array.isArray(raw) || typeof raw !== 'object') return false;
      var rows = [];
      Object.keys(raw).forEach(function (id) {
        (raw[id] || []).forEach(function (r) {
          rows.push({ exId: Number(id), name: r.name || '', group: r.group || '',
                      muscle: r.muscle || '', kg: r.w, reps: r.r, date: r.date });
        });
      });
      rows.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      ST.set('lk_prs', rows);
      return true;
    },
    /* 2 — weights were stored in whatever unit was on screen before the
       single LKUnits switch. lk_weightsKgMigrated marks a phone that has
       already been through it; without the marker a pounds figure would be
       read as kilograms. */
    function (ST) {
      if (ST.get('lk_weightsKgMigrated', false)) return false;
      ST.set('lk_weightsKgMigrated', true);
      return true;
    },

    /* 3 — THE SHAPE A REAL PHONE ACTUALLY HOLDS.

       tests/fixtures/seed-data.json is a copy of a device, and it does not
       match what the screens read. A lifting row carries `vol: "14363 kg"`
       and `dur: "52 min"` as STRINGS WITH THEIR UNITS IN THEM, a US
       `date: "9/7/2026"` beside an ISO `dateISO`, and its sets as
       `{ w:"87.5", r:"8", setType:"warmup" }` — strings, and a set type
       rather than a boolean. The build reads `kg`, `min`, an ISO `date`,
       and `{ kg, reps, warm }`.

       The generator normalises all of it on the way into fixtures.js, so
       the demo never sees the difference. A person upgrading does: their
       own stored history is read raw, and Train, Progress, Recap and the
       log render it empty or as "undefined NaN". It is the same defect as
       the cardio v1 migration and it costs more, because it is every
       session they have ever logged.

       Idempotent: a row already carrying a numeric `kg` is left alone. */
    function (ST) {
      if (!ST.touched('lk_history')) return false;
      var rows = ST.get('lk_history', null);
      if (!Array.isArray(rows) || !rows.length) return false;
      var n2 = function (v) {
        if (typeof v === 'number') return v;
        if (v === '' || v == null) return null;
        var x = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
        return isFinite(x) ? x : null;
      };
      var iso = function (w) {
        if (w.dateISO) return String(w.dateISO).slice(0, 10);
        var d = String(w.date || '');
        if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
        var a2 = d.split('/');            /* M/D/YYYY, the stored form */
        if (a2.length === 3) {
          return a2[2] + '-' + ('0' + a2[0]).slice(-2) + '-' + ('0' + a2[1]).slice(-2);
        }
        return d;
      };
      var touched = false;
      var out = rows.map(function (w) {
        if (!w || typeof w !== 'object') return w;
        var already = typeof w.kg === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(String(w.date || ''));
        if (already) return w;
        touched = true;
        var r = {};
        Object.keys(w).forEach(function (k) { r[k] = w[k]; });
        r.date = iso(w);
        r.min = n2(w.min !== undefined ? w.min : w.dur);
        if (w.kind === 'cardio') return r;
        r.kind = w.kind || 'lift';
        r.sets = n2(w.sets);
        r.kg = n2(w.kg !== undefined ? w.kg : w.vol);
        r.exercises = (w.exercises || []).map(function (ex) {
          return {
            id: ex.id, name: ex.name, muscle: ex.muscle || '',
            sets: (ex.sets || []).map(function (st) {
              /* A set already in the read shape keeps it. */
              if (typeof st.kg === 'number' || st.warm !== undefined) return st;
              /* w and r are kept beside kg and reps rather than replaced.
                 Nothing here reads them, and they cost two fields; what
                 they buy is that the shipped app can still read a session
                 after this device has converted it and synced it back.
                 That matters while both builds are live: a reader who
                 opens this one and then opens the old one on another
                 phone would otherwise find every set blank there. It does
                 not make the two interchangeable -- see 15-server/
                 README.md, which says what does not survive -- it just
                 stops this migration being the thing that broke it. */
              return {
                kg: n2(st.w), reps: n2(st.r), rir: n2(st.rir),
                w: st.w, r: st.r,
                warm: st.setType === 'warmup',
                done: !!st.done,
                partials: n2(st.partials) || 0
              };
            })
          };
        });
        return r;
      });
      if (!touched) return false;
      ST.set('lk_history', out);
      return true;
    },

    /* 4 — a stored split day carries `exIds: [111, 302, ...]` and the
       screens read `exercises: [{id, name, group, muscle}]`. Read raw, a
       real user's every day counts as empty: no lifts on Train, nothing to
       start, nothing to edit.

       The names cannot be resolved without the catalogue, which is fetched
       and may not be here yet. The ids are what matter — every screen
       resolves a name from one — so the day is filled with the ids it
       holds and whatever names the fixture can supply, and a name that
       cannot be found yet is left for the catalogue to fill in. */
    function (ST) {
      if (!ST.touched('lk_splits')) return false;
      var all = ST.get('lk_splits', null);
      if (!Array.isArray(all) || !all.length) return false;
      var F = g.LKFixtures;
      var known = {};
      ((F && F.splits) || []).forEach(function (sp) {
        (sp.days || []).forEach(function (d) {
          (d.exercises || []).forEach(function (e) { known[e.id] = e; });
        });
      });
      ((F && F.prs) || []).forEach(function (r) {
        if (!known[r.exId]) known[r.exId] = { id: r.exId, name: r.name, group: r.group, muscle: r.muscle };
      });
      var touched = false;
      all.forEach(function (sp) {
        (sp.days || []).forEach(function (d) {
          if (!d || !Array.isArray(d.exIds)) return;
          if (Array.isArray(d.exercises) && d.exercises.length) return;
          touched = true;
          d.exercises = d.exIds.map(function (id) {
            var k = known[id];
            return { id: id, name: k ? k.name : '', group: k ? (k.group || '') : '',
                     muscle: k ? (k.muscle || '') : '' };
          });
          d.blocks = d.blocks || [];
        });
      });
      if (!touched) return false;
      ST.set('lk_splits', all);
      return true;
    },

    /* 5 — THE NAMES, NOW THAT THE CATALOGUE SHIPS.

       Migrations 1 and 4 do the structural work and both leave a hole
       they could not fill at the time: a record becomes { exId: 104,
       name: '' } and a split day becomes a list of ids with blank names,
       because the only catalogue either had was whatever the fixture
       happened to carry. The reader who upgrades then finds their records
       and their split days nameless -- the data is all there and none of
       it is legible.

       exercises.js ships all 866 rows now, so the names can be resolved.
       This is additive on purpose rather than a rewrite of 1 or 4: a
       phone that already ran those has the nameless rows on it, and only
       a new migration reaches them.

       Idempotent: a row that already has a name is left alone. With no
       catalogue loaded it returns DEFER, which parks the version marker
       here so the next boot tries again -- it used to return false, and
       the marker moved on regardless, recording as done a migration that
       had resolved nothing. */
    function (ST) {
      var cat = g.LKExercises && g.LKExercises.all && g.LKExercises.all();
      if (!cat || !cat.length) return DEFER;   /* no catalogue yet: try again */
      var byId = {};
      cat.forEach(function (e) { byId[e.id] = e; });

      /* THE LIFTS SOMEBODY INVENTED ARE STILL THEIR LIFTS. A custom
         exercise lives in lk_customEx under an id of its own -- 96029,
         96914, nothing near the catalogue's range -- so naming from the
         catalogue alone left every record on a custom lift blank. On a
         real account that was four of the top six personal records
         showing a weight and no name at all.

         Read second, so the catalogue wins a collision. */
      var mine = ST.get('lk_customEx', null);
      if (Array.isArray(mine)) {
        mine.forEach(function (e) {
          if (!e || e.id == null || byId[e.id]) return;
          byId[e.id] = { id: e.id, name: e.name || '', group: e.group || '',
                         muscle: e.muscle || '' };
        });
      }

      function isoDate(d) {
        var t = String(d || '');
        if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
        var a = t.split('/');
        if (a.length === 3) return a[2] + '-' + ('0' + a[0]).slice(-2) + '-' + ('0' + a[1]).slice(-2);
        return t;
      }

      var did = false;

      var prs = ST.get('lk_prs', null);
      if (Array.isArray(prs)) {
        prs.forEach(function (r) {
          if (!r) return;
          var hit = byId[r.exId];
          if (hit && !r.name) {
            r.name = hit.name; r.group = r.group || hit.group; r.muscle = r.muscle || hit.muscle;
            did = true;
          }
          /* The date came across in the shipped app's US order, which sorts
             wrongly as a string -- and these are sorted by date. */
          var iso = isoDate(r.date);
          if (iso !== r.date) { r.date = iso; did = true; }
        });
        if (did) {
          prs.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
          ST.set('lk_prs', prs);
        }
      }

      var splits = ST.get('lk_splits', null);
      if (Array.isArray(splits)) {
        var moved = false;
        splits.forEach(function (sp) {
          (sp && sp.days || []).forEach(function (d) {
            (d && d.exercises || []).forEach(function (e) {
              if (!e || e.name) return;
              var hit = byId[e.id];
              if (!hit) return;
              e.name = hit.name;
              e.group = e.group || hit.group;
              e.muscle = e.muscle || hit.muscle;
              moved = true;
            });
          });
        });
        if (moved) { ST.set('lk_splits', splits); did = true; }
      }

      return did;
    },

    /* 6 — THE STREAKS SWITCH, UNDER THE NAME IT WAS SAVED AS.

       The shipped app writes lk_gamingLayer; every screen here reads
       lk_badges. Nobody's stored data carries lk_badges at all, so a
       person who turned streaks and badges on found them off after the
       upgrade -- the switch in Settings said off, and it was telling the
       truth about a key that had never been written.

       Only adopted when lk_badges has not been set here: a choice made in
       this build is never overwritten by the older key. Idempotent, and it
       does nothing on a phone that never had the old switch. */
    function (ST) {
      if (ST.touched('lk_badges')) return false;
      if (!ST.touched('lk_gamingLayer')) return false;
      var on = ST.get('lk_gamingLayer', null);
      if (typeof on !== 'boolean') return false;
      ST.set('lk_badges', on);
      return true;
    },

    /* 7 — THE GOAL, IN THE THREE WORDS THIS BUILD READS.

       The shipped app stores lk_profile.goal as "Cut", "Maintain" or
       "Bulk". Everything here reads cut / maintain / build, and every
       reader of it defaults an unknown word to maintain: Fuel's goalKey()
       does, and Settings blanks the row outright. So a reader who is
       cutting was given maintenance calories -- 400 more a day than the
       goal they set -- and one bulking was given 250 fewer, with the
       screen stating a goal they had not chosen.

       Only the three the shipped app writes are mapped. Anything else is
       left exactly as it is rather than guessed at: a word this migration
       does not recognise is not evidence of what somebody meant.

       Idempotent -- the mapped values are already this build's own. */
    function (ST) {
      if (!ST.touched('lk_profile')) return false;
      var p = ST.get('lk_profile', null);
      if (!p || typeof p !== 'object') return false;
      var MAP = { Cut: 'cut', Maintain: 'maintain', Bulk: 'build' };
      var to = MAP[p.goal];
      if (!to) return false;
      p.goal = to;
      ST.set('lk_profile', p);
      return true;
    },

    /* 8 — THE FOOD LOG, WHICH CRASHED FUEL OUTRIGHT.

       A day in the shipped app is

         { meals: { breakfast: [], lunch: [], dinner: [], snacks: [ ... ] },
           water: 1905 }

       and a day here is { meals: [ ... ], waterMl, supps }, where each
       meal carries the slot it was eaten in rather than sitting in a
       bucket named after it. Fuel calls src.meals.map, so against the
       stored shape it threw "meals.forEach is not a function" on load and
       the screen was blank -- not degraded, gone. One of the five
       accounts on the live project stores its log this way.

       A row's calories are `cal` there and `kcal` here; everything else
       carries across under the name it already has, including whether it
       was an estimate and whether it came from the voice logger.

       Idempotent: a day whose meals are already an array is untouched,
       so this is safe against a device that has run it and against one
       whose log arrived half-converted by sync. */
    function (ST) {
      if (!ST.touched('lk_fuelLog')) return false;
      var log = ST.get('lk_fuelLog', null);
      if (!log || typeof log !== 'object' || Array.isArray(log)) return false;
      var SLOT = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner',
                   snacks: 'snack', snack: 'snack' };
      var did = false;
      Object.keys(log).forEach(function (iso) {
        var d = log[iso];
        if (!d || typeof d !== 'object') return;
        if (d.meals && !Array.isArray(d.meals)) {
          var flat = [];
          Object.keys(d.meals).forEach(function (bucket) {
            var rows = d.meals[bucket];
            if (!Array.isArray(rows)) return;
            rows.forEach(function (m) {
              if (!m || typeof m !== 'object') return;
              var row = {};
              Object.keys(m).forEach(function (k) { row[k] = m[k]; });
              row.slot = SLOT[bucket] || m.slot || 'snack';
              if (row.kcal === undefined && m.cal !== undefined) row.kcal = m.cal;
              flat.push(row);
            });
          });
          d.meals = flat;
          did = true;
        }
        /* water is millilitres under both names; only the name changed */
        if (d.waterMl === undefined && typeof d.water === 'number') {
          d.waterMl = d.water;
          did = true;
        }
      });
      if (!did) return false;
      ST.set('lk_fuelLog', log);
      return true;
    },

    /* 9 — THE NAMING PASS, AGAIN, NOW THAT IT KNOWS ABOUT CUSTOM LIFTS.

       Migration 5 resolves names, and on devices that had already run it
       the marker said done -- so the fix above, which teaches it to read
       lk_customEx, would never reach the accounts that needed it. A
       shipped migration is not rewritten; a new one runs the corrected
       pass. It is the same function, and it is idempotent, so a device
       that is already named pays nothing. */
    function (ST) { return MIGRATIONS[4](ST); },

    /* 10 — A SAVED MEMORY IS A ROW, NOT A STRING.

       The shipped app stores lk_coachMemory as plain strings. Coach reads
       {text}, so the first one it tried to quote threw and the screen
       would not open. Normalised here as well as on the read, so the
       stored shape stops being wrong rather than being worked around
       forever. Idempotent: a row already shaped right is untouched. */
    function (ST) {
      if (!ST.touched('lk_coachMemory')) return false;
      var mem = ST.get('lk_coachMemory', null);
      if (!Array.isArray(mem) || !mem.length) return false;
      var did = false;
      var out = mem.map(function (m) {
        if (typeof m === 'string') { did = true; return { text: m }; }
        return m;
      }).filter(function (m) { return m && typeof m.text === 'string'; });
      if (!did) return false;
      ST.set('lk_coachMemory', out);
      return true;
    }

  ];

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

  /* Run on load, before any screen reads a key. A migration that waits for a
     screen to remember to call it is a migration that does not run on the
     screen that forgot. */
  try { API.migrate(); } catch (e) {}
  /* AND THE REPAIRS, WHICH ARE NOT GATED ON THE MARKER.

     A numbered migration is a one-time structural conversion, and the
     marker is right to stop it running twice. Three of these are not
     that: they are corrections, and a phone can arrive already past
     their number and still holding the shape they fix -- which is
     exactly what happened. A build shipped a naming pass that did not
     know about custom exercises, stamped the marker, and every later
     build was then forbidden from repairing what it had left blank.

     These three are cheap, idempotent, and read nothing they do not
     already own, so running them on every boot costs a few milliseconds
     and closes that trap for good. Anything structural still belongs in
     MIGRATIONS. */
  try { API.repair(); } catch (e) {}
})(typeof window !== 'undefined' ? window : this);
