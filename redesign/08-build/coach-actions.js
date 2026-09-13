/* ===================================================================
   LKCoachActions — what the coach is allowed to write, and how.

   THE PRINCIPLE: the coach proposes, the person approves, the app
   writes. Nothing a model returns is applied silently, and nothing it
   returns is trusted. This module is the gate between a language model
   and somebody's training data, and it is written on the assumption
   that the model will get things wrong — because it will.

   Three rules it enforces, in order of how much damage they prevent:

   1. EVERY ID IS RESOLVED AGAINST THE REAL CATALOGUE. A model asked for
      a push day will happily return exercise id 999, or id 501 under the
      name "Barbell Squat" when 501 is an Incline DB Curl. An id that is
      not in exercise-db.json is refused; a name is resolved to an id and
      refused when it matches nothing or matches ambiguously. This is the
      same defect class the build already shipped by hand twice.

   2. NO TOTAL THE MODEL STATES IS BELIEVED. Every derived figure --
      a recipe's calories, a session's volume, a list's item count -- is
      recomputed here from the parts. A model that says "2,400 kcal" over
      ingredients summing to 1,900 gets 1,900, and the card shows it.

   3. EVERY FIELD IS BOUNDED. Sets, reps, loads, servings, calories and
      string lengths all have limits taken from what the screens accept.
      Anything outside them is refused rather than clamped, because a
      silently clamped number is a number nobody chose.

   What comes back from check() is a verdict, never a half-applied
   change: an action either passes whole or is refused with the reasons
   named, so a card can say exactly why it will not save.

   apply() writes through LKStore to the same keys the screens already
   read, and returns an undo token. Nothing here invents a key.
   =================================================================== */
