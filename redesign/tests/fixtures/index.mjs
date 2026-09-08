// Playwright fixture helpers for the LOCKED v6 offline harness.
// import { seedStorage, routeNetwork, collectConsoleErrors, gotoApp, states, APP_URL } from '../fixtures/index.mjs'

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSeed, DEFAULT_ANCHOR } from './gen-seed.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FROZEN_SEED = JSON.parse(fs.readFileSync(path.join(HERE, 'seed-data.json'), 'utf8'));
export const COACH = JSON.parse(fs.readFileSync(path.join(HERE, 'coach-replies.json'), 'utf8'));

// APP_URL: path of the app under test relative to baseURL. Override with env APP_URL for the demo
// (e.g. APP_URL=/10-final/locked-demo.html). Absolute URLs are also accepted.
export const APP_URL = process.env.APP_URL || '/tests/app/index.html';

export function todayISO(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Build the seed map. By default dates are relative to today (so `lk_proactiveTip.date`, the
 * check-in entry and the throwback dismissal stay valid); pass {anchor} to pin, or {frozen:true}
 * to use seed-data.json byte-for-byte (anchor 2026-09-08).
 */
export function buildSeed(overrides = {}, opts = {}) {
  const base = opts.frozen ? FROZEN_SEED : generateSeed(opts.anchor || todayISO());
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === undefined) delete out[k];               // null/undefined override = remove key
    else out[k] = typeof v === 'string' ? v : JSON.stringify(v);     // objects are stringified for you
  }
  return out;
}

/** Set every seed key in localStorage before any app script runs. Call before gotoApp(). */
export async function seedStorage(page, overrides = {}, opts = {}) {
  const seed = buildSeed(overrides, opts);
  await page.addInitScript((data) => {
    try {
      // Only seed once per origin+test: the app reloads itself in some flows and must keep its own writes.
      if (sessionStorage.getItem('__lk_seeded__')) return;
      localStorage.clear();
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
      sessionStorage.setItem('__lk_seeded__', '1');
    } catch (e) { /* storage blocked: app will show onboarding; tests will report it */ }
  }, seed);
  return seed;
}

function isLocal(url) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url) || url.startsWith('file:') || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:');
}

/**
 * Route every non-local request. Supabase → 200 {}. Worker → fixtures. Anything else → 200 {}
 * plus an entry in the returned `unexpected` array (also console.warn'ed in the test process).
 * Returns { unexpected: [{url, method}], calls: [{url, method, kind}], coachCount }.
 */
export async function routeNetwork(page, opts = {}) {
  const log = { unexpected: [], calls: [], coachCount: 0, aborted: false };
  const replies = COACH.replies;
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    if (isLocal(url)) return route.continue();
    if (log.aborted) return route.abort('failed');
    const u = new URL(url);

    if (u.hostname.endsWith('.supabase.co')) {
      log.calls.push({ url, method, kind: 'supabase' });
      return json(route, {});
    }
    if (u.hostname.endsWith('.workers.dev')) {
      const p = u.pathname.replace(/\/$/, '') || '/';
      if (p === '/app-version') { log.calls.push({ url, method, kind: 'app-version' }); return json(route, COACH.appVersion); }
      if (p === '/store-search') { log.calls.push({ url, method, kind: 'store-search' }); return json(route, COACH.storeSearch); }
      if (p === '/') {
        let body = {};
        try { body = req.postDataJSON() || {}; } catch (e) { body = {}; }
        const sys = String(body.system || '');
        if (/^You are a personal coach\. Give ONE short/.test(sys)) { log.calls.push({ url, method, kind: 'proactive-tip' }); return json(route, COACH.proactiveTip); }
        if (/six-question onboarding interview/.test(sys)) { log.calls.push({ url, method, kind: 'interview' }); return json(route, COACH.interview); }
        // coach chat / AI helpers: keyword match on the last user message, else sequence
        const msgs = Array.isArray(body.messages) ? body.messages : [];
        let lastUser = '';
        for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === 'user') { lastUser = String(msgs[i].content || ''); break; }
        let idx = null;
        for (const [kw, i] of Object.entries(COACH.mapping.keywords)) if (lastUser.toLowerCase().includes(kw)) { idx = i; break; }
        if (idx === null) idx = log.coachCount % replies.length;
        log.coachCount++;
        log.calls.push({ url, method, kind: 'coach', replyIndex: idx });
        return json(route, replies[idx]);
      }
      log.calls.push({ url, method, kind: 'worker-other' });
      log.unexpected.push({ url, method });
      console.warn('[routeNetwork] unrouted worker endpoint → 200 {}:', method, url);
      return json(route, COACH.unknown);
    }
    // exercise gifs and everything else
    log.unexpected.push({ url, method });
    console.warn('[routeNetwork] unexpected external request → 200 {}:', method, url);
    if (/\.(gif|png|jpe?g|webp|svg)(\?|$)/i.test(u.pathname)) {
      return route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') });
    }
    return json(route, {});
  });
  return log;
}

