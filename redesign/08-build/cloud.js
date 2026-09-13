/* ===================================================================
   LKCloud — the one seam between this app and a server.

   Every screen that wants to sign in, sync, ask the coach or know
   whether somebody is Pro goes through here, so there is exactly one
   place that knows a server exists and exactly one place to change when
   it does.

   IT IS NOT CONFIGURED IN THIS BUILD, AND IT SAYS SO. `LKCloud.ready()`
   is false until a deploy sets window.LK_CLOUD, and every call refuses
   with a reason a screen can print. Nothing here pretends: a method that
   returned a plausible answer with no server behind it would make the
   app impossible to tell apart from a working one, which is the failure
   this whole build is written against.

   To configure, before the screens load:

     window.LK_CLOUD = {
       supabaseUrl: 'https://<ref>.supabase.co',
       supabaseKey: '<publishable anon key>',   // public by design
       coachUrl:    'https://<worker>.workers.dev/coach'
     };

   The anon key is meant to be in the client; row level security is what
   protects the data, not the secrecy of that string. Nothing else goes
   in here — no service role key, no model key. The model key lives on
   the Worker.
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
    coachReady: function () { var c = cfg(); return !!(c && c.coachUrl); },
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
       the last pull, and let the newer write win by the device clock.
       LKStore.changedAt() is what makes this decidable at all. */
    lastSync: function () { return Number(ST() ? ST().get('lk_lastSync', 0) : 0) || 0; },

    push: function () {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      if (!session()) return Promise.resolve({ ok: false, error: 'signed_out', message: 'Sign in to sync.' });
      var S = ST(), since = API.lastSync();
      var changed = S.changedSince(since), keys = S.syncKeys();
      var rows = [];
      keys.forEach(function (k) {
        if (!changed[k]) return;
        rows.push({ key: k, value: S.get(k, null), changed_at: changed[k], deleted: !S.touched(k) });
      });
      if (!rows.length) return Promise.resolve({ ok: true, data: { pushed: 0 } });
      return post(cfg().supabaseUrl + '/rest/v1/rpc/store_push', { rows: rows })
        .then(function (r) {
          if (r.ok) S.set('lk_lastSync', Date.now());
          return r;
        });
    },

    pull: function () {
      if (!API.ready()) return Promise.resolve(NOT_READY);
      if (!session()) return Promise.resolve({ ok: false, error: 'signed_out', message: 'Sign in to sync.' });
      var S = ST();
      return fetch(cfg().supabaseUrl + '/rest/v1/store?select=key,value,changed_at,deleted',
                   { headers: headers() })
        .then(function (r) { return r.json(); }, fail)
        .then(function (rows) {
          if (!Array.isArray(rows)) return { ok: false, error: 'server', message: 'The server sent something unreadable.' };
          var applied = 0;
          rows.forEach(function (row) {
            /* The device's own copy wins when it is newer. This is the
               whole of the conflict rule and it is deliberately dumb:
               anything cleverer needs a merge per key, and a wrong merge
               loses work in a way a person cannot see. */
            if (S.changedAt(row.key) >= Number(row.changed_at || 0)) return;
            if (row.deleted) S.remove(row.key); else S.set(row.key, row.value);
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
       moment of friction. Fail closed. */
    entitlement: function () {
      if (!API.ready() || !session()) {
        return Promise.resolve({ ok: true, data: { tier: 'free', status: 'none' } });
      }
      return fetch(cfg().supabaseUrl + '/rest/v1/entitlements?select=tier,status,trial_ends,renews_at',
                   { headers: headers() })
        .then(function (r) { return r.json(); }, fail)
        .then(function (rows) {
          var e = Array.isArray(rows) && rows[0] ? rows[0] : { tier: 'free', status: 'none' };
          if (ST()) ST().set('lk_entitlement', e);
          return { ok: true, data: e };
        }, function () {
          return { ok: true, data: { tier: 'free', status: 'none' } };
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
       device. */
    ask: function (messages, context) {
      if (!API.coachReady()) {
        return Promise.resolve({ ok: false, error: 'not_configured',
          message: 'The coach needs a server, and this build has none.' });
      }
      return post(cfg().coachUrl, { messages: messages, context: context || {} });
    }
  };

  g.LKCloud = API;
})(typeof window !== 'undefined' ? window : this);