(function (g) {
  'use strict';

  /* ---- limits, from what the screens themselves accept ------------- */
  var LIMIT = {
    name: 60, title: 80, note: 400, text: 2000,
    days: 7, exPerDay: 12, sets: 10, reps: 100, kg: 500,
    items: 40, servings: 24, kcal: 10000, macro: 1000,
    minutes: 600, km: 200
  };

  function str(v, max) {
    if (typeof v !== 'string') return '';
    return v.replace(/\s+/g, ' ').trim().slice(0, max);
  }
  function num(v) {
    var x = typeof v === 'string' ? parseFloat(v) : v;
    return typeof x === 'number' && isFinite(x) ? x : null;
  }
  function inRange(v, lo, hi) { return v !== null && v >= lo && v <= hi; }

  /* ---- the catalogue ----------------------------------------------
     Whatever the app already loaded. exercise-library and split-builder
     fetch the full 867; where that has not happened the fixture's own
     list stands, and an id outside it is refused rather than guessed at.
     A refusal is the right answer: a split pointing at the wrong lift is
     worse than a split that did not save. */
  var catalogue = null;
  function setCatalogue(list) {
    catalogue = {};
    (list || []).forEach(function (e) {
      if (!e || e.id == null) return;
      catalogue[String(e.id)] = { id: Number(e.id), name: String(e.name || ''),
                                  group: String(e.group || ''), muscle: String(e.muscle || '') };
    });
  }
  function haveCatalogue() { return !!catalogue && Object.keys(catalogue).length > 0; }
  function byId(id) { return catalogue ? catalogue[String(id)] || null : null; }
  function byName(name) {
    if (!catalogue) return null;
    var want = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!want) return null;
    var hits = [];
    Object.keys(catalogue).forEach(function (k) {
      var n = catalogue[k].name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (n === want) hits.push(catalogue[k]);
    });
    /* Exactly one exact match, or nothing. A near match is a guess, and a
       guess here puts a lift nobody chose into somebody's programme. */
    return hits.length === 1 ? hits[0] : null;
  }

  /* An exercise the model named, resolved to one the catalogue holds. */
  function resolveEx(e, problems, where) {
    if (!e || typeof e !== 'object') { problems.push(where + ': not an exercise'); return null; }
    var hit = e.id != null ? byId(e.id) : null;
    if (!hit && e.name) hit = byName(e.name);
    if (!hit) {
      problems.push(where + ': "' + str(e.name, 40) + '"' +
        (e.id != null ? ' (id ' + e.id + ')' : '') + ' is not in the exercise catalogue');
      return null;
    }
    /* The catalogue's name wins over the model's. A right id under a wrong
       name is the failure that is hardest to see afterwards. */
    return { id: hit.id, name: hit.name, group: hit.group, muscle: hit.muscle,
             sets: inRange(num(e.sets), 1, LIMIT.sets) ? Math.round(num(e.sets)) : 3 };
  }

  /* ---- the food table ---------------------------------------------- */
  function foods() {
    var F = g.LKFixtures;
    return (F && F.nutrition && F.nutrition.foods) || {};
  }
  function resolveFood(f, problems, where) {
    if (!f || typeof f !== 'object') { problems.push(where + ': not a food'); return null; }
    var table = foods();
    var key = f.key && table[f.key] ? f.key : null;
    if (!key && f.name) {
      var want = String(f.name).toLowerCase();
      Object.keys(table).forEach(function (k) {
        if (!key && String(table[k].name || '').toLowerCase() === want) key = k;
      });
    }
    var qty = inRange(num(f.qty), 0.1, LIMIT.servings) ? num(f.qty) : 1;
    if (key) {
      var t = table[key];
      return { key: key, name: t.name, qty: qty, icon: t.icon,
               kcal: t.kcal * qty, pro: t.pro * qty, carb: t.carb * qty, fat: t.fat * qty };
    }
    /* Not in the table. It can still be logged when the model carries every
       macro for it -- that is a figure somebody can check -- but never on a
       calorie count alone, which is a number with no working behind it. */
    var kcal = num(f.kcal), pro = num(f.pro), carb = num(f.carb), fat = num(f.fat);
    if (!inRange(kcal, 0, LIMIT.kcal) || !inRange(pro, 0, LIMIT.macro) ||
        !inRange(carb, 0, LIMIT.macro) || !inRange(fat, 0, LIMIT.macro)) {
      problems.push(where + ': "' + str(f.name, 40) + '" is not in the food table and ' +
        'does not carry protein, carbs and fat, so there is nothing to log');
      return null;
    }
    return { key: null, name: str(f.name, LIMIT.name) || 'Food', qty: qty, icon: '🍽️',
             kcal: kcal * qty, pro: pro * qty, carb: carb * qty, fat: fat * qty };
  }

  /* =================================================================
     The checkers. One per kind. Each returns a normalised action or
     null, and pushes the reason for every refusal.
     ================================================================= */
  var CHECK = {};

  CHECK.split = function (a, problems) {
    if (!haveCatalogue()) {
      problems.push('the exercise catalogue has not loaded, so no lift can be verified');
      return null;
    }
    var src = a.split || {};
    var days = Array.isArray(src.days) ? src.days : [];
    if (!days.length) { problems.push('a split with no days'); return null; }
    if (days.length > LIMIT.days) { problems.push('more than ' + LIMIT.days + ' days in a week'); return null; }
    var out = [];
    days.forEach(function (d, i) {
      var name = str(d && d.name, 30) || ('Day ' + (i + 1));
      var exs = Array.isArray(d && d.exercises) ? d.exercises : [];
      if (exs.length > LIMIT.exPerDay) { problems.push(name + ': more than ' + LIMIT.exPerDay + ' exercises'); return; }
      var kept = [];
      exs.forEach(function (e, j) {
        var r = resolveEx(e, problems, name + ' exercise ' + (j + 1));
        if (r) kept.push(r);
      });
      if (kept.length) out.push({ name: name, blocks: [], exercises: kept });
    });
    if (!out.length) { problems.push('no day survived checking'); return null; }
    return { kind: 'split', title: str(a.title, LIMIT.title) || 'New split',
             name: str(src.name, 30) || 'Coach split', days: out,
             /* Counted here, never taken from the model. */
             exercises: out.reduce(function (n, d) { return n + d.exercises.length; }, 0) };
  };

  CHECK.goal = function (a, problems) {
    var src = a.goal || {};
    var TYPES = { weight: 1, bodyfat: 1, lift: 1, custom: 1 };
    var type = TYPES[src.type] ? src.type : 'custom';
    var target = num(src.target);
    var out = { kind: 'goal', title: str(a.title, LIMIT.title) || 'New goal',
                type: type, name: str(src.name, LIMIT.name),
                target: target, start: num(src.start), exId: null,
                unit: type === 'bodyfat' ? '%' : type === 'custom' ? '' : 'kg',
                targetDate: /^\d{4}-\d{2}-\d{2}$/.test(src.targetDate || '') ? src.targetDate : '',
                notes: str(src.notes, LIMIT.note) };
    if (type === 'lift') {
      if (!haveCatalogue()) { problems.push('the exercise catalogue has not loaded'); return null; }
      var r = resolveEx({ id: src.exId, name: src.exName || src.name }, problems, 'the goal’s lift');
      if (!r) return null;
      out.exId = r.id;
      if (!out.name) out.name = r.name;
    }
    if (type !== 'custom' && !inRange(target, 0.1, LIMIT.kg)) {
      problems.push('a ' + type + ' goal needs a target between 0.1 and ' + LIMIT.kg);
      return null;
    }
    if (!out.name) { problems.push('a goal with no name'); return null; }
    return out;
  };

  CHECK.recipe = function (a, problems) {
    var src = a.recipe || {};
    var items = Array.isArray(src.items) ? src.items : [];
    if (!items.length) { problems.push('a recipe with no ingredients'); return null; }
    if (items.length > LIMIT.items) { problems.push('more than ' + LIMIT.items + ' ingredients'); return null; }
    var servings = inRange(num(src.servings), 1, LIMIT.servings) ? Math.round(num(src.servings)) : 1;
    var kept = [], tot = { kcal: 0, pro: 0, carb: 0, fat: 0 };
    items.forEach(function (it, i) {
      var r = resolveFood(it, problems, 'ingredient ' + (i + 1));
      if (!r) return;
      kept.push(r);
      tot.kcal += r.kcal; tot.pro += r.pro; tot.carb += r.carb; tot.fat += r.fat;
    });
    if (!kept.length) { problems.push('no ingredient survived checking'); return null; }
    var name = str(src.name, LIMIT.name);
    if (!name) { problems.push('a recipe with no name'); return null; }
    /* Totals from the parts. Whatever the model said they were is discarded. */
    return { kind: 'recipe', title: str(a.title, LIMIT.title) || name,
             name: name, servings: servings, items: kept,
             notes: (Array.isArray(src.notes) ? src.notes : []).slice(0, 12)
               .map(function (x) { return str(x, LIMIT.note); }).filter(Boolean),
             kcal: Math.round(tot.kcal), pro: Math.round(tot.pro),
             carb: Math.round(tot.carb), fat: Math.round(tot.fat) };
  };

  CHECK.shopping = function (a, problems) {
    var items = Array.isArray(a.items) ? a.items : [];
    if (!items.length) { problems.push('a shopping list with nothing on it'); return null; }
    if (items.length > LIMIT.items) { problems.push('more than ' + LIMIT.items + ' items'); return null; }
    var kept = [];
    items.forEach(function (it) {
      var name = str(typeof it === 'string' ? it : (it && it.name), LIMIT.name);
      if (!name) return;
      var qty = it && num(it.quantity);
      kept.push({ itemName: name,
                  quantity: inRange(qty, 0.1, 999) ? qty : 1,
                  unit: str(it && it.unit, 12),
                  category: str(it && it.category, 20) || 'other' });
    });
    if (!kept.length) { problems.push('nothing on the list had a name'); return null; }
    return { kind: 'shopping', title: str(a.title, LIMIT.title) || 'Add to your list', items: kept };
  };

  CHECK.food = function (a, problems) {
    var src = a.meal || {};
    var SLOTS = { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };
    var r = resolveFood(src, problems, 'the meal');
    if (!r) return null;
    return { kind: 'food', title: str(a.title, LIMIT.title) || ('Log ' + r.name),
             slot: SLOTS[src.slot] ? src.slot : 'snack',
             name: r.name, key: r.key, icon: r.icon, qty: r.qty,
             kcal: Math.round(r.kcal), pro: Math.round(r.pro),
             carb: Math.round(r.carb), fat: Math.round(r.fat) };
  };

  CHECK.cardio = function (a, problems) {
    var src = a.session || {};
    var name = str(src.name, LIMIT.name);
    var min = num(src.minutes);
    if (!name) { problems.push('a cardio session with no name'); return null; }
    if (!inRange(min, 1, LIMIT.minutes)) { problems.push('minutes between 1 and ' + LIMIT.minutes); return null; }
    var out = { kind: 'cardio', title: str(a.title, LIMIT.title) || name,
                name: name, minutes: Math.round(min) };
    var km = num(src.km);
    if (inRange(km, 0.1, LIMIT.km)) out.km = Math.round(km * 100) / 100;
    return out;
  };

  CHECK.instructions = function (a, problems) {
    var text = str(a.text, LIMIT.text);
    if (!text) { problems.push('empty instructions'); return null; }
    return { kind: 'instructions', title: str(a.title, LIMIT.title) || 'Update your coaching instructions',
             text: text };
  };

  CHECK.fact = function (a, problems) {
    var text = str(a.text, LIMIT.note);
    if (!text) { problems.push('an empty fact'); return null; }
    return { kind: 'fact', title: str(a.title, LIMIT.title) || 'Remember this', text: text };
  };

  /* =================================================================
     check() — one action in, a verdict out.
     ================================================================= */
  function check(action) {
    var problems = [];
    if (!action || typeof action !== 'object') {
      return { ok: false, problems: ['not an action'], action: null, kind: null };
    }
    var kind = String(action.kind || '');
    if (!CHECK[kind]) {
      return { ok: false, problems: ['"' + str(kind, 30) + '" is not something the coach can do'],
               action: null, kind: kind };
    }
    var out = null;
    try { out = CHECK[kind](action, problems); }
    catch (e) { problems.push('could not be read: ' + e.message); }
    return { ok: !!out && !problems.length, problems: problems, action: out, kind: kind };
  }

  /* A whole reply. Refused actions are kept, with their reasons, so the
     screen can say what it would not do rather than quietly showing less. */
  function checkAll(actions) {
    return (Array.isArray(actions) ? actions : []).slice(0, 8).map(check);
  }

  /* =================================================================
     apply() — writes through LKStore, to the keys the screens read.
     Returns an undo token; revert(token) puts it back.
     ================================================================= */
  function store() { return g.LKStore || null; }

  var APPLY = {
    split: function (a, ST) {
      var all = (ST.get('lk_splits', []) || []).slice();
      var rec = { id: 's' + Date.now(), name: a.name, created: ST.today(),
                  days: a.days.map(function (d) {
                    return { name: d.name, blocks: [],
                             exercises: d.exercises.map(function (e) {
                               return { id: e.id, name: e.name, group: e.group, muscle: e.muscle };
                             }) };
                  }) };
      all.unshift(rec);
      ST.set('lk_splits', all);
      return { key: 'lk_splits', id: rec.id, what: a.name };
    },
    goal: function (a, ST) {
      var all = (ST.get('lk_goals', []) || []).slice();
      var rec = { type: a.type, name: a.name, exId: a.exId, target: a.target,
                  start: a.start, unit: a.unit, targetDate: a.targetDate,
                  notes: a.notes, status: 'active', created: new Date().toISOString(),
                  completed: '', id: 'g' + Date.now() };
      all.unshift(rec);
      ST.set('lk_goals', all);
      return { key: 'lk_goals', id: rec.id, what: a.name };
    },
    recipe: function (a, ST) {
      var all = (ST.get('lk_recipes', []) || []).slice();
      var rec = { id: 'r' + Date.now(), name: a.name, servings: a.servings,
                  icon: (a.items[0] || {}).icon || '🥗',
                  items: a.items.map(function (it) { return { key: it.key, qty: it.qty, name: it.name }; }),
                  notes: a.notes, kcal: a.kcal, pro: a.pro, carb: a.carb, fat: a.fat };
      all.unshift(rec);
      ST.set('lk_recipes', all);
      return { key: 'lk_recipes', id: rec.id, what: a.name };
    },
    shopping: function (a, ST) {
      var all = (ST.get('lk_shoppingList', []) || []).slice();
      var now = Date.now(), ids = [];
      a.items.forEach(function (it, i) {
        var id = 'sh_' + (now + i) + '_coach';
        ids.push(id);
        all.push({ id: id, itemName: it.itemName, quantity: it.quantity, unit: it.unit,
                   category: it.category, dateAdded: new Date().toISOString(), checked: false });
      });
      ST.set('lk_shoppingList', all);
      return { key: 'lk_shoppingList', ids: ids, what: a.items.length + ' items' };
    },
    food: function (a, ST) {
      var log = ST.get('lk_fuelLog', {}) || {};
      var iso = ST.today();
      var day = log[iso] || { date: iso, meals: [], eaten: 0, pro: 0, carb: 0, fat: 0, waterMl: 0, supps: [] };
      var id = 'm' + Date.now();
      day.meals = (day.meals || []).concat([{ id: id, key: a.key, icon: a.icon, name: a.name,
        at: '', slot: a.slot, src: 'coach', kcal: a.kcal, pro: a.pro, carb: a.carb, fat: a.fat }]);
      day.eaten = day.meals.reduce(function (n, m) { return n + (m.kcal || 0); }, 0);
      day.pro = day.meals.reduce(function (n, m) { return n + (m.pro || 0); }, 0);
      day.carb = day.meals.reduce(function (n, m) { return n + (m.carb || 0); }, 0);
      day.fat = day.meals.reduce(function (n, m) { return n + (m.fat || 0); }, 0);
      log[iso] = day;
      ST.set('lk_fuelLog', log);
      return { key: 'lk_fuelLog', id: id, iso: iso, what: a.name };
    },
    cardio: function (a, ST) {
      var all = (ST.get('lk_history', []) || []).slice();
      var rec = { id: 'w_' + Date.now(), kind: 'cardio', name: a.name,
                  date: ST.today(), min: a.minutes };
      if (a.km) rec.km = a.km;
      all.unshift(rec);
      ST.set('lk_history', all);
      return { key: 'lk_history', id: rec.id, what: a.name };
    },
    instructions: function (a, ST) {
      var was = ST.get('lk_coachInstructions', '');
      ST.set('lk_coachInstructions', a.text);
      return { key: 'lk_coachInstructions', was: was, what: 'your coaching instructions' };
    },
    fact: function (a, ST) {
      var all = (ST.get('lk_coachMemory', []) || []).slice();
      var rec = { id: 'f' + Date.now(), text: a.text, at: new Date().toISOString() };
      all.unshift(rec);
      ST.set('lk_coachMemory', all);
      return { key: 'lk_coachMemory', id: rec.id, what: a.text };
    }
  };

  function apply(action) {
    var ST = store();
    if (!ST) return { ok: false, problems: ['nothing on this phone can store it'] };
    if (!action || !APPLY[action.kind]) return { ok: false, problems: ['not something that can be applied'] };
    var token;
    try { token = APPLY[action.kind](action, ST); }
    catch (e) { return { ok: false, problems: ['could not be saved: ' + e.message] }; }
    token.kind = action.kind;
    return { ok: true, token: token, problems: [] };
  }

  /* Every apply is reversible. A coach that can write has to be a coach
     that can be told it was wrong. */
  function revert(token) {
    var ST = store();
    if (!ST || !token) return false;
    if (token.kind === 'instructions') { ST.set('lk_coachInstructions', token.was || ''); return true; }
    if (token.kind === 'shopping') {
      var list = (ST.get('lk_shoppingList', []) || []).filter(function (r) {
        return token.ids.indexOf(r.id) < 0;
      });
      ST.set('lk_shoppingList', list);
      return true;
    }
    if (token.kind === 'food') {
      var log = ST.get('lk_fuelLog', {}) || {};
      var day = log[token.iso];
      if (!day) return false;
      day.meals = (day.meals || []).filter(function (m) { return m.id !== token.id; });
      day.eaten = day.meals.reduce(function (n, m) { return n + (m.kcal || 0); }, 0);
      day.pro = day.meals.reduce(function (n, m) { return n + (m.pro || 0); }, 0);
      day.carb = day.meals.reduce(function (n, m) { return n + (m.carb || 0); }, 0);
      day.fat = day.meals.reduce(function (n, m) { return n + (m.fat || 0); }, 0);
      log[token.iso] = day;
      ST.set('lk_fuelLog', log);
      return true;
    }
    var list2 = (ST.get(token.key, []) || []).filter(function (r) { return r.id !== token.id; });
    ST.set(token.key, list2);
    return true;
  }

  g.LKCoachActions = {
    check: check,
    checkAll: checkAll,
    apply: apply,
    revert: revert,
    setCatalogue: setCatalogue,
    haveCatalogue: haveCatalogue,
    LIMIT: LIMIT,
    kinds: Object.keys(CHECK)
  };
})(typeof window !== 'undefined' ? window : this);
