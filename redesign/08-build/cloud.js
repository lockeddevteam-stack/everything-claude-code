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

  function session() {
    var s = ST() ? ST().get(TOKEN_KEY, null) : null;
    if (!s || !s.access_token) return null;
    if (s.expires_at && Date.now() > s.expires_at * 1000) return null;
    return s;
  }
  function setSession(s) {
    if (!ST()) return;
    if (s) ST().set(TOKEN_KEY, s); else ST().remove(TOKEN_KEY);
  }

  function headers(extra) {
    var c = cfg(), s = session(), h = { 'content-type': 'application/json' };
    if (c && c.supabaseKey) h.apikey = c.supabaseKey;
    if (s) h.authorization = 'Bearer ' + s.access_token;
    Object.keys(extra || {}).forEach(function (k) { h[k] = extra[k]; });
    return h;
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
    var lines = [
      'You are the coach inside LOCKED, a training and nutrition app.',
      'Answer in the second person, plainly, with no preamble and no markdown.',
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
      '- actions is always present, even when empty.'
    ];
    if (ctx.catalogue && ctx.catalogue.length) {
      lines.push('', 'The exercise catalogue, id and name:');
      lines.push(ctx.catalogue.map(function (e) {
        return e.id + ' ' + e.name;
      }).join('; '));
    }
    if (ctx.profile) lines.push('', 'About them: ' + JSON.stringify(ctx.profile));
    if (ctx.instructions) lines.push('', 'Standing instructions they gave you: ' + String(ctx.instructions).slice(0, 2000));
    if (ctx.memory) lines.push('', 'What you know about them: ' + String(ctx.memory).slice(0, 2000));
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

  function post(url, body, opts) {
    return fetch(url, { method: 'POST', headers: headers((opts || {}).headers), body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) {
            return { ok: false, error: 'server', status: r.status,
                     message: j.message || j.error_description || j.msg || 'The server refused that.', body: j };
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
    signOut: function () {
      /* Local first, always. A sign-out that fails on the network and
         leaves somebody signed in on a shared phone is the wrong way
         round to fail. */
      setSession(null);
      if (!API.ready()) return Promise.resolve({ ok: true });
      return post(cfg().supabaseUrl + '/auth/v1/logout', {}).then(function () { return { ok: true }; },
                                                                  function () { return { ok: true }; });
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
      return fetch(cfg().supabaseUrl + '/rest/v1/user_data?select=key,value,changed_at',
                   { headers: headers() })
        .then(function (r) { return r.json(); }, fail)
        .then(function (rows) {
          if (!Array.isArray(rows)) return { ok: false, error: 'server', message: 'The server sent something unreadable.' };
          var applied = 0;
          var mc2 = S.get('lk_mcProfile', null);
          var cycleOk2 = !!(mc2 && mc2.cloudBackup);
          var mine = {};
          S.syncKeys().forEach(function (k) { mine[k] = 1; });
          rows.forEach(function (row) {
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
            if (row.value === null || row.value === undefined) S.remove(row.key);
            else S.set(row.key, row.value);
            applied++;
          });
          return { ok: true, data: { applied: applied, rows: rows.length } };
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
          return { role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') };
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
    foodSearch: function (q) {
      var c = cfg();
      if (!c || !c.apiUrl) {
        return Promise.resolve({ ok: false, error: 'not_configured',
          message: 'Food search beyond this device needs a server.' });
      }
      var term = String(q || '').trim();
      if (term.length < 2) return Promise.resolve({ ok: true, data: [] });
      var url = c.apiUrl.replace(/\/$/, '') + '/food-search?src=fatsecret&q=' + encodeURIComponent(term);
      return fetch(url, { headers: headers() })
        .then(function (r) { return r.ok ? r.json() : { items: [] }; }, fail)
        .then(function (j) {
          var items = (j && j.items) || [];
          if (!Array.isArray(items)) return { ok: true, data: [] };
          /* Normalised to the shape the food table already uses, per 100 g,
             which is what the endpoint returns. Nothing is invented: a row
             with no calories is dropped rather than shown as zero. */
          return { ok: true, data: items.map(function (it) {
            var kcal = Math.round(Number(it.cal) || 0);
            if (!kcal) return null;
            return {
              name: String(it.name || '').slice(0, 80),
              kcal: kcal,
              pro: Math.round((Number(it.pro) || 0) * 10) / 10,
              carb: Math.round((Number(it.carb) || 0) * 10) / 10,
              fat: Math.round((Number(it.fat) || 0) * 10) / 10,
              g: 100,
              brand: String(it.brand || '').slice(0, 40),
              from: it.brand ? String(it.brand).slice(0, 40) : 'Food database',
              src: 'table'
            };
          }).filter(Boolean) };
        }, function () { return { ok: true, data: [] }; });
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
          return g.navigator.serviceWorker.ready.then(function (reg) {
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
            var why = String(e && e.name || e);
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
})(typeof window !== 'undefined' ? window : this);
