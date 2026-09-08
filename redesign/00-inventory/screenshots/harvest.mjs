// Screenshot + flow-video harvester for the LOCKED v6 current app (Wave 0D).
// Usage: node harvest.mjs [only=<page|flow-N|global>,...]
// Output: current/<page>-<state>[-<subview>].png, current/flow-<n>-<slug>.webm, current/flow-<n>.json,
//         index.json (raw), index.md (table), debug.log (step failures with visible-button dumps).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/home/user/everything-claude-code/redesign/tests/node_modules/playwright/index.mjs';
import { seedStorage, routeNetwork, gotoApp, states, forceNetworkError, HOME_READY, COACH, FROZEN_SEED, todayISO } from '/home/user/everything-claude-code/redesign/tests/fixtures/index.mjs';

const BASE = 'http://127.0.0.1:4173';
const APP = '/tests/app/index.html';
const HERE = '/home/user/everything-claude-code/redesign/00-inventory/screenshots';
const OUT = path.join(HERE, 'current');
fs.mkdirSync(OUT, { recursive: true });
const VP = { width: 393, height: 852 };
const ONLY = (process.argv.find(a => a.startsWith('only=')) || '').slice(5).split(',').filter(Boolean);
const want = (k) => ONLY.length === 0 || ONLY.some(o => k === o || k.startsWith(o));

const index = [];        // {file, page, state, subview, how, note}
const unreachable = [];  // {page, state, subview, reason}
const debug = [];
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const NAV = (t) => `nav[aria-label="Main navigation"] button[aria-label^="${t}"]`;
const seedObj = (k) => JSON.parse(FROZEN_SEED[k]);

let browser;
async function newCtx(extra = {}) {
  return browser.newContext({ baseURL: BASE, viewport: VP, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', ...extra });
}

// ---------- scenario runner ----------
class Run {
  constructor(page, net, meta) { this.page = page; this.net = net; this.meta = meta; this.trail = []; }
  log(step) { this.trail.push(step); }
  async dumpButtons(tag) {
    try {
      const r = await this.page.evaluate(() => {
        const vis = el => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
        return [...document.querySelectorAll('button,[role=button],[role=tab],input,select,textarea')].filter(vis).map(b => {
          const t = (b.getAttribute('aria-label') || b.textContent || b.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 50);
          const r = b.getBoundingClientRect(); return `${b.tagName.toLowerCase()} "${t}" @${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`; });
      });
      debug.push(`[${this.meta.page}/${this.meta.state}] ${tag}\n   ` + r.join('\n   '));
    } catch (e) { debug.push(`[${this.meta.page}/${this.meta.state}] ${tag} (dump failed: ${e.message.split('\n')[0]})`); }
  }
  /** click a selector; returns true on success, logs a failure otherwise */
  async click(sel, label, opts = {}) {
    try {
      const loc = this.page.locator(sel).first();
      await loc.click({ timeout: opts.timeout || 4000, force: !!opts.force });
      this.log(label || `click ${sel}`);
      await wait(opts.after ?? 300);
      return true;
    } catch (e) {
      debug.push(`[${this.meta.page}/${this.meta.state}] CLICK FAIL ${sel}: ${e.message.split('\n')[0]}`);
      await this.dumpButtons(`after failed click ${sel}`);
      return false;
    }
  }
  /** dispatch a DOM click (for targets hidden under the fixed nav that Playwright's hit-test refuses) */
  async jsClick(sel, label) {
    try { await this.page.locator(sel).first().evaluate(el => el.click()); this.log(label || `js-click ${sel}`); await wait(400); return true; }
    catch (e) { debug.push(`[${this.meta.page}/${this.meta.state}] JSCLICK FAIL ${sel}: ${e.message.split('\n')[0]}`); await this.dumpButtons(`after failed js-click ${sel}`); return false; }
  }
  async fill(sel, value, label) {
    try { await this.page.locator(sel).first().fill(value, { timeout: 4000 }); this.log(label || `fill ${sel}="${value}"`); await wait(200); return true; }
    catch (e) { debug.push(`[${this.meta.page}/${this.meta.state}] FILL FAIL ${sel}: ${e.message.split('\n')[0]}`); await this.dumpButtons(`after failed fill ${sel}`); return false; }
  }
  async has(sel, timeout = 1500) { try { await this.page.locator(sel).first().waitFor({ state: 'visible', timeout }); return true; } catch { return false; } }
  /** viewport screenshot */
  async shot(name, opts = {}) {
    await wait(opts.wait ?? 400);
    const file = `${name}.png`;
    try {
      await this.page.screenshot({ path: path.join(OUT, file), animations: 'disabled', caret: 'hide', timeout: 15000 });
      index.push({ file, page: this.meta.page, state: this.meta.state, subview: opts.subview || name.replace(`${this.meta.page}-${this.meta.state}`, '').replace(/^-/, '') || '(base)', how: [this.meta.setup, ...this.trail].filter(Boolean).join(' → '), note: opts.note || '' });
    } catch (e) { debug.push(`[${this.meta.page}/${this.meta.state}] SHOT FAIL ${file}: ${e.message.split('\n')[0]}`); }
    return file;
  }
  async scrollMetrics() {
    return this.page.evaluate(() => {
      // topmost visible scroller: prefer .lk-scroll, else biggest overflow container
      const cands = [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 10 && b.width > 100 && b.height > 100; });
      const el = document.querySelector('.lk-scroll') && cands.includes(document.querySelector('.lk-scroll')) ? document.querySelector('.lk-scroll') : cands.sort((a, b) => b.clientHeight - a.clientHeight)[0];
      if (!el) return null;
      el.__lkHarvest = true;
      return { sh: el.scrollHeight, ch: el.clientHeight, top: el.scrollTop };
    });
  }
  /** viewport shots at every scroll position (-scrolled-2 ...) then one un-clamped full shot (-full) */
  async longShots(base, opts = {}) {
    const m = await this.scrollMetrics();
    if (!m) { debug.push(`[${this.meta.page}/${this.meta.state}] no scroller for ${base}; single shot only`); return; }
    let n = 1; let pos = 0;
    const step = Math.max(200, m.ch - 80);
    while (pos + m.ch < m.sh - 8 && n < 10) {
      pos = Math.min(pos + step, m.sh - m.ch); n++;
      await this.page.evaluate((p) => { const el = [...document.querySelectorAll('*')].find(e => e.__lkHarvest); if (el) el.scrollTop = p; }, pos);
      await this.shot(`${base}-scrolled-${n}`, { subview: `scrolled-${n} (scrollTop ${pos}px)`, wait: 350 });
    }
    await this.page.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.__lkHarvest); if (el) el.scrollTop = 0; });
    // full: enlarge the viewport so the flex shell (100dvh) un-clamps .lk-scroll
    const h = Math.min(VP.height + (m.sh - m.ch) + 24, 9000);
    await this.page.setViewportSize({ width: VP.width, height: h });
    await wait(450);
    const m2 = await this.scrollMetrics();
    if (m2 && m2.sh > m2.ch + 40) { // still clamped (nested scroller) → grow once more
      await this.page.setViewportSize({ width: VP.width, height: Math.min(h + (m2.sh - m2.ch) + 24, 9000) }); await wait(400);
    }
    await this.shot(`${base}-full`, { subview: `full page (viewport ${VP.width}x${h}, .lk-scroll un-clamped)`, wait: 200 });
    await this.page.setViewportSize(VP);
    await wait(350);
  }
  async escape() { await this.page.keyboard.press('Escape'); await wait(300); this.log('Escape'); }
  unreachable(subview, reason) { unreachable.push({ page: this.meta.page, state: this.meta.state, subview, reason }); }
}

/**
 * scenario(meta, fn): fresh context, routed network, seeded storage, boot, then fn(run).
 * meta: {page, state, overrides, delayWorker(ms), abortWorker(bool), noBoot(bool), setup(text)}
 */