/** Console errors + uncaught page errors. Returns a live array of {type, text, location}. */
export function collectConsoleErrors(page, opts = {}) {
  const errors = [];
  const allow = opts.allow || [];
  const allowed = (t) => allow.some(a => (a instanceof RegExp ? a.test(t) : t.includes(a)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (allowed(text)) return;
    const loc = msg.location();
    errors.push({ type: 'console', text, location: loc ? `${loc.url}:${loc.lineNumber}` : '' });
  });
  page.on('pageerror', (err) => {
    const text = String(err && err.message || err);
    if (allowed(text)) return;
    errors.push({ type: 'pageerror', text, location: String(err && err.stack || '').split('\n')[1] || '' });
  });
  return errors;
}

export const HOME_READY = 'nav[aria-label="Main navigation"] button[aria-current="page"]';

/** Navigate to the app and wait until Home (the nav with an aria-current tab) is rendered. */
export async function gotoApp(page, opts = {}) {
  await page.goto(opts.url || APP_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(HOME_READY, { state: 'visible', timeout: opts.timeout || 20000 });
  // let boot-time setTimeout migrations and the first effects settle
  await page.waitForTimeout(150);
}

/** Override maps for alternative app states. Spread into seedStorage(page, {...}). */
export const states = {
  /** populated (default) */
  populated: () => ({}),
  /** no training data anywhere: empty Home, "Set up your first split", empty PR Vault, etc. */
  empty: () => ({
    lk_history: [], lk_splits: [], lk_prs: {}, lk_splitsExpanded: {}, lk_featuredLifts: [], lk_goals: [], lk_weightLog: [], lk_bfLog: [],
    lk_progressPhotos: [], lk_feedback: [], lk_shoppingList: [], lk_pantryItems: [], lk_myStores: [], lk_budgetData: { weeklyTarget: 0, history: [], pendingItems: [] },
    lk_coachLastMsgs: [], lk_coachLastHist: [], lk_coachPlan: null, lk_coachMemory: [], lk_mcDays: {}, lk_supplements: [], lk_cardioFavorites: [], lk_exNotes: {}, lk_customEx: [],
  }),
  /** empty Home but keep feedback (so the check-in card does not dominate) */
  emptyTraining: () => ({ lk_history: [], lk_splits: [], lk_prs: {}, lk_splitsExpanded: {}, lk_featuredLifts: [] }),
  /** male profile: Cycle Tracker gate message instead of tracker */
  male: () => ({ lk_profile: { displayName: 'Cesco', username: 'cesco', useKg: true, createdAt: '7/25/2026', age: 29, sex: 'male', weightKg: 82, heightCm: 180, goal: 'build', coachName: 'Coach' } }),
  /** lb display unit (storage still kg) */
  lbs: () => ({ lk_profile: { displayName: 'Cesco', username: 'cesco', useKg: false, createdAt: '7/25/2026', age: 29, sex: 'female', weightKg: 64.2, heightCm: 168, goal: 'build', coachName: 'Coach' } }),
  /** an active workout with rows → Resume dialog on boot; Resume + Finish reaches Review */
  activeWorkout: () => ({
    lk_activeWorkout: { name: 'PPL - Push', exIds: [111, 302, 103, 311, 411], blocks: [] },
    lk_activeWorkoutRows: [{ type: 'exercise', id: 111, name: 'Barbell Bench Press', muscle: 'Mid Chest', sets: [
      { w: '72.5', r: '8', rL: '', rR: '', rir: '2', done: true, setType: 'normal', partials: '' },
      { w: '72.5', r: '7', rL: '', rR: '', rir: '2', done: true, setType: 'normal', partials: '' },
      { w: '72.5', r: '', rL: '', rR: '', rir: '2', done: false, setType: 'normal', partials: '' }] }],
    lk_activeWorkoutSec: 1260,
  }),
  /** light theme */
  light: () => ({ lk_theme: 'light' }),
  /** tutorial not yet seen → TutorialOverlay */
  tutorial: () => ({ lk_tutorialSeen: null }),
  /** cold start: nothing seeded (auth overlay → guest modal) */
  coldStart: () => Object.fromEntries(Object.keys(FROZEN_SEED).map(k => [k, null])),
};

/** Force the error state: every subsequent external request is aborted (network failure branch). */
export function forceNetworkError(log) { log.aborted = true; }
export function restoreNetwork(log) { log.aborted = false; }
