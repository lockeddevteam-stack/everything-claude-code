/* ===================================================================
   LKCloud — the one seam between this app and a server.

   Every screen that wants to sign in, sync, ask the coach or know
   whether somebody is Pro goes through here, so there is exactly one
   place that knows a server exists and exactly one place to change when
   it does.

   LKCloud.ready() is false until a deploy sets window.LK_CLOUD, and
   every call refuses with a reason a screen can print. Nothing here
   pretends: a method that returned a plausible answer with no server
   behind it would make the app impossible to tell apart from a working
   one, which is the failure this whole build is written against.

   To configure, before the screens load:

     window.LK_CLOUD = {
       supabaseUrl: 'https://<ref>.supabase.co',
       supabaseKey: '<anon or publishable key>',   // public by design
       apiUrl:      'https://<worker>.workers.dev'
     };

   coachUrl is optional and defaults to apiUrl, which is where the
   Worker answers a chat.

   The anon key is meant to be in the client; row level security is what
   protects the data, not the secrecy of that string. Nothing else goes
   in here -- no service role key, no model key. The model key lives on
   the Worker, which is the only reason the Worker exists.

   WHAT THE SERVER ACTUALLY IS, so this file can be checked against it:
     user_data   one row per key per person, unique on (user_id, key),
                 value jsonb, changed_at bigint device clock, RLS
                 auth.uid() = user_id.
     store_push  an RPC that takes rows and writes each one only when it
                 is newer than the row already there.
     profiles    subscription_status, current_plan, plan_expires_at,
                 trial_ends_at. Written by the payment webhook with the
                 service key. The client only ever reads it.
     Worker      POST / for the coach, answering { content: [{ text }] },
                 and DELETE /user/delete for an account.
   =================================================================== */
