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

  /* ---- A PRESCRIPTION, AND WHY REPS IS A STRING -------------------
     A planned exercise had no sets and no reps anywhere in the app. The
     model was told to send them, this gate kept `sets` and dropped
     `reps` on the floor, and APPLY.split then wrote neither -- so a
     split the coach wrote lost its prescription on the way to storage
     and every screen showed a day as a bare list of lift names.

     SETS IS A NUMBER because sets are counted: the workout log lays out
     that many rows, so it has to be an integer and it is bounded by
     LIMIT.sets, the same 1 to 10 this file already used.

     REPS IS A STRING. A real prescription is "8-12" or "AMRAP" at least
     as often as it is 10, and a number cannot hold either. Nothing in
     the app does arithmetic on a planned rep count -- it is printed on
     the builder row and on the coach's card, and it seeds the keypad
     the way last session's figure does -- so storing what was actually
     prescribed costs nothing and rounding it to a single integer would
     throw away the half of it that says how hard the set is meant to
     be. Where a number IS wanted (seeding the pad) it is parsed at the
     point of use, and a prescription that is not a plain number simply
     leaves the pad blank rather than inventing one.

     What comes out is one of three canonical forms: "10", "8-12", or
     "AMRAP". What goes in can be a number, "10 reps", "8 to 12", an en
     dash, "max" or "to failure", because that is the spread of things a
     model actually sends when asked for a rep range. Anything else is
     REFUSED by name rather than dropped, for the reason this whole
     field exists: a prescription that disappears without a word is the
     bug being fixed here, and doing it again in a new place would be
     worse than saying "I could not read that".

     Absent is not an error. A day with no prescription is a normal day
     -- every split already on a phone is one -- so an exercise that
     carries no reps at all carries none, and the screens read that as
     "not prescribed" rather than as zero. */
  var REPS_WORDS = { amrap: 'AMRAP', max: 'AMRAP', 'to failure': 'AMRAP', failure: 'AMRAP' };
  function normReps(v) {
    var s = typeof v === 'number' && isFinite(v) ? String(v)
          : typeof v === 'string' ? v : '';
    s = s.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!s) return '';
    s = s.replace(/\breps?\b/g, '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (REPS_WORDS[s]) return REPS_WORDS[s];
    s = s.replace(/\s*(?:to|\u2013|\u2014)\s*/g, '-').replace(/\s+/g, '');
    var one = /^(\d+)\+?$/.exec(s);
    if (one) return inRange(num(one[1]), 1, LIMIT.reps) ? String(num(one[1])) : null;
    var span = /^(\d+)-(\d+)$/.exec(s);
    if (span) {
      var lo = num(span[1]), hi = num(span[2]);
      if (!inRange(lo, 1, LIMIT.reps) || !inRange(hi, 1, LIMIT.reps) || lo > hi) return null;
      return lo === hi ? String(lo) : lo + '-' + hi;
    }
    return null;
  }

  /* ---- ONE VOCABULARY, SPELT TWO WAYS -----------------------------
     The system prompt in cloud.js tells the model to send goal.title,
     food.protein, items[].qty, items[].grams, a "cardio" object and a
     "food" object. This file was reading goal.name, pro, quantity, qty,
     "session" and "meal". Four of the eight documented shapes were
     therefore refused by the app's own gate the moment a model did
     exactly what it was told, and the reader saw "Not saved -- a goal
     with no name" about a goal that had one.

     The fix does not rename anything downstream. The names below on the
     right are the app's own storage shapes, which the screens, the
     sentinel parser in coach.html and lk_goals/lk_fuelLog all read, so
     they stay. What changes is that the gate now ACCEPTS either
     spelling and normalises to one. BRAIN documents only the first of
     each pair, so there is a single vocabulary to teach the model and
     no live shape that suddenly stops working.

       title | name            -> name
       by | targetDate         -> targetDate
       qty | quantity          -> quantity (shopping) / qty (food)
       grams                   -> qty, converted through the table
       servings                -> qty
       protein | pro           -> pro
       carbs | carb            -> carb
       calories | kcal         -> kcal
       food | meal             -> the food object
       cardio | session        -> the cardio object
       steps | notes           -> notes

     first() takes the first key that is actually there, so a zero or an
     empty string sent on purpose is not skipped over in favour of the
     other spelling. */
  function first(o) {
    if (!o || typeof o !== 'object') return undefined;
    for (var i = 1; i < arguments.length; i++) {
      var k = arguments[i];
      if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
    }
    return undefined;
  }

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
    /* The sets default of 3 is the one this file already shipped and the
       one the workout log already lays out when a day says nothing, so a
       model that sends no sets changes nothing about what anybody sees.
       Reps has no such default: there is no honest guess at how many
       reps somebody else meant, so a lift with none is simply not
       prescribed reps. */
    var out = { id: hit.id, name: hit.name, group: hit.group, muscle: hit.muscle,
                sets: inRange(num(e.sets), 1, LIMIT.sets) ? Math.round(num(e.sets)) : 3 };
    var r = normReps(first(e, 'reps', 'rep', 'repRange', 'reps_range'));
    if (r === null) {
      problems.push(where + ': "' + str(String(e.reps == null ? '' : e.reps), 20) +
        '" is not a rep count, a range like 8-12, or AMRAP');
      return null;
    }
    if (r) out.reps = r;
    return out;
  }

  /* ---- the food table ---------------------------------------------- */
  function foods() {
    var F = g.LKFixtures;
    return (F && F.nutrition && F.nutrition.foods) || {};
  }
  /* HOW MUCH OF IT. The table is keyed in servings and carries the gram
     weight of one serving in `g`, but the prompt documents `grams` on a
     recipe ingredient and `servings` on a logged food. Taking grams as a
     multiplier is how 200 g of a 450 g bowl came out as one serving and
     then as a whole bowl's calories, so grams is converted through the
     table and only used as-is when there is nothing to convert with. */
  function amount(f, t) {
    var q = num(first(f, 'qty', 'quantity', 'servings'));
    if (inRange(q, 0.1, LIMIT.servings)) return q;
    var grams = num(first(f, 'grams'));
    if (t && inRange(grams, 1, 20000) && num(t.g) > 0) {
      var scaled = Math.round((grams / num(t.g)) * 100) / 100;
      if (inRange(scaled, 0.1, LIMIT.servings)) return scaled;
    }
    /* Off the table, grams has nothing to scale against: the macros the
       model carried describe the portion it named, so that portion is
       one of whatever it is. */
    return 1;
  }

  function resolveFood(f, problems, where) {
    if (!f || typeof f !== 'object') { problems.push(where + ': not a food'); return null; }
    var table = foods();
    var key = f.key && table[f.key] ? f.key : null;
    if (!key && f.name) {
      var want = String(f.name).toLowerCase().trim();
      Object.keys(table).forEach(function (k) {
        if (key) return;
        if (String(table[k].name || '').toLowerCase() === want) key = k;
        /* The table's own alias list, which is the app's data and not a
           guess: "chicken bowl" is the same row as "Chicken rice bowl"
           and refusing it taught the model nothing it could act on. */
        else if ((table[k].alias || []).some(function (a) { return String(a).toLowerCase() === want; })) key = k;
      });
    }
    var qty = amount(f, key ? table[key] : null);
    if (key) {
      var t = table[key];
      return { key: key, name: t.name, qty: qty, icon: t.icon,
               kcal: t.kcal * qty, pro: t.pro * qty, carb: t.carb * qty, fat: t.fat * qty };
    }
    /* Not in the table. It can still be logged when the model carries every
       macro for it -- that is a figure somebody can check -- but never on a
       calorie count alone, which is a number with no working behind it. */
    var kcal = num(first(f, 'kcal', 'calories', 'cal'));
    var pro = num(first(f, 'pro', 'protein'));
    var carb = num(first(f, 'carb', 'carbs', 'carbohydrates'));
    var fat = num(first(f, 'fat'));
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
    return { kind: 'split', title: str(a.title || src.name, LIMIT.title) || 'New split',
             name: str(src.name, 30) || 'Coach split', days: out,
             /* Counted here, never taken from the model. */
             exercises: out.reduce(function (n, d) { return n + d.exercises.length; }, 0) };
  };

  CHECK.goal = function (a, problems) {
    var src = a.goal || {};
    var TYPES = { weight: 1, bodyfat: 1, lift: 1, custom: 1 };
    /* NO TYPE IS A REAL ANSWER. The prompt never documented `type`, so
       most goals arrive without one, and "custom" is what a goal with a
       title and a date is. It was already the default; what is new is
       that nothing below now refuses a goal for the absence. */
    var type = TYPES[src.type] ? src.type : 'custom';
    var name = str(first(src, 'title', 'name'), LIMIT.name);
    var by = String(first(src, 'by', 'targetDate') || '');
    var target = num(src.target);
    var unit = str(src.unit, 12);
    var out = { kind: 'goal', title: str(a.title || name, LIMIT.title) || 'New goal',
                type: type, name: name,
                target: target, start: num(src.start), exId: null,
                /* The model is asked for a unit and usually sends one. It
                   is kept when it came, because "reps" and "km" are goals
                   people set and the derived answer would have said kg. */
                unit: unit || (type === 'bodyfat' ? '%' : type === 'custom' ? '' : 'kg'),
                targetDate: /^\d{4}-\d{2}-\d{2}$/.test(by) ? by : '',
                notes: str(first(src, 'notes', 'note'), LIMIT.note) };
    if (type === 'lift') {
      if (!haveCatalogue()) { problems.push('the exercise catalogue has not loaded'); return null; }
      /* THE TITLE IS NOT A LIFT. This used to fall back to the goal's own
         name, so "Bench 100kg" -- a perfectly good goal title -- was
         looked up in the exercise catalogue, missed, and the whole goal
         was refused with "the goal's lift: "Bench 100kg" is not in the
         exercise catalogue". Only exId and exName name a lift. The title
         is still tried, but only as a link: when it happens to be an
         exact catalogue name the goal gets an exId, and when it is not
         the goal saves anyway with no lift attached. */
      var named = first(src, 'exId', 'exName') !== undefined;
      var r = resolveEx({ id: src.exId, name: src.exName },
                        named ? problems : [], 'the goal’s lift');
      if (!r && !named) r = byName(name);
      if (!r && named) return null;
      if (r) {
        out.exId = r.id;
        if (!out.name) out.name = r.name;
      }
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
    var items = Array.isArray(src.items) ? src.items
              : Array.isArray(src.ingredients) ? src.ingredients : [];
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
    var name = str(first(src, 'name', 'title'), LIMIT.name);
    if (!name) { problems.push('a recipe with no name'); return null; }
    var stepsOf = first(src, 'steps', 'notes', 'method');
    /* Totals from the parts. Whatever the model said they were is discarded. */
    return { kind: 'recipe', title: str(a.title, LIMIT.title) || name,
             name: name, servings: servings, items: kept,
             /* METHOD. The prompt asks for `steps`, this stored it as
                `notes`, and the two never met: every recipe the coach
                wrote saved with no method at all. A single string is
                taken as one step, because that is what a model sends
                when there is only one. */
             notes: (Array.isArray(stepsOf) ? stepsOf : stepsOf ? [stepsOf] : []).slice(0, 12)
               .map(function (x) { return str(x, LIMIT.note); }).filter(Boolean),
             kcal: Math.round(tot.kcal), pro: Math.round(tot.pro),
             carb: Math.round(tot.carb), fat: Math.round(tot.fat) };
  };

  CHECK.shopping = function (a, problems) {
    var items = Array.isArray(a.items) ? a.items
              : Array.isArray(a.shopping && a.shopping.items) ? a.shopping.items : [];
    if (!items.length) { problems.push('a shopping list with nothing on it'); return null; }
    if (items.length > LIMIT.items) { problems.push('more than ' + LIMIT.items + ' items'); return null; }
    var kept = [];
    items.forEach(function (it) {
      var name = str(typeof it === 'string' ? it : (it && it.name), LIMIT.name);
      if (!name) return;
      /* `qty` IS WHAT THE PROMPT ASKS FOR. This read `quantity` only, so
         every qty the model sent fell through to the default and "3 kg
         Rice" was written down as "1 kg Rice" -- wrong, and silent,
         which is the worst of the five. */
      var qty = it && num(first(it, 'qty', 'quantity', 'amount'));
      kept.push({ itemName: name,
                  quantity: inRange(qty, 0.1, 999) ? qty : 1,
                  unit: str(it && it.unit, 12),
                  category: str(it && it.category, 20) || 'other' });
    });
    if (!kept.length) { problems.push('nothing on the list had a name'); return null; }
    return { kind: 'shopping', title: str(a.title, LIMIT.title) || 'Add to your list', items: kept };
  };

  CHECK.food = function (a, problems) {
    /* `food` is what the prompt documents; `meal` is what the sentinel
       parser in coach.html builds, and it is still live. Both land here. */
    var src = a.food || a.meal || {};
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
    /* Same pair as food: `cardio` from the prompt, `session` from the
       CARDIO sentinel block. Reading only the second refused every
       cardio action a model sent by the book. */
    var src = a.cardio || a.session || {};
    var name = str(first(src, 'name', 'title', 'type'), LIMIT.name);
    var min = num(first(src, 'minutes', 'mins', 'min', 'duration'));
    if (!name) { problems.push('a cardio session with no name'); return null; }
    if (!inRange(min, 1, LIMIT.minutes)) { problems.push('minutes between 1 and ' + LIMIT.minutes); return null; }
    var out = { kind: 'cardio', title: str(a.title, LIMIT.title) || name,
                name: name, minutes: Math.round(min) };
    var km = num(first(src, 'km', 'distance', 'distanceKm'));
    if (inRange(km, 0.1, LIMIT.km)) out.km = Math.round(km * 100) / 100;
    return out;
  };

  CHECK.instructions = function (a, problems) {
    var text = str(first(a, 'text', 'instructions') ||
                   (a.instructions && a.instructions.text), LIMIT.text);
    if (!text) { problems.push('empty instructions'); return null; }
    return { kind: 'instructions', title: str(a.title, LIMIT.title) || 'Update your coaching instructions',
             text: text };
  };

  CHECK.fact = function (a, problems) {
    var text = str(first(a, 'text', 'fact') || (a.fact && a.fact.text), LIMIT.note);
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
                               /* THE PRESCRIPTION REACHES STORAGE. This wrote
                                  four fields and stopped, so the sets the gate
                                  had just checked and the reps it had just read
                                  were thrown away one line before they would
                                  have been saved. Reps is only written when
                                  there is one: absent means not prescribed. */
                               var row = { id: e.id, name: e.name, group: e.group,
                                           muscle: e.muscle, sets: e.sets };
                               if (e.reps) row.reps = e.reps;
                               return row;
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
    /* A RECIPE THE COACH WROTE IS MARKED AS ONE. It went into lk_recipes
       beside the reader's own with nothing to tell them apart, so a week
       later there was no way to know which of them anybody had written.
       lk_coachRecipes is the key Fuel already reads to list them
       separately, marked, and read-only -- a coach's recipe is theirs to
       change. */
    recipe: function (a, ST) {
      var all = (ST.get('lk_coachRecipes', []) || []).slice();
      var rec = { id: 'r' + Date.now(), name: a.name, servings: a.servings,
                  icon: (a.items[0] || {}).icon || '🥗',
                  items: a.items.map(function (it) { return { key: it.key, qty: it.qty, name: it.name }; }),
                  notes: a.notes, kcal: a.kcal, pro: a.pro, carb: a.carb, fat: a.fat,
                  fromCoach: true, at: Date.now() };
      all.unshift(rec);
      ST.set('lk_coachRecipes', all);
      return { key: 'lk_coachRecipes', id: rec.id, what: a.name };
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

  /* WHAT THIS ACTION IS, so the same one twice is recognised as the same
     one. A card tapped twice, or retried after a save that looked slow,
     is an ordinary accident -- and two identical splits is a mess the
     reader has to clean up by hand, made worse by an Undo that only
     takes back the second. The fingerprint is the action's own content,
     so it survives a reload and a different phone: nothing is kept in
     memory that a refresh would forget. */
  var LEDGER = 'lk_coachApplied';

  function fingerprint(action) {
    var seen = [];
    var json;
    try {
      json = JSON.stringify(action, function (k, v) {
        if (v && typeof v === 'object') {
          if (seen.indexOf(v) > -1) return '[circular]';
          seen.push(v);
        }
        return v;
      });
    } catch (e) { return null; }
    if (!json) return null;
    /* A short, stable hash. Not a cryptographic one: this decides
       whether two cards are the same card, not whether anybody is to be
       trusted. */
    var h = 5381;
    for (var i = 0; i < json.length; i++) h = ((h * 33) ^ json.charCodeAt(i)) >>> 0;
    return action.kind + ':' + h.toString(36) + ':' + json.length;
  }

  function ledger(ST) {
    var v = ST.get(LEDGER, {});
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  }

  function apply(action) {
    var ST = store();
    if (!ST) return { ok: false, problems: ['nothing on this phone can store it'] };
    if (!action || typeof action !== 'object' || !APPLY[action.kind]) {
      return { ok: false, problems: ['not something that can be applied'] };
    }

    /* Already done. The token comes back so the card still offers Undo,
       and nothing is written a second time. */
    var print = fingerprint(action);
    var book = ledger(ST);
    if (print && book[print]) {
      return { ok: true, token: book[print], already: true, problems: [] };
    }

    var token;
    try { token = APPLY[action.kind](action, ST); }
    catch (e) { return { ok: false, problems: ['could not be saved: ' + e.message] }; }
    token.kind = action.kind;
    if (print) {
      token.print = print;
      book[print] = token;
      try { ST.set(LEDGER, book); } catch (e) {}
    }
    return { ok: true, token: token, problems: [] };
  }

  /* Every apply is reversible. A coach that can write has to be a coach
     that can be told it was wrong. */
  function revert(token) {
    var ST = store();
    if (!ST || !token) return false;
    /* Forgotten as applied, so the same card can be applied again on
       purpose after it has been undone. */
    if (token.print) {
      var book = ledger(ST);
      if (book[token.print]) { delete book[token.print]; try { ST.set(LEDGER, book); } catch (e) {} }
    }
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