async function scenario(meta, fn) {
  const key = `${meta.page}-${meta.state}`;
  if (!want(meta.page) && !want(key)) return;
  const ctx = await newCtx();
  const page = await ctx.newPage();
  const net = await routeNetwork(page);
  if (meta.delayWorker) {
    await page.route('**/*', async (route) => {
      const u = route.request().url();
      if (/workers\.dev/.test(u) && !/app-version/.test(u)) { await wait(meta.delayWorker); }
      return route.fallback();
    });
  }
  await seedStorage(page, meta.overrides || {});
  const run = new Run(page, net, { ...meta, setup: meta.setup || `seed ${meta.state}` });
  try {
    if (meta.noBoot) { await page.goto(APP, { waitUntil: 'domcontentloaded' }); await wait(1200); }
    else await gotoApp(page, { timeout: 25000 });
    if (meta.abortWorker) { forceNetworkError(net); run.log('worker route aborted'); }
    await fn(run);
  } catch (e) {
    debug.push(`[${meta.page}/${meta.state}] SCENARIO ERROR: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
    try { await run.shot(`${key}-ERRORSTATE`, { note: 'scenario aborted here: ' + e.message.split('\n')[0] }); } catch { }
  }
  await ctx.close();
  console.log(`done ${key}`);
}

// ---------- overrides ----------
const O = {
  homeLoading: () => ({ lk_homeLayout: { hidden: {} }, lk_proactiveTip: { date: '2000-01-01', text: 'stale' } }),
  emptyLog: () => ({ lk_activeWorkout: { name: 'Quick Workout', exIds: [], blocks: [] }, lk_activeWorkoutRows: null, lk_activeWorkoutSec: 30 }),
  activeNoDone: () => {
    const a = states.activeWorkout();
    a.lk_activeWorkoutRows = a.lk_activeWorkoutRows.map(r => ({ ...r, sets: r.sets.map(s => ({ ...s, done: false, w: '', r: '' })) }));
    return a;
  },
  emptyDetail: () => {
    const h = seedObj('lk_history');
    const e = { ...h[0], id: 'w_empty', name: 'Empty Session', exercises: [], sets: 0, vol: '0 kg' };
    return { lk_history: [e, ...h] };
  },
};

// ---------- page scenarios ----------
async function goProgress(r) { if (!(await r.click('button:has-text("VIEW PROGRESS")', 'Home "VIEW PROGRESS"'))) throw new Error('no VIEW PROGRESS'); }
async function goSettings(r) { await r.click(NAV('Profile'), 'Nav Profile'); await r.click('button:has-text("Settings")', 'Profile "Settings"'); }
async function goShop(r) { await r.click(NAV('Fuel'), 'Nav Fuel'); await r.click('button[aria-label="Shopping and budget"]', 'Fuel [aria-label="Shopping and budget"]'); }
async function goWorkoutLog(r) { await r.click('button:has-text("Resume")', 'Resume dialog "Resume"'); await r.has('button:has-text("Finish")'); }
async function shopTab(r, t) { await r.click(`[aria-label="Shopping section"] button:has-text("${t}")`, `Shop tab "${t}"`); }
async function progTab(r, t) { await r.click(`[aria-label="Progress section"] button:has-text("${t}")`, `Progress tab "${t}"`); }
async function coachTab(r, t) { await r.click(`[aria-label="Coach section"] button:has-text("${t}")`, `Coach tab "${t}"`); }
async function trainTab(r, t) { await r.click(`button:has-text("${t}")`, `Train tab "${t}"`); }

const pages = {
  // ----- HOME -----
  async home() {
    await scenario({ page: 'home', state: 'populated' }, async (r) => {
      await r.shot('home-populated');
      await r.longShots('home-populated');
      // recap sheet: the recap block button
      if (await r.click('button:has-text("Recap")', 'Home recap block button')) { await r.shot('home-populated-recap'); await r.escape(); }
      else r.unreachable('recap', 'no button matching "Recap" found on Home with the seed (recap block may render only with weekly data or be hidden)');
      // quick action water inline
      await r.click(NAV('Home'), 'Nav Home (tab reset)');
    });
    await scenario({ page: 'home', state: 'populated', overrides: { lk_throwbackForce: '1' }, setup: 'seed populated + raw lk_throwbackForce=1' }, async (r) => {
      await r.shot('home-populated-throwback', { subview: 'ThrowbackCard forced (lk_throwbackForce=1)' });
    });
    await scenario({ page: 'home', state: 'populated', overrides: { lk_gamingLayer: true }, setup: 'seed populated + lk_gamingLayer=true' }, async (r) => {
      await r.shot('home-populated-gaming', { subview: 'streak badge (gaming layer on)' });
    });
    await scenario({ page: 'home', state: 'populated', overrides: states.light(), setup: 'seed populated + lk_theme=light' }, async (r) => {
      await r.shot('home-populated-light-theme', { subview: 'light theme' });
    });
    await scenario({ page: 'home', state: 'empty', overrides: states.empty() }, async (r) => {
      await r.shot('home-empty'); await r.longShots('home-empty');
    });
    await scenario({ page: 'home', state: 'loading', overrides: O.homeLoading(), delayWorker: 60000, setup: 'seed + insight unhidden + stale lk_proactiveTip; worker delayed 60s' }, async (r) => {
      await r.shot('home-loading', { note: 'ProactiveTipCard loading (only async block on Home)' });
    });
    await scenario({ page: 'home', state: 'error', overrides: O.homeLoading(), setup: 'seed + insight unhidden + stale lk_proactiveTip; worker aborted before boot' }, async (r) => {
      // abort must be in place before the tip fetch fires: routeNetwork log.aborted is set after boot, so re-boot
      forceNetworkError(r.net); await r.page.reload({ waitUntil: 'domcontentloaded' }); await r.page.waitForSelector(HOME_READY); r.log('reload with worker aborted');
      await wait(800);
      await r.shot('home-error', { note: 'ProactiveTip fetch failed → card collapses (no visible error UI)' });
    });
  },

  // ----- PROGRESS -----
  async progress() {
    await scenario({ page: 'progress', state: 'populated' }, async (r) => {
      await goProgress(r);
      await r.shot('progress-populated'); await r.longShots('progress-populated');
      if (await r.click('button:has-text("ADD LIFT")', '"ADD LIFT"')) { await r.shot('progress-populated-add-lift-picker', { subview: 'Add Featured Lift picker (full-screen view)' }); await r.click('[aria-label="Back"]', 'Back'); }
      await progTab(r, 'Goals'); await r.shot('progress-populated-goals'); await r.longShots('progress-populated-goals'); await r.dumpButtons('goals tab');
      if (await r.click('button:has-text("Bench 75")', 'goal row "Bench 75 kg"')) { await r.shot('progress-populated-goals-detail'); await r.longShots('progress-populated-goals-detail');
        if (await r.click('[aria-label="Edit goal"]', 'Edit goal')) { await r.shot('progress-populated-goals-edit'); await r.longShots('progress-populated-goals-edit'); await r.click('button:has-text("SAVE CHANGES")', '"SAVE CHANGES" (returns to goals list)'); await r.click('button:has-text("Bench 75")', 'goal row again'); }
        if (await r.click('button:has-text("Analyse My Progress")', '"Analyse My Progress"')) { await wait(1500); await r.shot('progress-populated-goals-detail-analysis', { note: 'AI analysis reply (canned)' }); }
        if (await r.click('button:has-text("Delete Goal")', '"Delete Goal" (arm)')) await r.shot('progress-populated-goals-delete-armed');
        await r.click('[aria-label="Back"] >> nth=1', 'Back (goal detail, second Back button)'); }
      if (await r.click('button:has-text("Body Fat Log")', '"Body Fat Log"')) { await r.shot('progress-populated-goals-bodyfat-sheet'); await r.longShots('progress-populated-goals-bodyfat-sheet'); if (await r.click('button:has-text("AI Body Fat Estimate")', '"AI Body Fat Estimate"')) { await wait(1500); await r.shot('progress-populated-goals-bodyfat-ai', { note: 'bfAiLoading → canned reply' }); }
        await r.click('[aria-label="Back"] >> nth=1', 'Back (inner)'); }
      if (await r.click('button:has-text("NEW GOAL")', '"NEW GOAL"')) { await r.shot('progress-populated-goals-add', { subview: 'new goal: type picker' });
        if (await r.click('button:has-text("Lift PR")', 'type "Lift PR"')) { await r.shot('progress-populated-goals-add-form'); await r.longShots('progress-populated-goals-add-form'); }
        await r.click('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Back"] >> nth=1', 'Close/Back'); }
      await progTab(r, 'Calendar'); await r.shot('progress-populated-calendar'); await r.longShots('progress-populated-calendar');
      if (await r.click('[aria-label="Previous month"]', 'Previous month')) await r.shot('progress-populated-calendar-prev-month');
    });
    await scenario({ page: 'progress', state: 'empty', overrides: states.empty() }, async (r) => {
      await goProgress(r);
      await r.shot('progress-empty'); await r.longShots('progress-empty');
      await progTab(r, 'Goals'); await r.shot('progress-empty-goals');
      await progTab(r, 'Calendar'); await r.shot('progress-empty-calendar');
    });
    await scenario({ page: 'progress', state: 'loading', delayWorker: 60000, setup: 'seed; worker delayed 60s; Goals AI suggestion' }, async (r) => {
      await goProgress(r); await progTab(r, 'Goals');
      await r.click('button:has-text("Bench 75")', 'goal row "Bench 75 kg"');
      if (await r.click('button:has-text("Analyse My Progress")', '"Analyse My Progress"')) { await wait(500); await r.shot('progress-loading-goals-ai', { note: 'aiLoading L27007' }); }
      await r.click('[aria-label="Back"] >> nth=1', 'Back');
      if (await r.click('button:has-text("NEW GOAL")', '"NEW GOAL"')) { await r.dumpButtons('new goal form'); if (await r.click('button:has-text("AI"), button:has-text("Suggest")', 'AI in add form')) { await wait(400); await r.shot('progress-loading-goals-add-ai'); } }
    });
    await scenario({ page: 'progress', state: 'error', abortWorker: true }, async (r) => {
      await goProgress(r); await progTab(r, 'Goals');
      await r.click('button:has-text("Bench 75")', 'goal row "Bench 75 kg"');
      if (await r.click('button:has-text("Analyse My Progress")', '"Analyse My Progress"')) { await wait(1500); await r.shot('progress-error-goals-ai', { note: 'aiCall onFail L27204 text fallback' }); }
    });
  },

  // ----- PR VAULT -----
  async prVault() {
    await scenario({ page: 'pr-vault', state: 'populated' }, async (r) => {
      await goProgress(r); await progTab(r, 'PR Vault');
      await r.shot('pr-vault-populated', { subview: 'PR list (default tab prs)' }); await r.longShots('pr-vault-populated');
      r.unreachable('overview tab', 'PRHub Overview/PR Vault inner tab bar (L29753) renders only in the `!p.onBack` branch (L29742); embedded in Progress it shows the "PR VAULT" h1 and the list only, so the overview (Last 7 Days strip, L29771) is unreachable in v6');
      if (await r.click('[role=button]:has-text("Bench Press"), button:has-text("Bench Press")', 'lift row "Bench Press"')) {
        await r.shot('pr-vault-populated-detail'); await r.longShots('pr-vault-populated-detail');
        if (await r.click('button:has-text("3M"), button:has-text("3 months"), button:has-text("90")', 'range 3M')) await r.shot('pr-vault-populated-detail-range');
        await r.click('[aria-label="Back"]', 'Back');
      }
      if (await r.click('button:has-text("LOG A PR")', '"LOG A PR WITHOUT A WORKOUT"')) { await r.shot('pr-vault-populated-log-pr'); await r.longShots('pr-vault-populated-log-pr'); }
    });
    await scenario({ page: 'pr-vault', state: 'empty', overrides: states.empty() }, async (r) => {
      await goProgress(r); await progTab(r, 'PR Vault');
      await r.shot('pr-vault-empty'); await r.longShots('pr-vault-empty');
    });
    unreachable.push({ page: 'pr-vault', state: 'loading', subview: '-', reason: 'no network in PRHub (page-map 2.3 L/X n/a)' });
    unreachable.push({ page: 'pr-vault', state: 'error', subview: '-', reason: 'no network in PRHub (page-map 2.3 L/X n/a)' });
  },

  // ----- PHOTOS -----
  async photos() {
    await scenario({ page: 'photos', state: 'populated' }, async (r) => {
      await goProgress(r); await progTab(r, 'Photos');
      await r.shot('photos-populated'); await r.longShots('photos-populated');
      if (await r.click('img', 'tap first photo thumbnail')) { await r.shot('photos-populated-lightbox'); await r.dumpButtons('lightbox');
        if (await r.click('button:has-text("Compare")', '"Compare" in lightbox')) { await r.shot('photos-populated-compare'); await r.longShots('photos-populated-compare'); } else r.unreachable('compare', 'lightbox shows only ANALYSE PHYSIQUE and a close button; compare target (addTarget L30598) has no visible trigger with 2 photos');
        await r.escape(); }
    });
    await scenario({ page: 'photos', state: 'empty', overrides: states.empty() }, async (r) => {
      await goProgress(r); await progTab(r, 'Photos'); await r.shot('photos-empty');
    });
    await scenario({ page: 'photos', state: 'loading', delayWorker: 60000, setup: 'seed; worker delayed 60s; "Analyse Physique"' }, async (r) => {
      await goProgress(r); await progTab(r, 'Photos');
      await r.click('img', 'tap first photo thumbnail');
      if (await r.click('button:has-text("Analyse")', '"Analyse Physique" in lightbox')) { await wait(600); await r.shot('photos-loading', { note: 'analysing while POST /analyze-physique pending' }); }
      else r.unreachable('analysing', 'no "Analyse" button in lightbox (L30930-30960)');
    });
    await scenario({ page: 'photos', state: 'error', abortWorker: true }, async (r) => {
      await goProgress(r); await progTab(r, 'Photos');
      await r.click('img', 'tap first photo thumbnail');
      if (await r.click('button:has-text("Analyse")', '"Analyse Physique" in lightbox')) { await wait(1500); await r.shot('photos-error', { note: '/analyze-physique aborted' }); }
    });
  },

  // ----- CYCLE -----
  async cycle() {
    const goCycle = async (r) => { if (await r.page.locator('button:has-text("TRACK CYCLE")').count()) { await r.jsClick('button:has-text("TRACK CYCLE")', 'Home "TRACK CYCLE" (setup card)'); } else { await r.jsClick('button:text-is("LOG")', 'Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click)'); } await wait(400); };
    await scenario({ page: 'cycle', state: 'populated' }, async (r) => {
      await goCycle(r);
      await r.shot('cycle-populated'); await r.longShots('cycle-populated');
      await r.dumpButtons('cycle screen');
      if (await r.click('[aria-label="Show calendar"], [title="Show calendar"], button:has-text("Calendar")', '"Show calendar"')) { await r.shot('cycle-populated-calendar'); await r.longShots('cycle-populated-calendar'); await r.click('[aria-label="Show cycle"], [title="Show cycle"], button:has-text("Cycle")', '"Show cycle"'); }
      if (await r.click('button:has-text("Symptoms")', 'today card "Symptoms" (McLogSheet)')) { await r.shot('cycle-populated-log-sheet'); await r.longShots('cycle-populated-log-sheet'); await r.click('button:has-text("Done")', '"Done" (close sheet)'); }
      if (await r.click('button:has-text("More")', 'today card "More"')) { await r.shot('cycle-populated-log-more'); await r.longShots('cycle-populated-log-more'); await r.click('button:has-text("Done")', '"Done"'); }
      if (await r.click('button:has-text("THE SCIENCE")', '"THE SCIENCE" (eduOpen)')) { await r.shot('cycle-populated-education'); await r.longShots('cycle-populated-education'); }
      if (await r.click('[aria-label="Cycle settings"]', 'Cycle settings')) { await r.shot('cycle-populated-settings'); await r.longShots('cycle-populated-settings'); }
    });
    await scenario({ page: 'cycle', state: 'empty', overrides: { lk_mcDays: {} }, setup: 'seed + lk_mcDays={}' }, async (r) => {
      await goCycle(r); await r.shot('cycle-empty'); await r.longShots('cycle-empty');
    });
    await scenario({ page: 'cycle', state: 'empty', overrides: { lk_mcProfile: null, lk_mcDays: {} }, setup: 'seed with lk_mcProfile removed (McOnboarding)' }, async (r) => {
      await goCycle(r); await r.shot('cycle-empty-onboarding');
      for (let i = 2; i <= 5; i++) { if (await r.click('button:has-text("GET STARTED"), button:has-text("Next"), button:has-text("Continue"), button:has-text("NEXT"), button:has-text("CONTINUE"), button:has-text("Skip")', 'onboarding next')) { await r.shot(`cycle-empty-onboarding-step${i}`); } else { await r.dumpButtons('cycle onboarding'); break; } }
    });
    await scenario({ page: 'cycle', state: 'error', overrides: states.male(), setup: 'seed + profile.sex=male (gate message)' }, async (r) => {
      // Cycle card is hidden for male users; nothing on Home reaches cycletrack → document
      if (await r.click('button:has-text("TRACK CYCLE"), button:has-text("CYCLE TRACKING")', 'Home cycle card')) await r.shot('cycle-error-male-gate');
      else r.unreachable('male gate', 'Home hides the cycle blocks when !isFemaleUser (L26579/L21946), so the gate message at L25168 is unreachable from the UI in v6');
    });
    unreachable.push({ page: 'cycle', state: 'loading', subview: '-', reason: 'no network in CycleTrackerScreen (page-map 2.5 L/X n/a)' });
  },

  // ----- TRAIN HUB -----
  async trainHub() {
    await scenario({ page: 'train-hub', state: 'populated' }, async (r) => {
      await r.click(NAV('Train'), 'Nav Train');
      await r.shot('train-hub-populated'); await r.longShots('train-hub-populated');
      if (await r.click('[aria-label="Expand split"]', 'Expand split chevron')) { await r.shot('train-hub-populated-split-expanded'); }
      if (await r.click('button:has-text("Edit") >> xpath=preceding-sibling::button[1]', 'split card footer "Start" (sibling before Edit)')) { await r.shot('train-hub-populated-day-modal'); await r.click('[aria-label="Close"]', 'Close'); }
      await trainTab(r, 'History'); await r.shot('train-hub-populated-history'); await r.longShots('train-hub-populated-history');
      await trainTab(r, 'My Splits');
    });
    await scenario({ page: 'train-hub', state: 'empty', overrides: states.empty() }, async (r) => {
      await r.click(NAV('Train'), 'Nav Train');
      await r.shot('train-hub-empty'); await r.longShots('train-hub-empty');
      await trainTab(r, 'History'); await r.shot('train-hub-empty-history');
    });
    unreachable.push({ page: 'train-hub', state: 'loading', subview: '-', reason: 'no network in TrainHub itself (page-map 2.6 L/X n/a; AI builder covered under split-builder)' });
    unreachable.push({ page: 'train-hub', state: 'error', subview: '-', reason: 'no network in TrainHub itself (page-map 2.6 L/X n/a)' });
  },

  // ----- WORKOUT LOG -----
  async workoutLog() {
    await scenario({ page: 'workout-log', state: 'populated', overrides: states.activeWorkout(), setup: 'seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume)' }, async (r) => {
      await r.shot('workout-log-populated-resume-dialog', { subview: 'Resume Workout? dialog (boot)' });
      await goWorkoutLog(r);
      await r.shot('workout-log-populated'); await r.longShots('workout-log-populated');
      if (await r.click('button[aria-label="Set 3 weight"]', 'Set 3 weight cell')) { await r.shot('workout-log-populated-numpad'); await r.click('#lk-sheet-root button:has-text("CANCEL")', 'NumPad CANCEL'); }
      if (await r.click('button[aria-label="Set 3 reps"]', 'Set 3 reps cell')) { await r.shot('workout-log-populated-numpad-reps'); await r.click('#lk-sheet-root button:has-text("CANCEL")', 'NumPad CANCEL'); }
      if (await r.click('button[aria-label="Workout tools"]', 'Workout tools')) {
        await r.shot('workout-log-populated-tools');
        if (await r.click('button:has-text("Plate Calc")', '"Plate Calc"')) { await r.shot('workout-log-populated-platecalc'); await r.escape(); }
        if (await r.click('button[aria-label="Workout tools"]', 'Workout tools')) { if (await r.click('button:has-text("Rest Timer")', '"Rest Timer"')) { await r.shot('workout-log-populated-rest-settings'); await r.click('[aria-label="Close"]', 'Close'); } }
      }
      // long-press on exercise name → ExerciseActionSheet
      try {
        const name = r.page.locator('[data-exrow]').first();
        const box = await name.boundingBox();
        if (box) { await r.page.mouse.move(box.x + 60, box.y + 18); await r.page.mouse.down(); await wait(900); await r.page.mouse.up(); r.log('long-press exercise header 900ms'); await wait(300);
          if (await r.has('[aria-label="Exercise actions"]', 1500)) { await r.shot('workout-log-populated-action-sheet'); await r.escape(); } else { await r.dumpButtons('after long-press'); r.unreachable('action-sheet', 'long-press (mouse down 900ms on [data-exrow]) did not open [aria-label="Exercise actions"]; hold gesture uses touch/pointer timing L10319'); } }
      } catch (e) { debug.push('long-press: ' + e.message); }
      // exercise detail modal via action sheet "Info & notes"
      try { const box = await r.page.locator('[data-exrow]').first().boundingBox(); if (box) { await r.page.mouse.move(box.x + 60, box.y + 18); await r.page.mouse.down(); await wait(900); await r.page.mouse.up(); r.log('long-press exercise header'); await wait(300);
        if (await r.click('button:has-text("Info & notes")', '"Info & notes"')) { await wait(1200); await r.shot('workout-log-populated-exercise-detail'); await r.longShots('workout-log-populated-exercise-detail'); await r.click('[aria-label="Close"]', 'Close'); } } } catch (e) { debug.push('info: ' + e.message); }
      if (await r.click('button:has-text("Block")', '"+ Block"')) { await r.shot('workout-log-populated-block-modal'); await r.escape(); await r.click('[aria-label="Close"]', 'Close'); }
      if (await r.click('button:has-text("Add Set")', '"Add Set"')) { await r.shot('workout-log-populated-add-set'); }
      if (await r.click('button:has-text("Add Exercise")', '"Add Exercise"')) { await r.shot('workout-log-populated-add-exercise'); await r.click('[aria-label="Back"]', 'Back'); }
      if (await r.click('button:has-text("Discard")', '"Discard" (arms confirm toast)')) { await r.shot('workout-log-populated-discard-confirm', { note: 'lkConfirm toast "Tap Discard again"' }); }
      // banner: leave the workout running and go Home
      await r.click(NAV('Home'), 'Nav Home while workout active');
      await r.shot('workout-log-populated-banner-home', { subview: 'active-workout banner on Home' });
    });
    await scenario({ page: 'workout-log', state: 'empty', overrides: O.emptyLog(), setup: 'seed + lk_activeWorkout {name:"Quick Workout", exIds:[]} (Resume → empty log)' }, async (r) => {
      await goWorkoutLog(r); await r.shot('workout-log-empty');
    });
    await scenario({ page: 'workout-log', state: 'loading', overrides: states.activeWorkout(), delayWorker: 60000, setup: 'seed + active workout; worker delayed; AI set recommendation' }, async (r) => {
      await goWorkoutLog(r);
      if (await r.click('button:has-text("AI Rec")', '"AI Rec"')) { await wait(500); await r.shot('workout-log-loading', { note: 'aiRecBusy' }); }
      else r.unreachable('aiRecBusy', 'no visible AI recommendation trigger found in WorkoutLog (aiCall L13586); see debug.log dump');
    });
    await scenario({ page: 'workout-log', state: 'error', overrides: states.activeWorkout(), abortWorker: true }, async (r) => {
      await goWorkoutLog(r);
      if (await r.click('button:has-text("AI Rec")', '"AI Rec"')) { await wait(1500); await r.shot('workout-log-error', { note: 'aiCall onFail' }); }
      else r.unreachable('aiCall fail', 'no visible AI recommendation trigger found in WorkoutLog (aiCall L13586)');
    });
  },

  // ----- REVIEW -----
  async review() {
    const toReview = async (r) => { await goWorkoutLog(r); await r.click('button:has-text("Finish")', '"Finish"'); await wait(300); };
    await scenario({ page: 'review', state: 'populated', overrides: states.activeWorkout(), setup: 'seed + active workout (2 done sets) → Resume → Finish' }, async (r) => {
      await toReview(r);
      await r.shot('review-populated'); await r.longShots('review-populated');
      if (await r.click('button:has-text("HOW DID IT FEEL?")', '"HOW DID IT FEEL?"')) {
        await r.shot('review-populated-reflect'); await r.longShots('review-populated-reflect');
        // tap the middle option of each rating row if present
        const opts = r.page.locator('[role=radiogroup] button, [role=group] button');
        const n = await opts.count(); if (n) { for (let i = 2; i < n; i += 5) { try { await opts.nth(i).click({ timeout: 800 }); } catch { } } r.log('tap rating options'); }
        await r.shot('review-populated-reflect-rated');
        if (await r.click('button:has-text("GET AI COACH INSIGHT")', '"GET AI COACH INSIGHT"')) { await wait(1500); await r.shot('review-populated-ai-insight'); await r.longShots('review-populated-ai-insight'); }
      }
      if (await r.click('button:has-text("Discard")', '"Discard" (arm)')) await r.shot('review-populated-discard-armed');
    });
    await scenario({ page: 'review', state: 'empty', overrides: O.activeNoDone(), setup: 'seed + active workout with no done sets → Resume → Finish' }, async (r) => {
      await toReview(r); await r.shot('review-empty');
    });
    await scenario({ page: 'review', state: 'loading', overrides: states.activeWorkout(), delayWorker: 60000, setup: 'active workout → Finish → reflect → AI insight with worker delayed' }, async (r) => {
      await toReview(r); await r.click('button:has-text("HOW DID IT FEEL?")', '"HOW DID IT FEEL?"');
      if (await r.click('button:has-text("GET AI COACH INSIGHT")', '"GET AI COACH INSIGHT"')) { await wait(500); await r.shot('review-loading'); }
    });
    await scenario({ page: 'review', state: 'error', overrides: states.activeWorkout(), abortWorker: true, setup: 'active workout → Finish → reflect → AI insight with worker aborted' }, async (r) => {
      await toReview(r); await r.click('button:has-text("HOW DID IT FEEL?")', '"HOW DID IT FEEL?"');
      if (await r.click('button:has-text("GET AI COACH INSIGHT")', '"GET AI COACH INSIGHT"')) { await wait(1500); await r.shot('review-error'); }
    });
  },

  // ----- WORKOUT DETAIL -----
  async workoutDetail() {
    const first = seedObj('lk_history')[0].name;
    await scenario({ page: 'workout-detail', state: 'populated' }, async (r) => {
      if (!(await r.click(`[role=button]:has-text("${first}"), button:has-text("${first}")`, `Home recent row "${first}"`))) await r.click(`text=${first}`, `text "${first}"`);
      await r.shot('workout-detail-populated'); await r.longShots('workout-detail-populated');
      if (await r.click('button:has-text("Edit")', '"Edit"')) { await r.shot('workout-detail-populated-edit'); await r.longShots('workout-detail-populated-edit'); await r.click('button:has-text("SAVE")', 'SAVE (exit edit)'); }
      if (await r.click('button:has-text("Delete")', '"Delete" (arm)')) await r.shot('workout-detail-populated-delete-armed');
      if (await r.click('button:has-text("Convert")', '"Convert"')) { await r.shot('workout-detail-populated-convert-modal'); await r.longShots('workout-detail-populated-convert-modal'); await r.dumpButtons('convert modal');
        if (await r.click('button:has-text("New split"), button:has-text("Create new"), button:has-text("NEW")', 'mode new')) await r.shot('workout-detail-populated-convert-new'); }
    });
    await scenario({ page: 'workout-detail', state: 'populated', setup: 'seed → Train → History tab → row' }, async (r) => {
      await r.click(NAV('Train'), 'Nav Train'); await trainTab(r, 'History');
      if (await r.click(`[role=button]:has-text("${first}"), button:has-text("${first}")`, `history row "${first}"`)) await r.shot('workout-detail-populated-from-train');
    });
    await scenario({ page: 'workout-detail', state: 'empty', overrides: O.emptyDetail(), setup: 'seed + prepended history entry with exercises:[]' }, async (r) => {
      if (!(await r.click('[role=button]:has-text("Empty Session"), button:has-text("Empty Session")', 'Home recent row "Empty Session"'))) await r.click('text=Empty Session', 'text');
      await r.shot('workout-detail-empty');
    });
    unreachable.push({ page: 'workout-detail', state: 'loading', subview: '-', reason: 'no network (page-map 2.9 L/X n/a)' });
    unreachable.push({ page: 'workout-detail', state: 'error', subview: '-', reason: 'no network (page-map 2.9 L/X n/a)' });
  },

  // ----- EXERCISE LIBRARY -----
  async exerciseLibrary() {
    const goLib = async (r) => { await r.click(NAV('Train'), 'Nav Train'); await trainTab(r, 'Library'); };
    await scenario({ page: 'exercise-library', state: 'populated' }, async (r) => {
      await goLib(r);
      await r.shot('exercise-library-populated'); await r.longShots('exercise-library-populated'); await r.dumpButtons('library root');
      if (await r.fill('input[placeholder*="Search"]', 'bench', 'search "bench"')) await r.shot('exercise-library-populated-search');
      if (await r.click('button:has-text("Barbell Bench Press")', 'result "Barbell Bench Press"')) { await wait(1500); await r.shot('exercise-library-populated-detail-modal'); await r.longShots('exercise-library-populated-detail-modal'); await r.click('[aria-label="Close"]', 'Close'); }
      if (await r.click('button[aria-label="Clear"], button:has-text("Clear")', 'Clear search')) { }
      if (await r.click('button:has-text("Custom"), button:has-text("Create"), button:has-text("New exercise"), button:has-text("+ Add")', 'create custom opener')) { await r.shot('exercise-library-populated-create-custom'); await r.longShots('exercise-library-populated-create-custom'); await r.click('[aria-label="Back"]', 'Back'); }
      if (await r.click('button:has-text("Chest")', 'group "Chest"')) { await r.shot('exercise-library-populated-group'); await r.longShots('exercise-library-populated-group');
        if (await r.click('button:has-text("Mid Chest")', 'subgroup "Mid Chest"')) { await r.shot('exercise-library-populated-subgroup'); } }
    });
    await scenario({ page: 'exercise-library', state: 'empty', setup: 'seed → Library → search "zzqx" (no results)' }, async (r) => {
      await goLib(r); await r.fill('input[placeholder*="Search"]', 'zzqx', 'search "zzqx"'); await r.shot('exercise-library-empty');
    });
    await scenario({ page: 'exercise-library', state: 'loading', delayWorker: 60000, setup: 'seed → Library → exercise → detail modal with /exercise-detail delayed' }, async (r) => {
      await goLib(r); await r.fill('input[placeholder*="Search"]', 'bench', 'search');
      if (await r.click('button:has-text("Barbell Bench Press")', 'exercise')) { await wait(500); await r.shot('exercise-library-loading'); }
    });
    await scenario({ page: 'exercise-library', state: 'error', abortWorker: true, setup: 'seed → Library → exercise → detail modal with worker aborted' }, async (r) => {
      await goLib(r); await r.fill('input[placeholder*="Search"]', 'bench', 'search');
      if (await r.click('button:has-text("Barbell Bench Press")', 'exercise')) { await wait(1500); await r.shot('exercise-library-error'); }
    });
  },

  // ----- SPLIT BUILDER -----
  async splitBuilder() {
    await scenario({ page: 'split-builder', state: 'populated' }, async (r) => {
      await r.click(NAV('Train'), 'Nav Train');
      await r.click('button:has-text("Edit")', 'split card "Edit"');
      await r.shot('split-builder-populated'); await r.longShots('split-builder-populated');
      if (await r.click('[aria-label="Rename day"]', 'Rename day')) { await r.shot('split-builder-populated-rename-day'); await r.escape(); }
      if (await r.click('button:has-text("Exercise")', '"+ Exercise" (pick view)')) { await r.shot('split-builder-populated-pick'); await r.click('[aria-label="Back"]', 'Back'); }
      await r.click('[aria-label="Back"]', 'Back to hub');
      if (await r.click('button:has-text("AI")', 'AI split builder opener')) { await r.shot('split-builder-populated-ai'); if (await r.click('text=Import from Photo', '"Import from Photo" card')) { await r.shot('split-builder-populated-ai-photo'); await r.longShots('split-builder-populated-ai-photo'); } }
      else r.unreachable('ai builder', 'no AI builder button found on populated My Splits (L15528/L15568)');
    });
    await scenario({ page: 'split-builder', state: 'empty', overrides: states.empty(), setup: 'seed empty → Train → "Build Manually" (create)' }, async (r) => {
      await r.click(NAV('Train'), 'Nav Train');
      await r.click('button:has-text("Build Manually"), button:has-text("New Split")', '"Build Manually"');
      await r.shot('split-builder-empty');
      if (await r.fill('input[placeholder*="Split name"]', 'Test', 'name')) { }
      if (await r.fill('input[placeholder*="Push, Pull"]', 'Day 1', 'day name')) { await r.click('button:has-text("Add")', '"Add" day'); await r.shot('split-builder-empty-day-no-exercises'); }
      await r.click('[aria-label="Back"]', 'Back');
      if (await r.click('button:has-text("AI")', 'AI split builder opener (empty state)')) { await r.shot('split-builder-empty-ai'); }
    });
    const aiSend = async (r) => {
      await r.click(NAV('Train'), 'Nav Train');
      if (!(await r.click('button:has-text("AI")', 'AI split builder opener'))) return false;
      await r.click('text=Chat with AI Coach', '"Chat with AI Coach" card'); await r.dumpButtons('ai builder chat');
      await wait(r.meta.abortWorker ? 1500 : 600);
      await r.shot(`split-builder-${r.meta.state}`, { note: r.meta.abortWorker ? 'first AI question request aborted (fetch catch after L13993)' : 'aiLoading while the first AI question is pending (Send disabled)' });
      return false;
    };
    await scenario({ page: 'split-builder', state: 'loading', delayWorker: 60000, setup: 'seed → Train → AI Builder → "Chat with AI Coach" with worker delayed' }, async (r) => { await aiSend(r); });
    await scenario({ page: 'split-builder', state: 'error', abortWorker: true, setup: 'seed → Train → AI Builder → "Chat with AI Coach" with worker aborted' }, async (r) => { await aiSend(r); });
  },

  // ----- CARDIO -----
  async cardio() {
    const goCardio = async (r) => { await r.click(NAV('Train'), 'Nav Train'); await r.click('button:has-text("Cardio")', 'TRAIN header "Cardio"'); };
    await scenario({ page: 'cardio', state: 'populated' }, async (r) => {
      await goCardio(r);
      await r.shot('cardio-populated'); await r.longShots('cardio-populated');
      if (await r.click('button:has-text("Log")', 'tab "Log"')) {
        await r.shot('cardio-populated-log'); await r.longShots('cardio-populated-log');
        if (await r.click('button:has-text("Running"), button:has-text("Run"), [role=button]:has-text("Run")', 'pick activity')) { await r.shot('cardio-populated-log-step2'); await r.longShots('cardio-populated-log-step2'); }
      }
      if (await r.click('button:has-text("History")', 'tab "History"')) { await r.shot('cardio-populated-history'); await r.longShots('cardio-populated-history'); }
      if (await r.click('button:has-text("Favorites")', 'tab "Favorites"')) await r.shot('cardio-populated-favorites');
    });
    await scenario({ page: 'cardio', state: 'empty', overrides: states.empty() }, async (r) => {
      await goCardio(r); await r.shot('cardio-empty');
      if (await r.click('button:has-text("History")', 'tab "History"')) await r.shot('cardio-empty-history');
      if (await r.click('button:has-text("Favorites")', 'tab "Favorites"')) await r.shot('cardio-empty-favorites');
    });
    unreachable.push({ page: 'cardio', state: 'loading', subview: '-', reason: 'no network (page-map 2.12 L/X n/a)' });
    unreachable.push({ page: 'cardio', state: 'error', subview: '-', reason: 'no network (page-map 2.12 L/X n/a)' });
  },

  // ----- COACH CHAT -----
  async coachChat() {
    await scenario({ page: 'coach-chat', state: 'populated' }, async (r) => {
      await r.click(NAV('Coach'), 'Nav Coach');
      await r.shot('coach-chat-populated'); await r.longShots('coach-chat-populated');
      await r.fill('[aria-label="Ask your coach"]', 'How should I progress bench?', 'type message');
      await r.shot('coach-chat-populated-typed');
      await r.click('button[aria-label="Send message to coach"]', 'Send'); await wait(1200);
      await r.shot('coach-chat-populated-reply', { note: 'canned reply (keyword bench)' });
      await coachTab(r, 'Check-In'); await r.shot('coach-chat-populated-checkin'); await r.longShots('coach-chat-populated-checkin');
      await coachTab(r, 'Chat');
      if (await r.click('button:has-text("New chat")', '"New chat"')) await r.shot('coach-chat-populated-new-chat-confirm');
    });
    await scenario({ page: 'coach-chat', state: 'empty', overrides: { lk_coachLastMsgs: [], lk_coachLastHist: [] }, setup: 'seed + lk_coachLastMsgs=[]' }, async (r) => {
      await r.click(NAV('Coach'), 'Nav Coach'); await r.shot('coach-chat-empty'); await r.longShots('coach-chat-empty');
    });
    await scenario({ page: 'coach-chat', state: 'loading', overrides: { lk_coachLastMsgs: [], lk_coachLastHist: [] }, delayWorker: 60000, setup: 'empty chat → send with worker delayed 60s' }, async (r) => {
      await r.click(NAV('Coach'), 'Nav Coach'); await r.fill('[aria-label="Ask your coach"]', 'Plan my week', 'type'); await r.click('button[aria-label="Send message to coach"]', 'Send'); await wait(700);
      await r.shot('coach-chat-loading', { note: 'typing indicator + Stop the reply button' });
    });
    await scenario({ page: 'coach-chat', state: 'error', overrides: { lk_coachLastMsgs: [], lk_coachLastHist: [] }, abortWorker: true, setup: 'empty chat → send with worker aborted' }, async (r) => {
      await r.click(NAV('Coach'), 'Nav Coach'); await r.fill('[aria-label="Ask your coach"]', 'Plan my week', 'type'); await r.click('button[aria-label="Send message to coach"]', 'Send'); await wait(1500);
      await r.shot('coach-chat-error', { note: 'error bubble with retry' });
    });
  },

  // ----- COACH PLAN -----
  async coachPlan() {
    await scenario({ page: 'coach-plan', state: 'populated' }, async (r) => {
      await r.click(NAV('Coach'), 'Nav Coach'); await coachTab(r, 'Plan');
      await r.shot('coach-plan-populated'); await r.longShots('coach-plan-populated');
      if (await r.click('button:has-text("Build")', 'phase row "Build"')) { await r.shot('coach-plan-populated-phase-open'); await r.longShots('coach-plan-populated-phase-open'); }
      if (await r.click('[aria-label="Delete this plan"]', 'Delete this plan (arm)')) await r.shot('coach-plan-populated-delete-armed');
    });
    await scenario({ page: 'coach-plan', state: 'empty', overrides: { lk_coachPlan: null }, setup: 'seed + lk_coachPlan removed' }, async (r) => {
      await r.click(NAV('Coach'), 'Nav Coach'); await coachTab(r, 'Plan'); await r.shot('coach-plan-empty');
    });
    unreachable.push({ page: 'coach-plan', state: 'loading', subview: '-', reason: 'plan is parsed out of chat replies, no own request (page-map 2.14 L/X n/a)' });
    unreachable.push({ page: 'coach-plan', state: 'error', subview: '-', reason: 'plan is parsed out of chat replies, no own request (page-map 2.14 L/X n/a)' });
  },

  // ----- COACH SETUP -----
  async coachSetup() {
    const goSetup = async (r) => { await r.click(NAV('Coach'), 'Nav Coach'); await coachTab(r, 'Setup'); };
    const answerInterview = async (r, max = 8) => {
      for (let i = 0; i < max; i++) {
        const dlg = r.page.locator('[aria-label="Coach interview"]');
        if (!(await dlg.count())) return i;
        const chips = dlg.locator('button:not([aria-label])').filter({ hasNotText: /^Next$|Send|Skip/ });
        const n = await chips.count(); if (!n) return i;
        try { await chips.first().click({ timeout: 1500 }); } catch { return i; }
        await wait(300);
        try { await dlg.locator('button:has-text("Next")').first().click({ timeout: 1000 }); } catch { }
        if (i === 0) await r.shot('coach-setup-populated-interview-answered', { subview: 'interview after first answer' });
        await wait(500);
        if (await r.has('text=/writing|Writing|Drafting/i', 300)) return i + 1;
        if (!(await r.has('[aria-label="Coach interview"]', 300))) return i + 1;
      }
      return max;
    };
    await scenario({ page: 'coach-setup', state: 'populated' }, async (r) => {
      await goSetup(r);
      await r.shot('coach-setup-populated'); await r.longShots('coach-setup-populated');
      if (await r.click('[aria-label="Rename your coach"]', 'Rename your coach')) { await r.shot('coach-setup-populated-rename-coach'); await r.escape(); }
      if (await r.click('button:has-text("Let the coach interview you")', '"Let the coach interview you"')) { await r.shot('coach-setup-populated-interview'); await r.dumpButtons('interview'); await r.click('[aria-label="Close the interview"]', 'Close the interview'); }
      if (await r.click('[aria-label="Add a memory"]', 'Add a memory')) { await r.shot('coach-setup-populated-add-memory'); await r.escape(); }
    });
    await scenario({ page: 'coach-setup', state: 'empty', overrides: { lk_coachMemory: [], lk_coachInstructions: '', lk_coachStyle: null }, setup: 'seed + empty memory/instructions/style' }, async (r) => {
      await goSetup(r); await r.shot('coach-setup-empty'); await r.longShots('coach-setup-empty');
    });
    await scenario({ page: 'coach-setup', state: 'loading', delayWorker: 60000, setup: 'Setup → interview → answer chips → "writing" with worker delayed' }, async (r) => {
      await goSetup(r);
      if (await r.click('button:has-text("Let the coach interview you")', 'interview')) { const k = await answerInterview(r); r.log(`answered ${k} questions`); await wait(400); await r.shot('coach-setup-loading'); }
    });
    await scenario({ page: 'coach-setup', state: 'error', abortWorker: true, setup: 'Setup → interview → answer chips → worker aborted → error phase' }, async (r) => {
      await goSetup(r);
      if (await r.click('button:has-text("Let the coach interview you")', 'interview')) { const k = await answerInterview(r); r.log(`answered ${k} questions`); await wait(1500); await r.shot('coach-setup-error'); }
    });
  },

  // ----- PROFILE -----
  async profile() {
    await scenario({ page: 'profile', state: 'populated' }, async (r) => {
      await r.click(NAV('Profile'), 'Nav Profile'); await r.shot('profile-populated'); await r.longShots('profile-populated');
    });
    await scenario({ page: 'profile', state: 'populated', overrides: { lk_gamingLayer: true }, setup: 'seed + lk_gamingLayer=true' }, async (r) => {
      await r.click(NAV('Profile'), 'Nav Profile'); await r.shot('profile-populated-badges'); await r.longShots('profile-populated-badges');
    });
    await scenario({ page: 'profile', state: 'populated', overrides: states.lbs(), setup: 'seed + useKg=false' }, async (r) => {
      await r.click(NAV('Profile'), 'Nav Profile'); await r.shot('profile-populated-lbs');
    });
    await scenario({ page: 'profile', state: 'empty', overrides: { ...states.empty(), lk_gamingLayer: true } }, async (r) => {
      await r.click(NAV('Profile'), 'Nav Profile'); await r.shot('profile-empty'); await r.longShots('profile-empty');
    });
    unreachable.push({ page: 'profile', state: 'loading', subview: '-', reason: 'no network in ProfileScreen (page-map 2.16 L/X n/a)' });
    unreachable.push({ page: 'profile', state: 'error', subview: '-', reason: 'no network in ProfileScreen (page-map 2.16 L/X n/a)' });
  },

  // ----- SETTINGS -----
  async settings() {
    await scenario({ page: 'settings', state: 'populated' }, async (r) => {
      await goSettings(r);
      await r.shot('settings-populated'); await r.longShots('settings-populated');
      if (await r.click('button:has-text("CUSTOMIZE")', '"CUSTOMIZE"')) { await r.shot('settings-populated-layout-editor'); await r.longShots('settings-populated-layout-editor'); await r.click('[aria-label="Back"]', 'Back'); }
      if (await r.click('button:has-text("Switch to LBS")', '"Switch to LBS"')) { await r.shot('settings-populated-units-lbs'); await r.click('button:has-text("Switch to KG")', '"Switch to KG"'); }
      if (await r.click('button:has-text("RESET"), button:has-text("Reset")', 'RESET (arm, first tap)')) await r.shot('settings-populated-reset-armed');
    });
    await scenario({ page: 'settings', state: 'populated', overrides: states.light(), setup: 'seed + lk_theme=light' }, async (r) => {
      await goSettings(r); await r.shot('settings-populated-light-theme');
    });
    await scenario({ page: 'settings', state: 'error', abortWorker: true, setup: 'Settings → beta "Enter invite code" → Verify with worker aborted' }, async (r) => {
      await goSettings(r);
      if (await r.fill('input[placeholder="Enter invite code"]', 'BADCODE', 'beta code')) { await r.click('button:has-text("Verify")', 'Verify'); await wait(1200); await r.shot('settings-error', { note: 'settingsBetaErr after /beta-validate abort' }); }
    });
    await scenario({ page: 'settings', state: 'loading', delayWorker: 60000, setup: 'Settings → beta Verify with worker delayed' }, async (r) => {
      await goSettings(r);
      if (await r.fill('input[placeholder="Enter invite code"]', 'BADCODE', 'beta code')) { await r.click('button:has-text("Verify")', 'Verify'); await wait(500); await r.shot('settings-loading', { note: 'beta Verify pending (guest: sync/password/delete loading are signed-in only)' }); }
    });
    unreachable.push({ page: 'settings', state: 'empty', subview: '-', reason: 'no empty branch (page-map 2.17 E n/a)' });
  },

  // ----- SHOPPING & BUDGET -----
  async shoppingBudget() {
    await scenario({ page: 'shopping-budget', state: 'populated' }, async (r) => {
      await goShop(r);
      await r.shot('shopping-budget-populated'); await r.longShots('shopping-budget-populated');
      if (await r.fill('input[placeholder="e.g. Chicken Breast"]', 'Eggs', 'type duplicate "Eggs"')) { await r.shot('shopping-budget-populated-add-suggestions', { subview: 'typed item with store suggestions' }); await r.page.keyboard.press('Enter'); r.log('Enter (addItem)'); await wait(500); await r.shot('shopping-budget-populated-merge-dialog'); await r.dumpButtons('merge'); await r.click('button:has-text("Add Separate"), button:has-text("Cancel")', 'Add Separate'); }
      if (await r.click('button:has-text("Export")', '"Export"')) { await r.shot('shopping-budget-populated-export'); await r.escape(); }
      if (await r.click('button:has-text("Shop at")', '"Shop at"')) { await r.shot('shopping-budget-populated-shop-at-sheet'); await r.escape(); }
      await shopTab(r, 'Pantry'); await r.shot('shopping-budget-populated-pantry'); await r.longShots('shopping-budget-populated-pantry');
      await shopTab(r, 'My Stores'); await r.shot('shopping-budget-populated-stores'); await r.longShots('shopping-budget-populated-stores');
      await shopTab(r, 'Budget'); await r.shot('shopping-budget-populated-budget'); await r.longShots('shopping-budget-populated-budget');
      if (await r.click('button:has-text("Edit")', 'Budget "Edit" target')) { await r.shot('shopping-budget-populated-budget-edit-target'); await r.click('button:has-text("Cancel")', 'Cancel'); }
      if (await r.click('button:has-text("Add Purchase"), button:has-text("ADD PURCHASE"), button:has-text("Manual")', 'manual purchase opener')) { await r.shot('shopping-budget-populated-budget-add-purchase'); await r.escape(); }
      if (await r.click('button:has-text("Month")', 'history "Month"')) await r.shot('shopping-budget-populated-budget-month');
    });
    await scenario({ page: 'shopping-budget', state: 'empty', overrides: states.empty() }, async (r) => {
      await goShop(r);
      await r.shot('shopping-budget-empty');
      await shopTab(r, 'Pantry'); await r.shot('shopping-budget-empty-pantry');
      await shopTab(r, 'My Stores'); await r.shot('shopping-budget-empty-stores');
      await shopTab(r, 'Budget'); await r.shot('shopping-budget-empty-budget'); await r.longShots('shopping-budget-empty-budget');
    });
    await scenario({ page: 'shopping-budget', state: 'loading', delayWorker: 60000, setup: 'seed (store enabled) → type in list input → /store-search pending; Budget swaps/compare pending' }, async (r) => {
      await goShop(r);
      await r.fill('input[placeholder="e.g. Chicken Breast"]', 'Salmon', 'type "Salmon" (fires /store-search)'); await wait(900);
      await r.shot('shopping-budget-loading', { note: 'storeLoading' });
      await shopTab(r, 'Budget');
      if (await r.click('button:has-text("SMART SAVINGS"), button:has-text("Find swaps"), button:has-text("Swaps")', 'swaps trigger')) { await wait(500); await r.shot('shopping-budget-loading-budget-swaps'); }
      if (await r.click('button:has-text("Receipts")', '"Receipts"')) { await r.shot('shopping-budget-loading-budget-receipts', { subview: 'receipts history view' }); }
      r.unreachable('compare loading', 'price comparison (L44340) has no visible trigger with one enabled store; swaps fire automatically ("Finding savings...")');
    });
    await scenario({ page: 'shopping-budget', state: 'error', abortWorker: true, setup: 'seed → list input with /store-search aborted; Budget swaps aborted' }, async (r) => {
      await goShop(r);
      await r.fill('input[placeholder="e.g. Chicken Breast"]', 'Salmon', 'type "Salmon"'); await wait(1500);
      await r.shot('shopping-budget-error', { note: 'store search failed silently (catch)' });
      await shopTab(r, 'Budget');
      if (await r.click('button:has-text("SMART SAVINGS"), button:has-text("Find swaps"), button:has-text("Swaps")', 'swaps trigger')) { await wait(1500); await r.shot('shopping-budget-error-budget-swaps'); }
    });
  },

  // ----- GLOBAL -----
  async global() {
    // nav crop + voice button + toast
    await scenario({ page: 'global', state: 'populated', setup: 'seed populated' }, async (r) => {
      try { await r.page.locator('nav[aria-label="Main navigation"]').screenshot({ path: path.join(OUT, 'global-nav.png') }); index.push({ file: 'global-nav.png', page: 'global', state: 'populated', subview: 'Nav tab bar (element crop)', how: 'seed → Home', note: '' }); } catch (e) { debug.push('nav crop: ' + e.message); }
      const vb = r.page.locator('button[aria-label*="oice"], button[aria-label*="Microphone"], button[aria-label*="Talk"]').first();
      if (await vb.count()) { try { await vb.screenshot({ path: path.join(OUT, 'global-voice-button.png') }); index.push({ file: 'global-voice-button.png', page: 'global', state: 'populated', subview: 'VoiceButton (element crop)', how: 'seed → Home', note: '' }); } catch (e) { debug.push('voice crop: ' + e.message); } }
      else { await r.dumpButtons('looking for voice button'); r.unreachable('voice button', 'no button with aria-label containing voice/Microphone on Home; see debug.log dump'); }
      await r.shot('global-voice-button-home', { subview: 'VoiceButton in context (Home)' });
      if (await r.click('button[aria-label*="oice"], button[aria-label*="Microphone"]', 'tap voice button')) { await r.shot('global-voice-button-active'); await r.escape(); }
      // toast via a real app path: split builder "Add" with blank day name → "Name the day first"
      await r.click(NAV('Train'), 'Nav Train'); await r.click('button:has-text("Edit")', 'Edit split');
      if (await r.click('button:has-text("Add")', '"Add" day with blank name → toast')) { await r.shot('global-toast', { wait: 150, note: 'showToast "Name the day first…" (L9129)' }); }
      else { await r.page.evaluate(() => window.LOCKED && window.LOCKED.toast && window.LOCKED.toast('Saved')); r.log('window.LOCKED.toast("Saved")'); await r.shot('global-toast', { wait: 150 }); }
    });
    // saved toast after review save
    await scenario({ page: 'global', state: 'populated', overrides: states.activeWorkout(), setup: 'active workout → Resume → Finish → Save without reflection' }, async (r) => {
      await goWorkoutLog(r); await r.click('button:has-text("Finish")', 'Finish'); await r.click('button:has-text("Save without reflection")', 'Save without reflection'); await wait(200);
      await r.shot('global-saved-toast', { wait: 100, subview: '"Saved" toast on Home after save (L57987)' });
    });
    // tutorial overlay
    await scenario({ page: 'global', state: 'populated', overrides: states.tutorial(), setup: 'seed + lk_tutorialSeen removed' }, async (r) => {
      await wait(1000); await r.shot('global-tutorial-intro', { subview: 'TutorialOverlay intro' });
      for (let i = 1; i <= 7; i++) { if (await r.click('button:has-text("LET\'S GO"), button:has-text("Next"), button:has-text("NEXT"), button:has-text("Got it"), button:has-text("Continue")', 'tutorial advance')) await r.shot(`global-tutorial-step-${i}`); else break; }
    });
    // cold start: auth overlay → guest modal → onboarding
    await scenario({ page: 'global', state: 'cold-start', overrides: states.coldStart(), noBoot: true, setup: 'localStorage empty (cold start)' }, async (r) => {
      await r.has('#locked-auth-overlay', 8000); await wait(600);
      await r.shot('global-coldstart-auth-overlay', { subview: 'pre-React auth overlay' });
      if (await r.click('#locked-auth-overlay button:has-text("Continue without account")', '"Continue without account"')) { await r.shot('global-coldstart-guest-modal'); }
      if (await r.click('#locked-guest-modal button:has-text("CONTINUE AS GUEST")', '"CONTINUE AS GUEST" (reload)')) { await wait(2500); await r.shot('global-coldstart-after-guest', { note: 'enterGuestMode seeds Athlete profile + reload → Home with TutorialOverlay' }); }
    });
    await scenario({ page: 'global', state: 'onboarding', overrides: { ...states.coldStart(), lk_guestMode: '1' }, noBoot: true, setup: 'only lk_guestMode=1 (no profile) → React Onboarding' }, async (r) => {
      await r.has('button:has-text("GET STARTED")', 8000); await r.shot('global-onboarding-splash');
      if (await r.click('button:has-text("GET STARTED")', 'GET STARTED')) { await r.shot('global-onboarding-name');
        await r.fill('input[placeholder*="Alex"]', 'Cesco', 'name'); await r.fill('input[placeholder*="alex_lifts"]', 'cesco', 'username');
        if (await r.click('button:has-text("CONTINUE")', 'CONTINUE')) { await r.shot('global-onboarding-units');
          if (await r.click('button:has-text("CONTINUE")', 'CONTINUE')) { await wait(800); await r.shot('global-onboarding-ai-program'); await r.longShots('global-onboarding-ai-program'); } } }
    });
  },
};

// ---------- flows (video + step log) ----------
async function flow(n, slug, overrides, steps, opts = {}) {
  if (!want(`flow-${n}`) && !want('flows')) return;
  const ctx = await newCtx({ recordVideo: { dir: OUT, size: VP } });
  const page = await ctx.newPage();
  const net = await routeNetwork(page);
  await seedStorage(page, overrides || {});
  const t0 = Date.now();
  const log = [];
  let i = 0;
  const rec = async (step, selector, shotName) => { const t = Date.now() - t0; const entry = { step: ++i, action: step, selector, t_ms: t }; if (shotName) { await wait(400); const f = `flow-${n}-${shotName}.png`; await page.screenshot({ path: path.join(OUT, f) }); entry.screenshot = f; } log.push(entry); };
  try {
    if (opts.noBoot) { await page.goto(APP, { waitUntil: 'domcontentloaded' }); await wait(1500); } else await gotoApp(page);
    await rec('boot', APP, 'step0');
    await steps({ page, rec, net, click: async (sel, label, shot) => { await page.locator(sel).first().click({ timeout: 8000 }); await wait(350); await rec(label || `click`, sel, shot); }, fill: async (sel, v, label) => { await page.locator(sel).first().fill(v); await rec(label || `fill "${v}"`, sel); } });
    log.push({ step: ++i, action: 'success assertion', selector: '-', t_ms: Date.now() - t0, ok: true });
  } catch (e) {
    log.push({ step: ++i, action: 'FAILED: ' + e.message.split('\n')[0], selector: '-', t_ms: Date.now() - t0, ok: false });
    debug.push(`[flow-${n}] ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
    try { await page.screenshot({ path: path.join(OUT, `flow-${n}-FAILED.png`) }); } catch { }
  }
  await wait(600);
  const video = page.video();
  await ctx.close();
  const vpath = await video.path();
  const target = path.join(OUT, `flow-${n}-${slug}.webm`);
  fs.renameSync(vpath, target);
  fs.writeFileSync(path.join(OUT, `flow-${n}.json`), JSON.stringify({ flow: n, slug, video: path.basename(target), taps: log.filter(l => /^click|^tap|^select|Nav |"/.test(l.action) && !/fill|type|select/.test(l.action)).length, steps: log }, null, 2));
  index.push({ file: path.basename(target), page: `flow-${n}`, state: 'video', subview: slug, how: log.map(l => `${l.t_ms}ms ${l.action}`).join('; '), note: log.at(-1).ok ? 'ok' : log.at(-1).action });
  console.log(`done flow-${n} ${slug} ${log.at(-1).ok ? 'ok' : 'FAILED'}`);
}

async function numpad(f, sel, digits, label) {
  await f.click(sel, `${label} cell`);
  for (const d of digits) await f.click(`#lk-sheet-root button:has-text("${d}")`, `NumPad "${d}"`);
  await f.click('#lk-sheet-root button:has-text("DONE")', 'NumPad DONE');
}

const flows = async () => {
  // Flow 1 (1A cold start)
  await flow(1, 'guest-start-first-set', states.coldStart(), async (f) => {
    await f.page.waitForSelector('#locked-auth-overlay button:has-text("Continue without account")', { timeout: 10000 });
    await f.click('#locked-auth-overlay button:has-text("Continue without account")', '"Continue without account"', 'guest-modal');
    await f.click('#locked-guest-modal button:has-text("CONTINUE AS GUEST")', '"CONTINUE AS GUEST" (reload)');
    await f.page.waitForSelector(HOME_READY, { timeout: 20000 }); await wait(1200);
    await f.rec('home after reload', HOME_READY, 'home');
    if (await f.page.locator('button:has-text("Skip tutorial")').count()) await f.click('button:has-text("Skip tutorial")', '"Skip tutorial"', 'after-tutorial');
    await f.click('button:has-text("START WORKOUT")', 'Home "START WORKOUT"', 'train');
    await f.click('button:has-text("Quick Start")', '"Quick Start"', 'log-empty');
    await f.click('button:has-text("Add Exercise")', '"Add Exercise"', 'exlib');
    await f.fill('input[placeholder*="Search"]', 'Bench', 'type "Bench"');
    await f.click('button:has-text("Barbell Bench Press")', 'exercise row', 'detail-modal');
    await f.click('button:has-text("ADD TO WORKOUT")', '"ADD TO WORKOUT"', 'log-with-exercise');
    await numpad(f, 'button[aria-label="Set 1 weight"]', ['1', '0', '0'], 'Set 1 weight');
    await numpad(f, 'button[aria-label="Set 1 reps"]', ['8'], 'Set 1 reps');
    await f.click('button[aria-label="Mark set 1 done"]', 'Mark set 1 done', 'set-done');
    const ok = await f.page.evaluate(() => { const r = JSON.parse(localStorage.lk_activeWorkoutRows || '[]'); return r[0] && r[0].sets[0].w === '100' && r[0].sets[0].r === '8' && r[0].sets[0].done === true; });
    if (!ok) throw new Error('assertion: rows not persisted');
  }, { noBoot: true });

  // Flow 2
  const histNo111 = seedObj('lk_history').map(h => h.exercises ? { ...h, exercises: h.exercises.filter(e => String(e.id) !== '111') } : h);
  await flow(2, 'log-one-set', { lk_activeWorkout: { name: 'Push A', exIds: [111], blocks: [] }, lk_activeWorkoutRows: null, lk_activeWorkoutSec: 0, lk_history: histNo111 }, async (f) => {
    await f.click('button:has-text("Resume")', 'Resume dialog "Resume"', 'log');
    await numpad(f, 'button[aria-label="Set 1 weight"]', ['1', '0', '0'], 'Set 1 weight');
    await numpad(f, 'button[aria-label="Set 1 reps"]', ['8'], 'Set 1 reps');
    await f.page.locator('select[aria-label="Set 1 reps in reserve"]').first().selectOption('1'); await f.rec('select RIR 1', 'select[aria-label="Set 1 reps in reserve"]');
    await f.click('button[aria-label="Mark set 1 done"]', 'Mark set 1 done', 'set-done');
    const s = await f.page.evaluate(() => JSON.parse(localStorage.lk_activeWorkoutRows)[0].sets[0]);
    if (!(s.w === '100' && s.r === '8' && s.rir === '1' && s.done)) throw new Error('assertion: ' + JSON.stringify(s));
  });

  // Flow 3
  await flow(3, 'finish-review-save', states.activeWorkout(), async (f) => {
    await f.click('button:has-text("Resume")', 'Resume', 'log');
    const before = await f.page.evaluate(() => JSON.parse(localStorage.lk_history).length);
    await f.click('button:has-text("Finish")', '"Finish"', 'review');
    await f.click('button:has-text("Save without reflection")', '"Save without reflection"', 'home-saved');
    await f.page.waitForSelector('text=Saved', { timeout: 5000 });
    const after = await f.page.evaluate(() => JSON.parse(localStorage.lk_history).length);
    if (after !== before + 1) throw new Error('assertion: history length');
  });

  // Flow 4
  await flow(4, 'home-to-lift-chart', {}, async (f) => {
    await f.click('button:has-text("VIEW PROGRESS")', 'Home "VIEW PROGRESS"', 'progress');
    await f.click('[aria-label="Progress section"] button:has-text("PR Vault")', 'tab "PR Vault"', 'pr-vault');
    await f.click('[role=button]:has-text("Bench Press"), button:has-text("Bench Press")', 'lift row "Bench Press"', 'chart');
    await f.page.waitForSelector('svg polyline', { timeout: 5000 });
  });

  // Flow 5
  await flow(5, 'coach-message-reply', { lk_coachLastMsgs: [], lk_coachLastHist: [] }, async (f) => {
    await f.click(NAV('Coach'), 'Nav "Coach"', 'coach');
    await f.fill('[aria-label="Ask your coach"]', 'How should I progress bench?', 'type message');
    await f.click('button[aria-label="Send message to coach"]', 'Send', 'sent');
    const expected = COACH.replies[COACH.mapping.keywords.bench].content[0].text;
    await f.page.getByText(expected).waitFor({ timeout: 8000 }); await f.rec('reply visible', 'text=<fixture reply>', 'reply');
  });

  // Flow 6
  await flow(6, 'edit-split-start', {}, async (f) => {
    await f.click(NAV('Train'), 'Nav "Train"', 'train');
    await f.click('button:has-text("Edit")', 'split card "Edit"', 'builder');
    await f.fill('input[placeholder*="Split name"]', 'PPL v2', 'rename "PPL v2"');
    await f.click('button:has-text("SAVE SPLIT")', '"SAVE SPLIT"', 'saved');
    await f.click('button:has-text("Edit") >> xpath=preceding-sibling::button[1]', 'split card footer "Start"', 'day-sheet');
    await f.click('[role=button]:has-text("Push") >> visible=true >> nth=-1', 'day row "Push" (last visible [role=button] containing Push; sheet rows are div[role=button])', 'log');
    await f.page.waitForSelector('button[aria-label="Set 1 weight"]', { timeout: 5000 });
    const a = await f.page.evaluate(() => JSON.parse(localStorage.lk_activeWorkout).name);
    if (!/PPL v2/.test(a)) throw new Error('assertion: activeWorkout name ' + a);
  });

  // Flow 7
  await flow(7, 'shopping-add-budget', {}, async (f) => {
    await f.click(NAV('Fuel'), 'Nav "Fuel"', 'fuel');
    await f.click('button[aria-label="Shopping and budget"]', '"Shopping and budget"', 'shop');
    await f.fill('input[placeholder="e.g. Chicken Breast"]', 'Chicken Breast', 'type "Chicken Breast"');
    await f.page.keyboard.press('Enter'); await wait(400); await f.rec('Enter (addItem; "ADD TO LIST" is not a <button>)', 'input[placeholder="e.g. Chicken Breast"] Enter', 'added');
    await f.page.waitForSelector('text=Chicken Breast', { timeout: 4000 });
    await f.click('[aria-label="Shopping section"] button:has-text("Budget")', 'tab "Budget"', 'budget');
    await f.page.waitForSelector('text=WEEKLY BUDGET', { timeout: 5000 });
  });

  // Flow 8
  await flow(8, 'units-settings-home', {}, async (f) => {
    await f.click(NAV('Profile'), 'Nav "Profile"', 'profile');
    await f.click('button:has-text("Settings")', '"Settings"', 'settings');
    await f.click('button:has-text("Switch to LBS")', '"Switch to LBS"', 'lbs');
    await f.click(NAV('Home'), 'Nav "Home"', 'home');
    const u = await f.page.evaluate(() => JSON.parse(localStorage.lk_profile).useKg);
    if (u !== false) throw new Error('assertion: useKg');
  });
};

// ---------- main ----------
browser = await chromium.launch();
const order = ['home', 'progress', 'prVault', 'photos', 'cycle', 'trainHub', 'workoutLog', 'review', 'workoutDetail', 'exerciseLibrary', 'splitBuilder', 'cardio', 'coachChat', 'coachPlan', 'coachSetup', 'profile', 'settings', 'shoppingBudget', 'global'];
for (const k of order) { try { await pages[k](); } catch (e) { debug.push(`[${k}] TOP-LEVEL: ${e.stack}`); console.log('TOP-LEVEL FAIL', k, e.message); } }
try { await flows(); } catch (e) { debug.push('[flows] ' + e.stack); }
await browser.close();

// merge with previous index.json when running a subset
const idxPath = path.join(HERE, 'index.json');
let prev = { index: [], unreachable: [] };
if (ONLY.length && fs.existsSync(idxPath)) prev = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
const touched = new Set(index.map(i => i.file));
const touchedPages = new Set(index.map(i => i.page));
const touchedKeys = new Set(index.map(i => `${i.page}-${i.state}`));
const mergedIndex = [...prev.index.filter(i => !touched.has(i.file) && !touchedKeys.has(`${i.page}-${i.state}`)), ...index];
const seenU = new Set();
const mergedUnreach = [...prev.unreachable.filter(u => !touchedPages.has(u.page)), ...unreachable.filter(u => want(u.page) || touchedPages.has(u.page))].filter(u => { const k = JSON.stringify(u); if (seenU.has(k)) return false; seenU.add(k); return true; });
fs.writeFileSync(idxPath, JSON.stringify({ generated: new Date().toISOString(), index: mergedIndex, unreachable: mergedUnreach }, null, 2));
fs.writeFileSync(path.join(HERE, 'debug.log'), debug.join('\n\n'));
console.log(`\n${index.length} files this run, ${mergedIndex.length} total; ${debug.length} debug entries; ${mergedUnreach.length} unreachable notes`);