(function (g) {
  'use strict';

  function cfg() { return g.LK_CLOUD || null; }
  function ST() { return g.LKStore || null; }

  var NOT_READY = {
    ok: false,
    error: 'not_configured',
    message: 'This build has no server. Nothing has left this device.'
  };

  /* ---- session ----------------------------------------------------
     The token lives in memory and in one key, and is the only thing
     here that is secret. A screen never reads it: it asks for headers. */
  var TOKEN_KEY = 'lk_session';

  /* WHAT "SIGNED IN" MEANS.

     A Supabase access token lasts an hour. This read an expired one as
     nobody being signed in, so the app quietly logged you out about once
     an hour and every screen that needs an account started behaving like
     a fresh install -- while the refresh token that would have fixed it
     sat in the same object, unused. The word refresh_token did not
     appear in this file.

     A session is now gone only when there is nothing to refresh with.
     An expired access token is a session that needs a new token, which
     is a different thing and one the caller never has to know about. */
  function session() {
    var s = raw();
    if (!s || !s.access_token) return null;
    if (expired(s) && !s.refresh_token) return null;
    return s;
  }

  function raw() {
    return ST() ? ST().get(TOKEN_KEY, null) : null;
  }

  /* Thirty seconds early, because a token that expires while the request
     is in the air fails just as hard as one that expired a minute ago. */
  function expired(s, skewMs) {
    if (!s || !s.expires_at) return false;
    return Date.now() + (skewMs || 30000) > s.expires_at * 1000;
  }

  /* The wall clock is not in the token. Supabase returns expires_in and
     an expires_at that some flows omit, so it is computed here rather
     than trusted to be present. */
  function stamp(d) {
    if (!d) return d;
    if (!d.expires_at && d.expires_in) {
      d.expires_at = Math.floor(Date.now() / 1000) + Number(d.expires_in);
    }
    return d;
  }

  /* ONE REFRESH AT A TIME. Every screen asks for headers at once on a
     cold start, and six parallel refreshes with the same token means
     five of them are spending a token that has already been rotated --
     Supabase issues a new refresh token each time and retires the old
     one, so the losers of that race sign you out. They all wait on the
     same promise instead. */
  var refreshing = null;

  function refresh() {
    if (refreshing) return refreshing;
    var s = raw();
    var c = cfg();
    if (!s || !s.refresh_token || !c || !c.supabaseUrl) {
      return Promise.resolve(null);
    }
    refreshing = fetch(c.supabaseUrl + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: c.supabaseKey || '' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok && j && j.access_token) {
          setSession(stamp(j));
          return j;
        }
        /* REFUSED, NOT UNREACHABLE. A refresh token Supabase rejects is
           spent or revoked and will never work again, so the session is
           cleared and the person signs in once. A refresh that failed on
           the network is kept: signing somebody out because their train
           went into a tunnel is the bug this whole function exists to
           stop. */
        if (r.status >= 400 && r.status < 500) setSession(null);
        return null;
      });
    }, function () { return null; });
    refreshing.then(function () { refreshing = null; },
                    function () { refreshing = null; });
    return refreshing;
  }

  /* Called before anything that needs a token. Cheap when the token is
     good: one comparison and no request. */
  function fresh() {
    var s = raw();
    if (!s || !s.access_token) return Promise.resolve(null);
    if (!expired(s)) return Promise.resolve(s);
    if (!s.refresh_token) return Promise.resolve(null);
    return refresh().then(function () { return session(); });
  }
  function setSession(s) {
    if (!ST()) return;
    if (s) ST().set(TOKEN_KEY, stamp(s)); else ST().remove(TOKEN_KEY);
  }

  function headers(extra) {
    var c = cfg(), s = session(), h = { 'content-type': 'application/json' };
    if (c && c.supabaseKey) h.apikey = c.supabaseKey;
    if (s) h.authorization = 'Bearer ' + s.access_token;
    Object.keys(extra || {}).forEach(function (k) { h[k] = extra[k]; });
    return h;
  }

  /* THE WORKER IS NOT SUPABASE, AND MUST NOT BE SENT SUPABASE'S HEADERS.

     `apikey` is Supabase's project key. It was going out on every call
     including the ones to the Worker, and that is not merely untidy: a
     custom header makes the browser send a CORS preflight first, the
     Worker's preflight allows `Content-Type, Authorization` and nothing
     else, so the preflight failed and the real request was never sent.
     Every Worker-backed feature in Fuel -- food search, the meal photo,
     the receipt reader, the pantry scan -- was blocked in the browser
     before it left the phone, and each one catches its own failure and
     renders an empty result, so all of it looked like "no data" rather
     than like an error. Nothing on the server could have fixed it.

     The Worker does read `Authorization`: that is how it knows who you
     are and what your daily limit is. It never reads `apikey` at all. */
  /* BY PATH, NOT BY HOST. Judging this on the apiUrl prefix looked
     right and was wrong: a deployment can serve Supabase and the Worker
     from the same origin -- the test mirror does exactly that -- and
     then every Supabase call matched too and lost the project key it
     cannot work without. Supabase's own paths are fixed and few; the
     Worker is everything else. */
  var SUPABASE_PATHS = /^\/(auth|rest|storage|realtime|functions)\/v1(\/|$)/;
  var SOURCE_NAME = {
    usda: 'USDA',
    off: 'Open Food Facts',
    fatsecret: 'FatSecret',
    /* Not a database at all: figures a model worked out because no
       database had the food. Named plainly so the row can say so. */
    estimate: 'Estimate'
  };

  /* ------------------------------------------------------------------
     A FOOD DATABASE WRITES FOR A FILING CABINET, NOT FOR A PERSON.

     USDA calls a chicken breast "Chicken, broilers or fryers, breast,
     meat only, cooked, roasted", and a strip steak "Beef, loin, top loin
     steak, boneless, lip off, separable lean only, trimmed to 0 fat,
     select, cooked, grilled". Those went straight onto the row, so a
     search for chicken returned a wall of near-identical sentences and
     you had to read to the end of each one to tell them apart.

     This turns them back into names. The shelf heading goes -- "fish
     salmon" is not a thing anybody says -- and so do the butchery
     section, the grade, the trim and the packaging boilerplate. A
     modifier that belongs in front is moved there, so "Bread, french"
     becomes "French bread". And the one state word that matters is kept,
     because cooked chicken and raw chicken are different foods and that
     is exactly the distinction somebody scanning a list is looking for.

     The database's own words are not thrown away: they stay on the row
     as `fullName`, because they are the record of what was looked up
     even when they are unreadable.
     ------------------------------------------------------------------ */
  var NAME_NOISE = [
    /\bseparable lean (and fat|only)\b/g, /\btrimmed to [^,]*/gi,
    /\b(all )?(commercial varieties|grades)\b/g, /\bbroilers or fryers\b/gi,
    /\bmeat (only|and skin)\b/g, /\blip off\b/g, /\bboneless\b/gi,
    /\b(select|choice|prime)\b/g, /\bns as to [^,]*/gi,
    /\b(un)?enriched\b/g, /\bregular\b/g, /\bwithout( added)? [^,]*/gi,
    /\bwith(out)? salt( added)?\b/g, /\bfresh\b/g, /\bflesh and skin\b/gi,
    /\bdry heat\b/g, /\bfarmed\b/g, /\bold fashioned\b/gi,
    /\bwhole grain\b/g, /\bstyle\b/g, /\blong-?grain\b/gi,
    /\bincludes[^)]*/g, /\bupc:?\s*\d+/gi,
    /\b\d+(\.\d+)?%\s*milkfat\b/g, /\b(tap|drinking|bottled)\b/gi,
    /\bwith salt\b/g, /\blow sodium\b/gi
  ];
  var NAME_STATE = ['raw', 'cooked', 'roasted', 'grilled', 'baked', 'boiled',
                    'fried', 'steamed', 'braised', 'dry roasted', 'smoked'];
  /* A trailing word that reads better in front. */
  var NAME_LEADS = ['french', 'italian', 'greek', 'white', 'brown', 'wholemeal',
                    'whole wheat', 'plain', 'nonfat', 'skimmed', 'russet',
                    'cheddar', 'whole', 'skim', 'red', 'green', 'rolled',
                    'atlantic', 'smooth', 'crunchy', 'dried', 'frozen',
                    'canned', 'sweet'];
  /* Shelf headings and butchery sections: the cut that follows names the
     food, the section it came off does not. */
  var NAME_CATEGORY = ['beverages', 'nuts', 'fish', 'seeds', 'snacks', 'sweets',
    'soups', 'sauces', 'spices and herbs', 'legumes', 'vegetables', 'fruits',
    'baked products', 'poultry products', 'beef products', 'pork products',
    'fast foods', 'restaurant foods', 'cereal grains', 'dairy and egg products',
    'finfish', 'shellfish', 'game meat',
    'loin', 'short loin', 'rib', 'round', 'chuck', 'flank', 'shank',
    'brisket', 'plate', 'sirloin', 'leg', 'shoulder'];

  /* Places and peoples keep their capital wherever they land in a name. */
  var NAME_PROPER = ['greek', 'french', 'italian', 'atlantic', 'pacific',
    'mexican', 'spanish', 'english', 'swiss', 'german', 'japanese', 'thai',
    'chinese', 'indian', 'brazilian', 'york', 'new', 'jersey', 'danish',
    'belgian', 'cajun', 'sicilian', 'moroccan', 'korean', 'vietnamese'];

  /* SHOUTING IS NOT A NAME, but neither is flattening one. Only an
     all-capitals string is recased; anything else keeps the capitals it
     came with, because "New York", "Big Mac" and "Coca-Cola" are how
     those things are spelled. A blanket lowercasing pass made the list
     look wrong in a way no amount of shortening makes up for. */
  function nameDecase(v) {
    if (!/[a-z]/.test(v) && /[A-Z]/.test(v)) {
      return v.charAt(0) + v.slice(1).toLowerCase();
    }
    return v;
  }

  function prettyFood(raw) {
    var original = String(raw || '').trim();
    if (!original) return '';
    var s = original.replace(/\([^)]*\)/g, ' ');
    var hitNoise = false;
    for (var n = 0; n < NAME_NOISE.length; n++) {
      if (NAME_NOISE[n].test(s)) hitNoise = true;
      s = s.replace(NAME_NOISE[n], ' ');
    }
    /* A name with no filing-cabinet grammar in it is already a name, and
       is left exactly as written apart from shouting. */
    if (!hitNoise && original.indexOf(',') < 0) return nameDecase(original);

    var parts = s.split(',').map(function (p) {
      return p.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
    /* "french or vienna" is one food offered two ways; take the first. */
    parts = parts.map(function (p) { return p.split(/\s+or\s+/i)[0].trim(); })
                 .filter(Boolean);
    var lc = function (p) { return p.toLowerCase(); };
    var states = [];
    parts = parts.filter(function (p) {
      if (NAME_STATE.indexOf(lc(p)) >= 0) { states.push(lc(p)); return false; }
      return true;
    });
    if (parts.length > 1) {
      var kept = parts.filter(function (p) { return NAME_CATEGORY.indexOf(lc(p)) < 0; });
      if (kept.length) parts = kept;
    }
    /* WORD BOUNDARIES, not substrings: "milk" sits inside "milkfat", and a
       plain indexOf ate the word the food is actually called. */
    var holds = function (hay, needle) {
      return new RegExp('(^|\\s)' +
        needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|\\s)', 'i').test(hay);
    };
    parts = parts.filter(function (p, i) {
      return !parts.some(function (q, j) {
        return j !== i && q.length > p.length && holds(q, p);
      });
    });
    if (!parts.length) return nameDecase(original).slice(0, 60);
    while (parts.length > 1 &&
           NAME_LEADS.indexOf(lc(parts[parts.length - 1])) >= 0) {
      parts.unshift(parts.pop());
    }
    /* Five words is a name; more is a description. */
    var words = parts.join(' ').replace(/\s+/g, ' ').trim().split(' ');
    if (words.length > 5) words = words.slice(0, 5);
    /* THIS NAME WAS REBUILT, so its capitals are the database's sentence
       casing rather than anybody's intent: USDA capitalises the first word
       of every comma segment, and once the segments are reordered those
       capitals land mid-phrase -- "French Bread", "Smooth Peanut butter".
       Everything goes down except the genuinely proper words, and the
       first, which starts the name. */
    words = words.map(function (w) {
      return NAME_PROPER.indexOf(w.toLowerCase()) >= 0
        ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        : w.toLowerCase();
    });
    var name = words.join(' ');
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (states.length) name += ', ' + states[states.length - 1];
    return name;
  }

  function isWorker(url) {
    var path;
    try { path = new URL(String(url), 'https://x.invalid').pathname; }
    catch (e) { return false; }
    return !SUPABASE_PATHS.test(path);
  }

  /* Only what the Worker's own preflight allows. */
  function workerHeaders(extra) {
    var s = session(), h = { 'content-type': 'application/json' };
    if (s) h.authorization = 'Bearer ' + s.access_token;
    Object.keys(extra || {}).forEach(function (k) { h[k] = extra[k]; });
    return h;
  }

  /* The right headers for whichever end this is, so no call site has to
     remember which server it is talking to. */
  function headersFor(url, extra) {
    return isWorker(url) ? workerHeaders(extra) : headers(extra);
  }

  function fail(e) {
    /* A network that is not there and a server that said no are different
       things, and a screen that conflates them tells somebody to check
       their connection when the real answer is that they are signed out. */
    return { ok: false, error: 'network', message: 'Could not reach the server.', detail: String(e && e.message || e) };
  }

  /* The three keys that never leave without the switch. Named once so
     push and pull cannot drift apart on what counts as the cycle log. */
  var CYCLE_KEYS = { lk_mcProfile: 1, lk_mcDays: 1, lk_mcFuelAdjust: 1 };

  /* The schedule is kept in the reader's own timezone, because a reminder
     at 07:30 means 07:30 where they are. */
  function tz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }

  /* A VAPID key travels as base64url text and the browser wants bytes. */
  function b64url(s) {
    var pad = '='.repeat((4 - s.length % 4) % 4);
    var raw = g.atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function coachEndpoint() {
    var c = cfg() || {};
    return c.coachUrl || String(c.apiUrl || '').replace(/\/$/, '') + '/';
  }

  var FREE_TIER = { tier: 'free', status: 'none', trial_ends: null, renews_at: null };

  /* A profile row says subscription_status, current_plan and two dates.
     The rest of the app asks a simpler question, so the translation
     happens here rather than in eighteen screens.

     A trial that has run out is not Pro. The server's own status can lag
     a day behind the clock, so the date is checked here too and the
     stricter of the two answers wins. */
  function readEntitlement(p) {
    if (!p) return FREE_TIER;
    var now = Date.now();
    var trialEnds = p.trial_ends_at ? Date.parse(p.trial_ends_at) : 0;
    var planEnds = p.plan_expires_at ? Date.parse(p.plan_expires_at) : 0;
    var st = p.subscription_status || 'expired';
    var out = { tier: 'free', status: st, trial_ends: p.trial_ends_at || null,
                renews_at: p.plan_expires_at || null, plan: p.current_plan || null };
    if (st === 'active' || st === 'past_due') {
      /* past_due is still paid-for time somebody has already bought.
         Cutting it off the hour a card bounces punishes the wrong thing. */
      if (!planEnds || planEnds > now) { out.tier = 'pro'; out.status = 'active'; }
      return out;
    }
    if (st === 'trial' && trialEnds > now) { out.tier = 'pro'; out.status = 'trialing'; return out; }
    if (st === 'canceled' && planEnds > now) { out.tier = 'pro'; out.status = 'active'; return out; }
    return out;
  }

  /* ---- what the coach is told ------------------------------------
     The phrase "Return ONLY a JSON" is not decoration: the endpoint
     reads it and switches the model into structured mode. Losing it
     loses every action. */
  function systemPrompt(ctx) {
    ctx = ctx || {};
    var lines = [
      'You are the coach inside LOCKED, a training and nutrition app.',
      'You are talking to one person whose logged data is below. Everything you say is',
      'about them and their numbers, not about training in general.',
      '',
      'Return ONLY a JSON object of this shape and nothing else:',
      '{"reply":"what you say to them","actions":[]}',
      '',
      'Each action is one of:',
      '{"kind":"split","split":{"name":"","days":[{"name":"","exercises":[{"id":0,"name":"","sets":0,"reps":0}]}]}}',
      '{"kind":"goal","goal":{"title":"","target":0,"unit":"","by":"YYYY-MM-DD"}}',
      '{"kind":"recipe","recipe":{"name":"","servings":1,"items":[{"name":"","grams":0}],"steps":[""]}}',
      '{"kind":"shopping","items":[{"name":"","qty":1,"unit":""}]}',
      '{"kind":"food","food":{"name":"","kcal":0,"protein":0,"carbs":0,"fat":0,"servings":1}}',
      '{"kind":"cardio","cardio":{"name":"","minutes":0,"km":0}}',
      '{"kind":"instructions","text":""}',
      '{"kind":"fact","text":""}',
      '',
      'Rules you cannot break:',
      '- Every exercise must be one from the catalogue below, by its id. Never invent an id or a lift.',
      '- Never state a total you have not been given. The app computes every total itself.',
      '- Send actions only when they were asked for. A question gets a reply and an empty list.',
      '- actions is always present, even when empty.',
      '',
      'How to answer:',
      '- Open with the answer. No greeting, no restating the question, no sign-off.',
      '- Quote their own numbers with the unit, and say which session or day each came from.',
      '- Give one recommendation, not a menu. If two options are genuinely close, pick one and say in a clause why.',
      '- Say the next concrete step: the load, the reps, the grams, the day.',
      '- Under 120 words unless they asked for a plan or a breakdown.',
      '- Plain sentences. No markdown, no bullet characters, no headings, no emoji.',
      '- If a source you would need is missing below, say which one and what to turn on or log. Do not guess a number.',
      '- Never say "it depends", "everyone is different", "consult a professional" as the answer. Answer, then flag a real risk in one clause if one exists.',
      '- Never invent a number. If you estimate, say it is an estimate and show the arithmetic in the sentence.',
      '',
      'What you know about training:',
      '- Progress comes from adding reps or load to the same movement over weeks, not from new movements.',
      '- Hypertrophy runs on 10 to 20 hard sets per muscle per week, 5 to 30 reps, taken to RIR 0 to 3.',
      '- Strength runs on 1 to 6 reps at RIR 0 to 2, with enough rest between sets to repeat the effort.',
      '- Add load when every working set hits the top of its rep range at the target RIR. Otherwise add a rep.',
      '- Two sessions stalled at the same load is a stall. Change one thing: order, volume, rest, or a deload.',
      '- Deload by cutting sets, not by cutting load, and only when performance has actually dropped.',
      '- Soreness is not a measure of a session. Logged load, reps and RIR are.',
      '- A lift run first in a session outperforms the same lift run last. Order is a lever before volume is.',
      '- Pain in a joint changes the movement or the range. It does not change the effort.',
      '',
      'What you know about nutrition:',
      '- Weight change follows the calorie balance. Everything else follows the protein.',
      '- Protein 1.6 to 2.2 g per kg of body weight a day is where the evidence sits. More is not better.',
      '- Gaining runs about 0.25 to 0.5 percent of body weight a week. Cutting runs about 0.5 to 1 percent.',
      '- Judge a diet on a weekly average, never on one day. Water and food weight move the scale daily.',
      '- Fat under about 0.6 g per kg starts costing recovery. Carbs take whatever is left, and they fuel the sessions.',
      '- Creatine monohydrate 3 to 5 g a day is the one supplement with weight behind it. Caffeine works and costs sleep.',
      '- Sleep under 7 hours shows up as lost reps before it shows up anywhere else.',
      '',
      'Where the numbers below come from: the person chose which sources to share. A source',
      'that is absent is switched off or empty, never assume its contents.'
    ];
    if (ctx.today) lines.push('', 'Today is ' + ctx.today + '.');
    if (ctx.style) lines.push('', 'The voice they picked, hold it for the whole reply: ' + ctx.style);
    if (ctx.catalogue && ctx.catalogue.length) {
      lines.push('', 'The exercise catalogue, id and name:');
      lines.push(ctx.catalogue.map(function (e) {
        return e.id + ' ' + e.name;
      }).join('; '));
    }
    /* Each source, named in words first so the model knows what it is
       reading, then the data as it stands. A heading with nothing under
       it is never printed: an empty section reads as "they have none",
       which is a different claim from "they did not share it". */
    var sections = [
      ['profile',     'Who they are'],
      ['plan',        'The plan they are running'],
      ['training',    'Their training log: sessions newest first, and their best logged set per lift'],
      ['goals',       'Their goals'],
      ['weight',      'Their body weight log'],
      ['bodyfat',     'Their body fat readings, percent'],
      ['nutrition',   'Their nutrition: targets, the last days logged, and the average of those days'],
      ['supplements', 'What they take'],
      ['checkins',    'Their check-ins'],
      ['cycle',       'Their cycle tracking']
    ];
    sections.forEach(function (s) {
      var v = ctx[s[0]];
      if (v === null || v === undefined) return;
      if (Array.isArray(v) && !v.length) return;
      lines.push('', s[1] + ':', JSON.stringify(v));
    });
    if (ctx.instructions) lines.push('', 'Standing instructions they gave you, these outrank the style: ' +
      String(ctx.instructions).slice(0, 2000));
    if (ctx.memory) lines.push('', 'What you know about them from earlier: ' + String(ctx.memory).slice(0, 2000));
    return lines.join('\n');
  }

  /* Models put JSON in fenced blocks, in prose, or not at all. Each of
     those is recoverable except the last, and the last is a reply with
     no actions rather than an error: the gate refuses bad actions, so
     the only thing this needs to be is honest about what it found. */
  function envelope(text) {
    var raw = String(text || '').trim();
    var body = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    var tries = [body];
    var first = body.indexOf('{'), last = body.lastIndexOf('}');
    if (first > 0 && last > first) tries.push(body.slice(first, last + 1));
    for (var i = 0; i < tries.length; i++) {
      try {
        var o = JSON.parse(tries[i]);
        if (o && typeof o === 'object' && !Array.isArray(o)) {
          return {
            reply: typeof o.reply === 'string' ? o.reply : raw,
            actions: Array.isArray(o.actions) ? o.actions : []
          };
        }
      } catch (e) { /* not this one */ }
    }
    return { reply: raw, actions: [] };
  }

  /* EVERY AUTHED REQUEST, THROUGH ONE DOOR.

     Two things have to happen around a call that carries a token, and
     doing them at ten call sites means nine of them drift. The token is
     made fresh before the request goes out, and a 401 that comes back
     anyway gets one refresh and one retry -- because a token can expire
     between the check and the server reading it, and because a clock
     that is a minute out makes that the normal case rather than a rare
     one.

     One retry, not a loop: if the second 401 comes back the refresh is
     not working and repeating it only delays telling somebody. */
  function authed(run) {
    return fresh().then(function () {
      return run();
    }).then(function (res) {
      if (!res || res.status !== 401) return res;
      if (!raw() || !raw().refresh_token) return res;
      return refresh().then(function (got) {
        return got ? run() : res;
      });
    });
  }

  function post(url, body, opts) {
    return authed(function () {
      return fetch(url, { method: 'POST', headers: headersFor(url, (opts || {}).headers),
                          body: JSON.stringify(body) });
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) {
            /* `error` IS THE FIELD THE SERVER USES. This read message,
               error_description and msg -- none of which the Worker
               writes -- so every reason it gave was thrown away and
               replaced with "The server refused that."

               That sentence is the reason a dead API key looked
               identical to a spent quota, a malformed request and an
               outage, and it is why somebody staring at a broken coach
               had nothing to tell anyone. The Worker says what went
               wrong on every route; this now prints it. */
            /* ORDER MATTERS, because two servers answer this app and they
               use `error` for opposite things. Supabase follows the OAuth
               convention where `error` is a MACHINE CODE -- "invalid_grant"
               -- and the sentence is in error_description. The Worker has
               no such convention and puts its sentence in `error`.

               Reading `error` first turned "Wrong email or password" into
               "invalid_grant" on every failed sign-in. So the fields that
               are always prose are read first, and `error` is taken only
               when it reads like a sentence rather than a code: a space
               is the difference between "invalid_grant" and "The server's
               Google key is not allowed to call Gemini". */
            var code = typeof j.error === 'string' ? j.error : '';
            var said = j.message || j.error_description || j.msg ||
                       (code.indexOf(' ') > 0 ? code : '');
            /* `why` is the machine-readable tag the Worker attaches
               beside the sentence; kept for the caller, not shown. */
            return { ok: false, error: 'server', status: r.status,
                     why: j.why || '',
                     message: said || ('The server refused that (' + r.status + ').'),
                     body: j };
          }
          return { ok: true, data: j };
        });
      }, fail);
  }

  var API = {
    /* Is there a server at all? Every screen asks this before offering
       anything that needs one. */
    ready: function () {
      var c = cfg();
      return !!(c && c.supabaseUrl && c.supabaseKey);
    },
    coachReady: function () { var c = cfg(); return !!(c && (c.coachUrl || c.apiUrl)); },
    signedIn: function () { return !!session(); },
    user: function () { var s = session(); return s ? (s.user || null) : null; },

    /* ---- accounts ------------------------------------------------- */
    signUp: function (email, password) {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      return post(cfg().supabaseUrl + '/auth/v1/signup', { email: email, password: password })
        .then(function (r) {
          if (r.ok && r.data && r.data.access_token) setSession(r.data);
          return r;
        });
    },
    signIn: function (email, password) {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      return post(cfg().supabaseUrl + '/auth/v1/token?grant_type=password',
                  { email: email, password: password })
        .then(function (r) {
          if (r.ok && r.data && r.data.access_token) setSession(r.data);
          return r;
        });
    },
    resetPassword: function (email) {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      return post(cfg().supabaseUrl + '/auth/v1/recover', { email: email });
    },
    /* A confirmation email that never arrived is the one thing between
       somebody and an account they have already made, and the only way
       back in. It is its own endpoint, not a second sign-up: signing up
       again with the same address is an error, not a resend. */
    resend: function (email) {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      return post(cfg().supabaseUrl + '/auth/v1/resend', { type: 'signup', email: email });
    },

    signOut: function () {
      /* Local first, always. A sign-out that fails on the network and
         leaves somebody signed in on a shared phone is the wrong way
         round to fail. */
      setSession(null);
      if (!API.ready()) return Promise.resolve({ ok: true });
      return post(cfg().supabaseUrl + '/auth/v1/logout', {}).then(function () { return { ok: true }; },
                                                                  function () { return { ok: true }; });
    },

    /* Changing a password is the server's to do: the rules a screen can
       check are about the new one, and whether the old one is right is a
       question only the account can answer. Supabase re-authenticates the
       session first, so a stolen unlocked phone cannot change it blind. */
    changePassword: function (current, next) {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      var s = session();
      if (!s) return Promise.resolve({ ok: false, error: 'signed_out', message: 'Sign in first.' });
      var email = s.user && s.user.email;
      if (!email) return Promise.resolve({ ok: false, error: 'signed_out', message: 'Sign in first.' });
      return post(cfg().supabaseUrl + '/auth/v1/token?grant_type=password',
                  { email: email, password: current })
        .then(function (r) {
          if (!r.ok) {
            return { ok: false, error: 'wrong_password',
                     message: 'That is not the password you use now.' };
          }
          if (r.data && r.data.access_token) setSession(r.data);
          return fetch(cfg().supabaseUrl + '/auth/v1/user',
                       { method: 'PUT', headers: headers(), body: JSON.stringify({ password: next }) })
            .then(function (res) {
              return res.json().catch(function () { return {}; }).then(function (j) {
                return res.ok ? { ok: true }
                              : { ok: false, error: 'server',
                                  message: j.msg || j.message || 'The server refused that password.' };
              });
            }, fail);
        });
    },

    /* ---- sync -----------------------------------------------------
       Push what changed since the last push, pull what changed since
       the last pull, and let the newer edit win by the device clock.

       The table is user_data: one row per key per person, unique on
       (user_id, key), with RLS pinning every row to auth.uid(). Its
       updated_at is stamped by a trigger, so it records when the server
       heard rather than when somebody edited, and two phones cannot be
       ordered by it. changed_at carries the device's own clock and is
       what the conflict rule reads. LKStore.changedAt() is the other
       half; without it none of this is decidable. */
    lastSync: function () { return Number(ST() ? ST().get('lk_lastSync', 0) : 0) || 0; },

    push: function () {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      if (!session()) return Promise.resolve({ ok: false, error: 'signed_out', message: 'Sign in to sync.' });
      var S = ST(), since = API.lastSync();
      var changed = S.changedSince(since), keys = S.syncKeys();
      /* THE CYCLE LOG ONLY LEAVES WITH CONSENT. lk_mcProfile, lk_mcDays and
         lk_mcFuelAdjust are in the sync set like everything else, and the
         Cycle screen has its own switch for whether they may be backed up.
         Without this the first sync would upload a cycle log somebody had
         explicitly declined to put anywhere -- the one key set in this app
         where that is not a bug but a breach. */
      var mc = S.get('lk_mcProfile', null);
      var cycleOk = !!(mc && mc.cloudBackup);
      var rows = [];
      keys.forEach(function (k) {
        if (!changed[k]) return;
        if (CYCLE_KEYS[k] && !cycleOk) return;
        /* A deletion is a row with deleted set, not a missing row: a key
           somebody removed has to travel, or it comes back on the next
           pull from the device that still has it. LKStore.removed is the
           only thing that tells a deletion from a key never written. */
        var gone = S.removed(k);
        rows.push({ key: k, value: gone ? null : S.get(k, null), changed_at: changed[k], deleted: gone });
      });
      if (!rows.length) return Promise.resolve({ ok: true, data: { pushed: 0 } });
      /* store_push resolves the whole conflict rule in one statement on the
         server: a row lands only when its changed_at beats the one already
         there. Sending the rows one at a time would let a half-finished
         sync leave a person's data in a state neither device holds. */
      return post(cfg().supabaseUrl + '/rest/v1/rpc/store_push', { rows: rows })
        .then(function (r) {
          if (r.ok) S.set('lk_lastSync', Date.now());
          return r.ok ? { ok: true, data: { pushed: rows.length, applied: Number(r.data) || 0 } } : r;
        });
    },

    pull: function () {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      if (!session()) return Promise.resolve({ ok: false, error: 'signed_out', message: 'Sign in to sync.' });
      var S = ST();
      /* THROUGH THE REFRESH. The pull is the request that decides
         whether an app on a phone that has been shut for a day still
         knows who you are, so it is the last one that should be sent
         with an hour-old token. */
      return authed(function () {
        return fetch(cfg().supabaseUrl + '/rest/v1/user_data?select=key,value,changed_at',
                     { headers: headers() });
      })
        .then(function (r) { return r.json(); }, fail)
        .then(function (rows) {
          if (!Array.isArray(rows)) return { ok: false, error: 'server', message: 'The server sent something unreadable.' };
          var applied = 0;
          var mc2 = S.get('lk_mcProfile', null);
          var cycleOk2 = !!(mc2 && mc2.cloudBackup);
          var mine = {};
          S.syncKeys().forEach(function (k) { mine[k] = 1; });
          var refused = 0;
          rows.forEach(function (row) {
            /* A ROW THAT IS NOT A ROW LOSES ONLY ITSELF. This read
               row.key straight off whatever the array held, so a single
               null in the answer threw inside the loop and took the
               whole sync with it -- every later row unapplied, and the
               same throw on every pull afterwards, because the row is
               still on the server. A pull has to be able to skip what it
               cannot read and go on.

               Rows like that are not exotic: a sync that died halfway, a
               row hand-edited in the dashboard, or one written by the
               reader's own second phone running a build this one has
               never seen. They all come through this door. */
            if (!row || typeof row !== 'object') { refused++; return; }
            if (typeof row.key !== 'string' || !row.key) { refused++; return; }
            /* A key this build does not sync is left alone rather than
               written. The table outlives any one version of the app, and
               a row from a newer build is not this build's to interpret. */
            if (!mine[row.key]) return;
            /* Consent governs both directions: a cycle log that reached the
               server before the switch was turned off does not come back. */
            if (CYCLE_KEYS[row.key] && !cycleOk2) return;
            /* The device's own copy wins when it is newer. This is the
               whole of the conflict rule and it is deliberately dumb:
               anything cleverer needs a merge per key, and a wrong merge
               loses work in a way a person cannot see. */
            if (S.changedAt(row.key) >= Number(row.changed_at || 0)) return;
            /* A null value is a tombstone. The row stays so the deletion
               itself syncs; treating it as a value would restore a thing
               somebody deleted on their other phone. */
            if (row.value === null || row.value === undefined) { S.remove(row.key); applied++; return; }
            /* AND A VALUE OF THE WRONG SHAPE IS NOT WRITTEN AT ALL. This
               wrote whatever arrived, so a history that came back as a
               string replaced a phone's real sessions with nineteen
               characters. get() would then hand every screen the empty
               fallback instead -- the screens survive, the work does not.
               Keeping what is on the phone is the only safe answer: the
               local copy is real work, and the server's is known to be
               unreadable. */
            if (!S.shapeOk(row.key, row.value)) { refused++; return; }
            S.set(row.key, row.value);
            applied++;
          });
          /* WHAT ARRIVED IS NOT NECESSARILY WHAT THIS BUILD READS. These
             rows were written by whatever version last held the account,
             and the shipped one stores several keys differently. The
             migrations already know how to convert them; they had simply
             already run, at boot, before any of this existed. */
          if (applied) { try { S.remigrate(); } catch (e) {} }
          /* `refused` is reported rather than swallowed. A row the phone
             cannot read is a real fact about the account, and a sync that
             silently drops work looks exactly like one that had nothing
             to do. */
          return { ok: true, data: { applied: applied, rows: rows.length, refused: refused } };
        });
    },

    sync: function () {
      return API.push().then(function (p) {
        if (!p.ok) return p;
        return API.pull().then(function (q) {
          return q.ok ? { ok: true, data: { pushed: p.data, pulled: q.data } } : q;
        });
      });
    },

    /* ---- entitlements ---------------------------------------------
       Read-only, and never cached as a yes. A stale "Pro" is somebody
       using something they stopped paying for; a stale "free" is a
       moment of friction. Fail closed.

       Subscription state lives on the profile row, written by the
       payment webhook with the service key. Nothing a person does in
       this app can make them Pro: the client only ever reads. */
    /* ---- WHO YOU ARE, BEYOND AN EMAIL ------------------------------
       A username and a picture live on the profile row, which RLS lets
       a person update for themselves and column grants limit to the
       three fields that are actually theirs. Nothing here can touch
       subscription_status: that is the server's to write and this end's
       to read. */
    profile: function () {
      var c = cfg();
      if (!API.ready()) return Promise.resolve(NOT_READY);
      if (!session()) {
        return Promise.resolve({ ok: false, error: 'signed_out',
          message: 'Sign in to see your profile.' });
      }
      return authed(function () {
        return fetch(c.supabaseUrl +
          '/rest/v1/profiles?select=id,email,display_name,username,avatar_url&limit=1',
          { headers: headers() });
      }).then(function (r) {
        return r.json().catch(function () { return []; }).then(function (rows) {
          var p = Array.isArray(rows) && rows[0];
          if (!p) return { ok: false, error: 'missing', message: 'No profile row yet.' };
          return { ok: true, data: { id: p.id, email: p.email,
                                     name: p.display_name || '',
                                     username: p.username || '',
                                     avatar: p.avatar_url || '' } };
        });
      }, fail);
    },

    /* The rules, in one place, so the field can say what is wrong while
       somebody types rather than after they submit. The database holds
       the same shape as a check constraint: this is the courtesy copy,
       not the enforcement. */
    usernameProblem: function (name) {
      var u = String(name || '').trim();
      if (!u) return 'Pick a username.';
      if (u.length < 3) return 'At least three characters.';
      if (u.length > 20) return 'Twenty characters at most.';
      if (!/^[a-zA-Z]/.test(u)) return 'Start with a letter.';
      if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Letters, numbers and underscores only.';
      return '';
    },

    /* IS IT FREE. A courtesy check, and it is only ever a courtesy: by
       the time somebody presses the button the answer may have changed,
       which is why claiming does not trust this and relies on the
       database's own uniqueness instead. */
    usernameFree: function (name) {
      var c = cfg();
      var bad = API.usernameProblem(name);
      if (bad) return Promise.resolve({ ok: false, error: 'shape', message: bad });
      if (!API.ready()) return Promise.resolve(NOT_READY);
      var u = String(name).trim().toLowerCase();
      return authed(function () {
        return fetch(c.supabaseUrl + '/rest/v1/reserved_usernames?select=name&name=eq.' +
                     encodeURIComponent(u), { headers: headers() });
      }).then(function (r) {
        return r.json().catch(function () { return []; });
      }).then(function (res) {
        if (Array.isArray(res) && res.length) {
          return { ok: true, data: { free: false, why: 'reserved',
            message: 'That one is reserved.' } };
        }
        return authed(function () {
          return fetch(c.supabaseUrl + '/rest/v1/profiles?select=id&username=ilike.' +
                       encodeURIComponent(u) + '&limit=1', { headers: headers() });
        }).then(function (r2) {
          return r2.json().catch(function () { return []; }).then(function (rows) {
            var taken = Array.isArray(rows) && rows.length > 0;
            var me = session() && rows[0] && rows[0].id === API.user() && API.user().id;
            return { ok: true, data: { free: !taken || !!me,
              why: taken ? 'taken' : '',
              message: taken ? 'Someone already has that one.' : 'That one is free.' } };
          });
        });
      }, fail);
    },

    /* CLAIMED BY THE DATABASE, NOT BY A CHECK.
       Asking "is it free" and then writing it are two statements, and
       between them somebody else can take the same name. The unique
       index decides; a 409 back from PostgREST means somebody won the
       race and is reported as taken rather than as a server error. */
    claimUsername: function (name) {
      var c = cfg();
      var bad = API.usernameProblem(name);
      if (bad) return Promise.resolve({ ok: false, error: 'shape', message: bad });
      if (!API.ready()) return Promise.resolve(NOT_READY);
      var s = session();
      if (!s) {
        return Promise.resolve({ ok: false, error: 'signed_out',
          message: 'Sign in to pick a username.' });
      }
      var u = String(name).trim();
      var me = API.user();
      if (!me || !me.id) {
        return Promise.resolve({ ok: false, error: 'signed_out',
          message: 'Sign in to pick a username.' });
      }
      return authed(function () {
        return fetch(c.supabaseUrl + '/rest/v1/profiles?id=eq.' + encodeURIComponent(me.id), {
          method: 'PATCH',
          headers: headers({ Prefer: 'return=representation' }),
          body: JSON.stringify({ username: u })
        });
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 409 || (j && j.code === '23505')) {
            return { ok: false, error: 'taken',
              message: 'Someone already has that one. Try another.' };
          }
          if (r.status === 400 && j && j.code === '23514') {
            return { ok: false, error: 'shape',
              message: 'Three to twenty characters, starting with a letter.' };
          }
          if (!r.ok) {
            return { ok: false, error: 'server',
              message: (j && (j.message || j.hint)) || 'That could not be saved.' };
          }
          var row = Array.isArray(j) ? j[0] : j;
          return { ok: true, data: { username: (row && row.username) || u } };
        });
      }, fail);
    },

    /* ---- A PICTURE -------------------------------------------------
       Straight to storage with the person's own token, into a folder
       named after their id, which is the only folder the bucket's
       policies let them write. The profile row then points at it.

       The old file is deleted after the new one is pointed at, not
       before: a failure halfway should leave somebody with their old
       picture rather than none. */
    uploadAvatar: function (dataUrl) {
      var c = cfg();
      if (!API.ready()) return Promise.resolve(NOT_READY);
      var me = API.user();
      if (!me || !me.id) {
        return Promise.resolve({ ok: false, error: 'signed_out',
          message: 'Sign in to set a picture.' });
      }
      var m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(dataUrl || ''));
      if (!m) {
        return Promise.resolve({ ok: false, error: 'shape',
          message: 'That is not an image this can store.' });
      }
      var type = m[1];
      var bytes;
      try {
        var bin = g.atob(m[2]);
        bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      } catch (e) {
        return Promise.resolve({ ok: false, error: 'shape',
          message: 'That image could not be read.' });
      }
      if (bytes.length > 2 * 1024 * 1024) {
        return Promise.resolve({ ok: false, error: 'too_big',
          message: 'That picture is too large. Two megabytes at most.' });
      }
      /* The name changes every time, so a phone or a CDN holding the old
         picture cannot show it in place of the new one. */
      var ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
      var path = me.id + '/' + Date.now() + '.' + ext;
      var base = c.supabaseUrl.replace(/\/$/, '');
      return authed(function () {
        var s = session();
        return fetch(base + '/storage/v1/object/avatars/' + path, {
          method: 'POST',
          headers: { 'content-type': type, apikey: c.supabaseKey || '',
                     authorization: 'Bearer ' + (s ? s.access_token : '') },
          body: bytes
        });
      }).then(function (r) {
        if (!r.ok) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            return { ok: false, error: 'server',
              message: (j && (j.message || j.error)) || 'The picture could not be uploaded.' };
          });
        }
        var url = base + '/storage/v1/object/public/avatars/' + path;
        return authed(function () {
          return fetch(base + '/rest/v1/profiles?id=eq.' + encodeURIComponent(me.id), {
            method: 'PATCH',
            headers: headers({ Prefer: 'return=minimal' }),
            body: JSON.stringify({ avatar_url: url })
          });
        }).then(function (r2) {
          if (!r2.ok) {
            return { ok: false, error: 'server',
              message: 'The picture uploaded but the profile would not point at it.' };
          }
          return { ok: true, data: { avatar: url, path: path } };
        });
      }, fail);
    },

    entitlement: function () {
      if (!API.ready() || !session()) {
        return Promise.resolve({ ok: true, data: FREE_TIER });
      }
      return fetch(cfg().supabaseUrl +
                   '/rest/v1/profiles?select=subscription_status,current_plan,plan_expires_at,trial_ends_at&limit=1',
                   { headers: headers() })
        .then(function (r) { return r.json(); }, fail)
        .then(function (rows) {
          var p = Array.isArray(rows) && rows[0] ? rows[0] : null;
          var e = readEntitlement(p);
          if (ST()) ST().set('lk_entitlement', e);
          return { ok: true, data: e };
        }, function () {
          return { ok: true, data: FREE_TIER };
        });
    },

    /* What the app may do right now. Reads the last known entitlement so
       a screen can paint without waiting, and free is the answer when
       nothing is known. */
    can: function (what) {
      var e = ST() ? ST().get('lk_entitlement', null) : null;
      var pro = !!(e && e.tier === 'pro' && (e.status === 'active' || e.status === 'trialing'));
      var FREE = { log: 1, splits: 1, fuel: 1, progress: 1, cycle: 1, stack: 1 };
      if (FREE[what]) return true;
      return pro;
    },

    /* ---- the coach -------------------------------------------------
       Returns the reply and the RAW actions. The caller passes them
       through LKCoachActions.checkAll before anything is shown: this
       function deliberately does no validation, so there is one place
       that decides what may touch somebody's data and it is on the
       device, where it can be read.

       The endpoint answers in the shape { content: [{ text }] }. The
       model is asked for a JSON envelope and usually sends one; when it
       does not, the whole answer is the reply and there are no actions.
       A coach that talks but changes nothing is a worse day than a
       crash, not a broken app. */
    ask: function (messages, context) {
      if (!API.coachReady()) {
        return Promise.resolve({ ok: false, error: 'not_configured',
          message: 'The coach needs a server, and this build has none.' });
      }
      var body = {
        system: systemPrompt(context || {}),
        messages: (messages || []).map(function (m) {
          var out = { role: m.role === 'assistant' ? 'assistant' : 'user',
                      content: String(m.content || '') };
          /* A PICTURE RIDES WITH THE TURN IT BELONGS TO. Rebuilding a
             message from role and content alone is exactly how the
             Worker lost it before, so the image is carried here too and
             only when it is one: anything else would be sent, refused,
             and take the question down with it. */
          if (m.image && /^data:image\/(jpeg|png|webp|heic|heif);base64,/.test(m.image)) {
            out.image = m.image;
          }
          return out;
        }),
        max_tokens: 3500
      };
      return post(coachEndpoint(), body).then(function (r) {
        if (!r.ok) return r;
        var d = r.data || {};
        var text = d.content && d.content[0] && d.content[0].text || '';
        /* The free tier is ten chats a day and the server, not this
           file, decides when that is spent. Saying so plainly beats a
           reply that reads like the coach lost interest. */
        if (d.gated) {
          return { ok: true, data: { reply: text, actions: [], gated: true, limit: d.limit || null } };
        }
        var parsed = envelope(text);
        /* The raw answer travels alongside the parsed one. The deployed
           Worker has a second protocol, sentinel markers in prose, and the
           coach screen's own parser reads those -- so when no JSON
           envelope came back there is still something to read rather than
           a reply with its actions silently dropped. */
        return { ok: true, data: { reply: parsed.reply, actions: parsed.actions,
                                   raw: text, gated: false, limit: null } };
      });
    },

    /* ---- food, from more than this build's own table ---------------
       The screen's table is a few dozen foods. A person eats things that
       are not in it, and until there was a server the honest answer was
       to say so. There is one now, so the search reaches it and the
       results say where they came from -- a looked-up food and a guess
       must never be drawn the same way. */
    /* The three the endpoint asks, in the words a reader would use. */
    /* ---- LOGGING A MEAL FROM A SENTENCE ------------------------------
       One call replaces search-pick-portion-repeat. The sentence goes up
       whole, the Worker reads it into foods and amounts and prices each
       one against the same databases the search used, and what comes
       back is a list of items ready to log.

       Every item says whether its figure is exact and, when it is not,
       which half was assumed: the food, the amount, or both. That flag
       is passed through untouched. A screen that dropped it would be
       showing a worked-out number and a measured one in the same type,
       which is the thing this whole route exists to avoid. */
    logMeal: function (text) {
      var c = cfg();
      var said = String(text || '').trim();
      if (!said) {
        return Promise.resolve({ ok: false, error: 'empty',
          message: 'Say or type what you ate.' });
      }
      if (!c || !c.apiUrl) {
        return Promise.resolve({ ok: false, error: 'not_configured',
          message: 'Working out a meal needs a server, and this build has none.' });
      }
      return post(c.apiUrl.replace(/\/$/, '') + '/log-meal', { text: said })
        .then(function (r) {
          if (!r.ok) return r;
          var d = r.data || {};
          var items = Array.isArray(d.items) ? d.items : [];
          if (!items.length) {
            return { ok: false, error: 'nofood', why: d.why || '',
                     message: d.error || 'No food found in that.' };
          }
          /* THE SAME NAME TIDYING THE SEARCH GOT. USDA answers in
             sentences -- "Beef, loin, top loin steak, boneless,
             separable lean only, trimmed to 0" -- and foodSearch has
             run those through prettyFood since the day a row from a
             database first reached the screen. This route returned the
             raw string, so the ordinary way of logging food showed the
             ugly name and the way nobody uses any more showed the clean
             one. The full name is kept beside it, because tidying is a
             judgement and the original should still be there. */
          items = items.map(function (it) {
            var nice = prettyFood(it.name);
            if (!nice || nice === it.name) return it;
            var copy = {};
            Object.keys(it).forEach(function (k) { copy[k] = it[k]; });
            copy.fullName = it.name;
            copy.name = nice.slice(0, 60);
            return copy;
          });
          return { ok: true, data: { items: items, totals: d.totals || null,
                                     text: d.text || said } };
        });
    },

    foodSearch: function (q) {
      var c = cfg();
      if (!c || !c.apiUrl) {
        return Promise.resolve({ ok: false, error: 'not_configured',
          message: 'Food search beyond this device needs a server.' });
      }
      var term = String(q || '').trim();
      if (term.length < 2) return Promise.resolve({ ok: true, data: [] });
      /* `src` is no longer a source to pick: the endpoint asks USDA,
         Open Food Facts and FatSecret together and hands back one
         ranked list. It is still sent so an older Worker -- one that
         gated on it and would otherwise return nothing -- keeps
         answering while a deploy rolls out. */
      var url = c.apiUrl.replace(/\/$/, '') + '/food-search?src=fatsecret&q=' + encodeURIComponent(term);
      return fetch(url, { headers: workerHeaders() })
        .then(function (r) { return r.ok ? r.json() : { items: [] }; }, fail)
        .then(function (j) {
          var items = (j && j.items) || [];
          if (!Array.isArray(items)) return { ok: true, data: [] };
          /* Normalised to the shape the food table already uses, per 100 g,
             which is what the endpoint returns. Nothing is invented: a row
             with no calories is dropped rather than shown as zero. */
          /* FIBRE, SUGAR, SATURATED FAT AND SODIUM, which this used to
             drop on the floor.

             Fuel tracks four micros and shows them against a target on
             the day screen. The shipped food table carries them, so a
             food typed by hand had them and a food from a database never
             did -- the row arrived with them and this mapping kept four
             fields out of eight. Nothing reported it: the micro row just
             read zero, which is a number, and looked like a food with no
             sodium in it rather than like a figure nobody had.

             Named differently by different sources, so both spellings are
             read. A missing one stays missing rather than becoming zero,
             because "no data" and "none of it" are not the same claim and
             the screen already knows how to say the first. */
          var micro = function (it, names) {
            for (var i = 0; i < names.length; i++) {
              var v = it[names[i]];
              if (typeof v === 'number' && isFinite(v)) return Math.round(v * 10) / 10;
              if (typeof v === 'string' && v !== '' && isFinite(Number(v))) {
                return Math.round(Number(v) * 10) / 10;
              }
            }
            return undefined;
          };
          return { ok: true, data: items.map(function (it) {
            var kcal = Math.round(Number(it.cal) || 0);
            if (!kcal) return null;
            var rawName = String(it.name || '').slice(0, 120);
            var row = {
              name: prettyFood(rawName).slice(0, 60),
              fullName: rawName,
              kcal: kcal,
              pro: Math.round((Number(it.pro) || 0) * 10) / 10,
              carb: Math.round((Number(it.carb) || 0) * 10) / 10,
              fat: Math.round((Number(it.fat) || 0) * 10) / 10,
              g: 100,
              brand: String(it.brand || '').slice(0, 40),
              /* WHERE THE FIGURES CAME FROM, kept rather than flattened.
                 Every row used to say "Food database" whichever of the
                 three answered, and Fuel's whole rule is that a number
                 says where it came from -- a USDA row and a crowd-edited
                 Open Food Facts row are not the same kind of fact. */
              from: it.brand ? String(it.brand).slice(0, 40) : SOURCE_NAME[it.src] || 'Food database',
              source: it.src || '',
              sourceName: SOURCE_NAME[it.src] || '',
              src: 'table'
            };
            var fib = micro(it, ['fibre', 'fiber', 'fib']);
            var sug = micro(it, ['sugar', 'sugars', 'sug']);
            var sat = micro(it, ['satfat', 'sat_fat', 'saturated', 'saturatedFat']);
            var sod = micro(it, ['sodium', 'sod', 'salt_mg']);
            if (fib !== undefined) row.fibre = fib;
            if (sug !== undefined) row.sugar = sug;
            if (sat !== undefined) row.satfat = sat;
            if (sod !== undefined) row.sodium = sod;
            return row;
          }).filter(Boolean) };
        }, function (e) {
          /* NOT THE SAME AS "NOTHING MATCHED". This returned an empty
             list on every failure, so a blocked request, a Worker with
             no FatSecret credentials, and a genuine miss all rendered
             the same empty sheet -- which is how a whole tab can be
             broken for weeks and look like a quiet search. A refusal
             says so, and the screen can tell the reader the lookup is
             unavailable rather than that their food does not exist. */
          return { ok: false, error: 'network', data: [],
                   message: 'Could not reach the food database.',
                   detail: String((e && e.message) || e) };
        });
    },

    /* ---- three lookups the app cannot do on its own ------------------ */

    /* Product names a shop is likely to carry, for the typeahead. NAMES
       ONLY: the endpoint returns a price beside each one and that price
       is a model's guess, not a shelf. Shopping compares what somebody
       has actually paid and says so, and a guessed price dropped into
       that would be indistinguishable from a real one. */
    storeSearch: function (query, store) {
      var c = cfg();
      if (!c || !c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured' });
      var q = String(query || '').trim();
      if (q.length < 2) return Promise.resolve({ ok: true, data: [] });
      return post(c.apiUrl.replace(/\/$/, '') + '/store-search',
                  { query: q, store: String(store || '').slice(0, 40) })
        .then(function (r) {
          var list = (r.ok && r.data && r.data.products) || [];
          if (!Array.isArray(list)) return { ok: true, data: [] };
          return { ok: true, data: list.slice(0, 12).map(function (p) {
            return String((p && p.name) || p || '').slice(0, 60);
          }).filter(Boolean) };
        }, function () { return { ok: true, data: [] }; });
    },

    /* What the catalogue knows about one lift beyond its name. The app
       ships id, name, group and muscle for all 866; this is the rest,
       when there is a feed behind it. */
    exerciseDetail: function (id) {
      var c = cfg();
      if (!c || !c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured' });
      var n = parseInt(id, 10);
      if (!(n > 0)) return Promise.resolve({ ok: false, error: 'empty' });
      return fetch(c.apiUrl.replace(/\/$/, '') + '/exercise-detail/' + n)
        .then(function (r) { return r.json(); }, fail)
        .then(function (j) {
          if (!j || j.error) {
            return { ok: false, error: 'unavailable',
                     message: 'No catalogue detail is configured for this build.' };
          }
          return { ok: true, data: j };
        });
    },

    /* One clip for one lift. A null id is the honest answer when there is
       no video key behind the endpoint, and the screen says so rather
       than showing an empty player. */
    formVideo: function (name, id) {
      var c = cfg();
      if (!c || !c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured' });
      if (!String(name || '').trim()) return Promise.resolve({ ok: false, error: 'empty' });
      return post(c.apiUrl.replace(/\/$/, '') + '/yt-search',
                  { name: String(name).slice(0, 80), exId: parseInt(id, 10) || 0 })
        .then(function (r) {
          var vid = r.ok && r.data && r.data.videoId;
          return vid ? { ok: true, data: String(vid) }
                     : { ok: false, error: 'none',
                         message: 'No clip is available for this lift.' };
        }, function () {
          return { ok: false, error: 'network', message: 'Could not reach the clip search.' };
        });
    },

    /* ---- reading a photo ---------------------------------------------
       Four endpoints, one shape: a data URL goes up, a JSON array comes
       back inside the same { content: [{ text }] } envelope the coach
       uses. Nothing here decides what to do with the answer -- every
       screen that calls this draws the result as an ESTIMATE, distinct
       from a looked-up figure, because the difference between the two is
       the difference between a number and a guess.

       A PHOTO IS THE MOST SENSITIVE THING THIS APP SENDS. Every caller
       asks first, on a sheet that names what leaves the device, and none
       of them sends anything without that. This function is the last
       place in the chain and deliberately not the one that decides. */
    /* ---- a recording, sent up to be written down --------------------
       The one call in this file that does not send JSON. A transcription
       goes up as multipart form data, and the browser writes its own
       content-type for that, boundary and all -- setting ours would make
       the body unreadable at the other end. So the Authorization header
       is added by hand here rather than through workerHeaders, which
       would put a JSON content-type on a form. */
    voiceReady: function () { var c = cfg(); return !!(c && c.apiUrl); },
    voice: function (blob) {
      var c = cfg();
      if (!c || !c.apiUrl) {
        return Promise.resolve({ ok: false, error: 'not_configured',
          message: 'Transcribing needs a server, and this build has none.' });
      }
      if (!blob || !blob.size) {
        return Promise.resolve({ ok: false, error: 'empty', message: 'There was no recording.' });
      }
      var form = new g.FormData();
      form.append('audio', blob, 'clip.wav');
      var s = session();
      var h = {};
      if (s) h.authorization = 'Bearer ' + s.access_token;
      return g.fetch(c.apiUrl.replace(/\/$/, '') + '/voice', {
        method: 'POST', headers: h, body: form
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          /* A spent allowance is not a broken microphone. */
          if (r.status === 429) {
            return { ok: false, error: 'limit',
              message: j.error || 'You have used what Free includes of this today.' };
          }
          if (!r.ok) {
            /* A 500 is the server saying something went wrong at ITS end,
               and its own words for that ("boom", a stack frame, an
               upstream's error code) are not something a person holding a
               phone can act on. They are kept as detail for a log and the
               reader gets a sentence. A 4xx is different: that one is
               usually about this request and worth repeating. */
            var says = j.error || j.message || '';
            return { ok: false, error: 'server', status: r.status, detail: says,
              message: r.status >= 500 || !says
                ? 'The server could not write that down just now. Try again, or type it.'
                : says };
          }
          if (j.error) return { ok: false, error: 'server', message: j.error };
          return { ok: true, data: j };
        });
      }, fail);
    },

    vision: function (kind, base64, opts) {
      var PATHS = { meal: '/analyze-meal', physique: '/analyze-physique',
                    receipt: '/parse-receipt', pantry: '/scan-pantry' };
      var path = PATHS[kind];
      var c = cfg();
      if (!path) return Promise.resolve({ ok: false, error: 'unknown', message: 'No such read.' });
      if (!c || !c.apiUrl) {
        return Promise.resolve({ ok: false, error: 'not_configured',
          message: 'Reading a photo needs a server, and this build has none.' });
      }
      if (!base64 && !(opts && opts.description)) {
        return Promise.resolve({ ok: false, error: 'empty', message: 'Nothing to read.' });
      }
      var body = {};
      if (base64) body.base64 = base64;
      if (opts && opts.description) body.description = opts.description;
      return post(c.apiUrl.replace(/\/$/, '') + path, body).then(function (r) {
        if (!r.ok) return r;
        var d = r.data || {};
        /* A spent free allowance comes back as a success with gated set,
           exactly as the coach's does. */
        if (d.gated) {
          return { ok: false, error: 'gated', gated: true,
                   message: d.error || 'You have used what Free includes of this.' };
        }
        if (d.error) return { ok: false, error: 'server', message: d.error };
        var text = (d.content && d.content[0] && d.content[0].text) || '';
        /* A plate and a pantry come back as an array of items; a receipt
           comes back as an object with a store, its lines and a total.
           Both are read out of prose the same way, and neither is guessed
           at: an answer that will not parse says so. */
        var parsed = null;
        function cut(open, close) {
          var a = text.indexOf(open), b = text.lastIndexOf(close);
          if (a < 0 || b <= a) return null;
          try { return JSON.parse(text.slice(a, b + 1)); } catch (e) { return null; }
        }
        try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
        if (parsed === null) parsed = cut('[', ']');
        if (parsed === null) parsed = cut('{', '}');
        if (parsed === null || typeof parsed !== 'object') {
          return { ok: false, error: 'unreadable',
                   message: 'The reading came back in a shape this screen could not use.',
                   raw: text };
        }
        return { ok: true, data: parsed, raw: text };
      });
    },

    /* ---- reminders --------------------------------------------------
       The notification switches in Settings were preferences with nothing
       behind them: turning one on changed a stored value and nothing ever
       arrived. The server holds the subscription and the schedule, keyed
       by a device id this file makes once and keeps, because a reminder
       belongs to a phone rather than to an account -- somebody signed in
       on two devices should not get every reminder twice on both.

       Everything here answers honestly when there is no server, when the
       browser has no push at all, and when permission was refused. Those
       are three different states and Settings prints a different sentence
       for each. */
    /* Named reminders, not push: LKCloud.push is already the outgoing half
       of the sync, and this quietly replaced it -- every sync in the app
       became a type error the moment this file loaded. */
    reminders: {
      supported: function () {
        return !!(g.navigator && g.navigator.serviceWorker && g.PushManager && g.Notification);
      },

      /* One id per phone, made once. It is not a secret and identifies
         nothing about a person: it is what the server keys a schedule by. */
      deviceId: function () {
        var S = ST();
        var id = S ? S.get('lk_pushDevice', null) : null;
        if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
          id = '';
          var abc = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          var n = 24, r = null;
          try { r = new Uint8Array(n); g.crypto.getRandomValues(r); } catch (e) { r = null; }
          for (var i = 0; i < n; i++) {
            id += abc.charAt(r ? (r[i] % abc.length) : Math.floor(Math.random() * abc.length));
          }
          if (S) S.set('lk_pushDevice', id);
        }
        return id;
      },

      key: function () {
        var c = cfg();
        if (!c || !c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured' });
        return fetch(c.apiUrl.replace(/\/$/, '') + '/push/key')
          .then(function (r) { return r.json(); }, fail)
          .then(function (j) {
            return j && j.publicKey ? { ok: true, data: j.publicKey }
                                    : { ok: false, error: 'server', message: 'No push key.' };
          });
      },

      subscribe: function () {
        var c = cfg(), P = API.reminders;
        if (!c || !c.apiUrl) {
          return Promise.resolve({ ok: false, error: 'not_configured',
            message: 'Reminders need a server, and this build has none.' });
        }
        if (!P.supported()) {
          return Promise.resolve({ ok: false, error: 'unsupported',
            message: 'This browser cannot receive reminders.' });
        }
        return P.key().then(function (k) {
          if (!k.ok) return k;
          /* Raced against a deadline on purpose. serviceWorker.ready does
           not reject when there is no worker to be ready -- it waits, and
           a screen waiting on it waits with it. Eight seconds is longer
           than a registration takes and shorter than somebody's patience. */
        var ready = new Promise(function (resolve, reject) {
          var done = false;
          g.navigator.serviceWorker.ready.then(function (reg) {
            if (!done) { done = true; resolve(reg); }
          });
          setTimeout(function () {
            if (!done) { done = true; reject(new Error('NoServiceWorker')); }
          }, 8000);
        });
        return ready.then(function (reg) {
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: b64url(k.data)
            });
          }).then(function (sub) {
            return post(c.apiUrl.replace(/\/$/, '') + '/push/subscribe', {
              deviceId: P.deviceId(),
              subscription: JSON.parse(JSON.stringify(sub)),
              tz: tz()
            });
          }, function (e) {
            /* A refusal and a failure are different, and a screen that
               says "something went wrong" to somebody who pressed Block
               is telling them to retry a decision they made. */
            var why = String((e && (e.name || e.message)) || e);
            if (why === 'NoServiceWorker') {
              return { ok: false, error: 'unsupported',
                       message: 'Reminders need LOCKED added to your home screen.' };
            }
            return { ok: false, error: why === 'NotAllowedError' ? 'denied' : 'browser',
                     message: why === 'NotAllowedError'
                       ? 'This phone is set to block notifications from LOCKED.'
                       : 'This browser refused to set reminders up.' };
          });
        });
      },

      prefs: function (prefs) {
        var c = cfg();
        if (!c || !c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured' });
        return post(c.apiUrl.replace(/\/$/, '') + '/push/prefs',
                    { deviceId: API.reminders.deviceId(), prefs: prefs || {}, tz: tz() });
      },

      test: function () {
        var c = cfg();
        if (!c || !c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured' });
        return post(c.apiUrl.replace(/\/$/, '') + '/push/test', { deviceId: API.reminders.deviceId() });
      },

      /* THE PROMPT THAT ARRIVES WHEN THE APP IS CLOSED. A workout left
         running is the one reminder that cannot come from a timer in the
         page: the page is gone. The server holds it, armed when a session
         starts and cancelled the moment it ends, so nobody who finished
         and put the phone away is asked whether they are still training. */
      armIdle: function (seconds) {
        var c = cfg();
        if (!c || !c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured' });
        var secs = Math.round(Number(seconds) || 0);
        if (!(secs >= 60 && secs <= 6 * 3600)) {
          return Promise.resolve({ ok: false, error: 'range',
            message: 'A prompt has to be between a minute and six hours away.' });
        }
        return post(c.apiUrl.replace(/\/$/, '') + '/push/idle',
                    { deviceId: API.reminders.deviceId(), seconds: secs });
      },

      cancelIdle: function () {
        var c = cfg();
        if (!c || !c.apiUrl) return Promise.resolve({ ok: true });
        return post(c.apiUrl.replace(/\/$/, '') + '/push/idle/cancel',
                    { deviceId: API.reminders.deviceId() })
          .then(function (r) { return r; }, function () { return { ok: true }; });
      },

      unsubscribe: function () {
        var c = cfg();
        if (!c || !c.apiUrl) return Promise.resolve({ ok: true });
        return post(c.apiUrl.replace(/\/$/, '') + '/push/unsubscribe',
                    { deviceId: API.reminders.deviceId() })
          .then(function (r) { return r; }, function () { return { ok: true }; });
      }
    },

    /* Delete the account and everything under it. The row cascade is on
       the server; this is here so there is one name for it. */
    deleteAccount: function () {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      if (!session()) return Promise.resolve({ ok: false, error: 'signed_out', message: 'Sign in first.' });
      var c = cfg();
      if (!c.apiUrl) return Promise.resolve({ ok: false, error: 'not_configured',
        message: 'This build cannot delete an account from here.' });
      return fetch(c.apiUrl.replace(/\/$/, '') + '/user/delete', { method: 'DELETE', headers: headers() })
        .then(function (r) {
          if (!r.ok) return { ok: false, error: 'server', status: r.status, message: 'The server refused that.' };
          setSession(null);
          return { ok: true };
        }, fail);
    }
  };

  g.LKCloud = API;

  /* ---- SYNC, WITHOUT BEING ASKED -----------------------------------
     NOTHING SYNCED UNLESS SOMEBODY FOUND THE BUTTON. sync() existed and
     was correct, and exactly one thing in the build called it: "Sync now"
     in Settings. A first run proved the cost -- signing up, answering
     setup and saving a workout made ZERO calls to store_push -- so a
     signed-in reader's profile, split and history sat on the one phone
     that wrote them. Reinstall, open a second device, or clear the site
     data, and an account that looked like it had been syncing all along
     had nothing in it.

     Signing in is the reader saying "keep this". This keeps it, at the
     moments a person would expect and none they would not:

       on becoming signed in   what is already on the phone belongs to
                               the account, so it goes up at once
       after a change settles  a debounce, not a write-through: logging a
                               set writes several keys in a second and
                               that is one push, not six
       when the page goes away pagehide and the hidden half of
                               visibilitychange, which on a phone is what
                               closing the app actually looks like

     Never on a timer, so a phone on a bench is silent. Never signed out,
     where push already refuses. Failures are swallowed on purpose: this
     runs behind whatever the reader is doing, and a push that could not
     reach the server is what the next one is for. Settings' button is
     unchanged -- it is this same one path, said out loud.

     trace() is kept because this is the subsystem whose failure mode is
     silence: when it does nothing, there is otherwise nothing to read. */
  var IDLE_MS = 3000;
  var idleTimer = null, inFlight = false, again = false, wasIn = null;
  var trace = [];
  function note(x) { if (trace.length < 40) trace.push(x); }

  function pushQuietly(why) {
    note('try:' + why + ':ready=' + API.ready() + ':in=' + !!session());
    if (!API.ready() || !session()) return;
    if (inFlight) { again = true; return; }
    inFlight = true;
    var done = function (r) {
      inFlight = false;
      note('done:' + (r && r.ok ? 'ok' : 'no') + ':' + JSON.stringify(r && (r.data || r.error)));
      if (again) { again = false; schedule(); }
    };
    try { API.push().then(done, function (e) { note('threw:' + e); done(null); }); }
    catch (e) { note('sync-threw:' + e); done(null); }
  }
  function schedule() {
    if (!API.ready() || !session()) return;
    if (idleTimer) { try { g.clearTimeout(idleTimer); } catch (e) {} }
    idleTimer = g.setTimeout(function () { idleTimer = null; pushQuietly('idle'); }, IDLE_MS);
  }
  function pushNow(why) {
    if (idleTimer) { try { g.clearTimeout(idleTimer); } catch (e) {} idleTimer = null; }
    pushQuietly(why || 'now');
  }
  function watchAuth() {
    var now = !!session();
    if (now === wasIn) return;
    wasIn = now;
    note('auth:' + now);
    if (now) pushNow('signed-in');
  }
  function start() {
    note('start:store=' + !!g.LKStore + ':ready=' + API.ready());
    if (!g.LKStore || !API.ready()) return;
    wasIn = !!session();
    try {
      g.LKStore.onChange(function (v, key) {
        if (key === 'lk_lastSync' || key === 'lk_session' || key === 'lk_changedAt') return;
        schedule();
      });
    } catch (e) { note('hook-threw:' + e); }
    try {
      g.addEventListener('pagehide', function () { pushNow('pagehide'); });
      g.document.addEventListener('visibilitychange', function () {
        if (g.document.visibilityState === 'hidden') pushNow('hidden');
      });
    } catch (e) {}
    try { g.setInterval(watchAuth, 1000); } catch (e) { note('interval-threw:' + e); }
    if (wasIn) pushNow('boot');
  }

  API.autoSync = { start: start, now: pushNow, schedule: schedule,
                   trace: function () { return trace.slice(); } };

  if (typeof g.document !== 'undefined') {
    if (g.document.readyState === 'loading') g.document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(typeof window !== 'undefined' ? window : this);
