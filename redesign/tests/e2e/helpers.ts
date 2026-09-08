// Shared helpers for the baseline suite (0H). Flow specs, page specs and global.spec.ts import from here.
// Everything that touches the app goes through fixtures/index.mjs (seed, routing, console capture).
import { test, expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  seedStorage, routeNetwork, collectConsoleErrors, gotoApp, states, forceNetworkError, APP_URL, HOME_READY,
} from '../fixtures/index.mjs';

export { seedStorage, routeNetwork, collectConsoleErrors, gotoApp, states, forceNetworkError, APP_URL, HOME_READY };

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TESTS_DIR = path.resolve(HERE, '..');
export const RESULTS_DIR = path.resolve(TESTS_DIR, process.env.RESULTS_DIR || 'baseline');

// ---------------------------------------------------------------------------------------------
// Selectors shared by every spec
// ---------------------------------------------------------------------------------------------
export const NAV = 'nav[aria-label="Main navigation"]';
export const navTab = (label: string) => `${NAV} button[aria-label^="${label}"]`;
export const SHELL = '.lk-shell';
export const SHEET_ROOT = '#lk-sheet-root';
export const VOICE_BTN = 'button[aria-label="Start voice command"]';
export const SCREEN_ERROR = 'text=Something went wrong on this screen';

// ---------------------------------------------------------------------------------------------
// Tap counter: tap() wraps click and counts; the flow tap count is the number of tap() calls made.
// ---------------------------------------------------------------------------------------------
const tapCounts = new WeakMap<Page, number>();
const tapLog = new WeakMap<Page, string[]>();

export async function tap(page: Page, target: string | Locator, opts: Parameters<Locator['click']>[0] = {}) {
  const loc = typeof target === 'string' ? page.locator(target).first() : target;
  await loc.click(opts);
  tapCounts.set(page, (tapCounts.get(page) || 0) + 1);
  const log = tapLog.get(page) || [];
  log.push(typeof target === 'string' ? target : String(target));
  tapLog.set(page, log);
  // let React commit + any sheet transition start
  await page.waitForTimeout(60);
}
export const tapCount = (page: Page) => tapCounts.get(page) || 0;
export const taps = (page: Page) => tapLog.get(page) || [];
export function resetTaps(page: Page) { tapCounts.set(page, 0); tapLog.set(page, []); }

// ---------------------------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------------------------
export type Overrides = Record<string, unknown>;
export interface BootOpts {
  /** wait for this selector instead of Home (e.g. the Resume dialog) */
  waitFor?: string;
  /** abort every external request from the first byte (error branches) */
  abortNetwork?: boolean;
  /** pass-through to seedStorage */
  seedOpts?: { anchor?: string; frozen?: boolean };
  /** do not wait for anything after goto (cold start) */
  raw?: boolean;
}
export interface Booted {
  errors: ReturnType<typeof collectConsoleErrors>;
  net: Awaited<ReturnType<typeof routeNetwork>>;
  seed: Record<string, string>;
  t0: number;
}

export async function boot(page: Page, overrides: Overrides = {}, opts: BootOpts = {}): Promise<Booted> {
  const errors = collectConsoleErrors(page);
  const net = await routeNetwork(page);
  if (opts.abortNetwork) forceNetworkError(net);
  const seed = await seedStorage(page, overrides, opts.seedOpts);
  page.on('dialog', d => d.dismiss().catch(() => {}));
  page.context().on('page', p => p.close().catch(() => {}));
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  resetTaps(page);
  const t0 = Date.now();
  if (opts.raw) {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  } else if (opts.waitFor) {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(opts.waitFor, { state: 'visible', timeout: 20000 });
    await page.waitForTimeout(150);
  } else {
    await gotoApp(page);
  }
  return { errors, net, seed, t0 };
}

/** Re-seed and reload (the init script re-seeds when the sessionStorage marker is gone). */
export async function reboot(page: Page, opts: { waitFor?: string } = {}) {
  await page.evaluate(() => { try { sessionStorage.removeItem('__lk_seeded__'); } catch (e) { /* ignore */ } });
  if (opts.waitFor) {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(opts.waitFor, { state: 'visible', timeout: 20000 });
    await page.waitForTimeout(150);
  } else {
    await gotoApp(page);
  }
}

export const ls = (page: Page, key: string) => page.evaluate((k) => {
  const v = localStorage.getItem(k); if (v === null) return null; try { return JSON.parse(v); } catch (e) { return v; }
}, key);

/** Console messages Chromium itself emits when the harness aborts a request (forceNetworkError). Not app errors. */
export const ABORT_NOISE = /Failed to load resource: net::ERR_FAILED|net::ERR_ABORTED/;
export function splitErrors(errors: Booted['errors'], opts: { ignoreAbortNoise?: boolean } = {}) {
  const console_ = errors.filter(e => e.type === 'console');
  return {
    console: opts.ignoreAbortNoise ? console_.filter(e => !ABORT_NOISE.test(e.text)) : console_,
    abortNoise: console_.filter(e => ABORT_NOISE.test(e.text)),
    page: errors.filter(e => e.type === 'pageerror'),
  };
}

export function appendJsonl(file: string, rec: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(rec) + '\n');
}
export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------------------------
// Flow metrics
// ---------------------------------------------------------------------------------------------
export interface FlowMeta { flow: number; slug: string; name: string; expectedTaps?: number; notes?: string }

/**
 * Runs a flow body, then records {taps, ms, console errors, page errors, pass} both as a test
 * attachment ('metrics') and as a line in RESULTS_DIR/flow-metrics.jsonl (7C reads the last line per flow).
 * `body` must return the Booted handle (for t0 and errors) plus optional extra fields.
 */
export async function runFlow(testInfo: TestInfo, page: Page, meta: FlowMeta,
  body: () => Promise<{ booted: Booted; extra?: Record<string, unknown> }>) {
  let pass = false; let err: unknown = null; let booted: Booted | null = null; let extra: Record<string, unknown> = {};
  let ms = -1;
  const start = Date.now();
  try {
    const r = await body();
    booted = r.booted; extra = r.extra || {};
    ms = Date.now() - booted.t0;
    pass = true;
  } catch (e) { err = e; ms = Date.now() - start; }
  const errs = booted ? splitErrors(booted.errors) : { console: [], page: [] };
  const rec = {
    ts: new Date().toISOString(), app: APP_URL, run: process.env.RESULTS_DIR || 'baseline',
    flow: meta.flow, slug: meta.slug, name: meta.name,
    taps: tapCount(page), expectedTaps: meta.expectedTaps ?? null, ms,
    consoleErrors: errs.console.length, pageErrors: errs.page.length,
    errors: [...errs.console, ...errs.page].map(e => e.text).slice(0, 20),
    unexpectedRequests: booted ? booted.net.unexpected : [],
    pass, failure: err ? String((err as Error).message || err).replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0] : null,
    tapLog: taps(page), notes: meta.notes || '', ...extra,
  };
  await testInfo.attach('metrics', { body: JSON.stringify(rec, null, 2), contentType: 'application/json' });
  appendJsonl(path.join(RESULTS_DIR, 'flow-metrics.jsonl'), rec);
  if (err) throw err;
  // console/pageerror checks are hard
  expect(errs.page, 'page errors: ' + JSON.stringify(errs.page, null, 2)).toEqual([]);
  expect(errs.console, 'console errors: ' + JSON.stringify(errs.console, null, 2)).toEqual([]);
  return rec;
}

// ---------------------------------------------------------------------------------------------
// NumPad helper (WorkoutLog)
// ---------------------------------------------------------------------------------------------
export async function numpadType(page: Page, digits: string) {
  for (const d of digits) await tap(page, `${SHEET_ROOT} button:text-is("${d}")`);
}
export async function numpadDone(page: Page) { await tap(page, `${SHEET_ROOT} button:has-text("DONE")`); }
/** The NumPad opens pre-filled with the current/recommended value (L9848) and has no clear key, only "del":
 *  clear it one backspace per character so a fresh number can be typed. Returns the number of del taps. */
export async function numpadClear(page: Page) {
  const display = page.locator(`${SHEET_ROOT} [role=group][aria-label$="entry"] [style*="2.5rem"]`).first();
  let n = 0;
  for (let i = 0; i < 8; i++) {
    const txt = (await display.innerText().catch(() => '--')).trim();
    if (!txt || txt === '--') break;
    await tap(page, `${SHEET_ROOT} button:has-text("del")`);
    n++;
  }
  return n;
}
export async function numpadValue(page: Page) {
  return (await page.locator(`${SHEET_ROOT} [role=group][aria-label$="entry"] [style*="2.5rem"]`).first().innerText().catch(() => '')).trim();
}

// ---------------------------------------------------------------------------------------------
// Page registry (18 pages). Entry paths from 00-inventory/page-map.md.
// ---------------------------------------------------------------------------------------------
export interface StateDef {
  seed?: Overrides;             // overrides on top of the populated seed
  bootOpts?: BootOpts;
  enter?: (page: Page) => Promise<void>;   // defaults to the page's enter()
  ready?: string;               // defaults to the page's ready
  assert: string[];             // selectors that must be visible in this state
  note?: string;
}
export interface ErrorDef extends StateDef {
  /** performs the action that hits the aborted network branch */
  trigger: (page: Page) => Promise<void>;
  /** soft assertion: text/selector expected once the branch fails */
  softAssert?: string[];
}
export interface PageDef {
  slug: string;
  name: string;
  component: string;
  seed?: Overrides;
  bootOpts?: BootOpts;
  enter: (page: Page) => Promise<void>;
  ready: string;
  populated: string[];
  empty: StateDef | { na: string };
  error: ErrorDef | { na: string };
  /** extra labels to skip during the interactive crawl (regex), beyond the global destructive list */
  crawlSkip?: RegExp;
  /** element root for the crawl (default .lk-shell) */
  root?: string;
  /** entry path description for global.spec nav test */
  path: string;
}

const RESUME = 'button:has-text("Resume"):not(:has-text("Resume Workout?"))';
const ACTIVE = () => states.activeWorkout();
const enterTrain = async (p: Page) => { await tap(p, navTab('Train')); };
const enterProgress = async (p: Page) => { await tap(p, 'button:has-text("VIEW PROGRESS")'); await p.waitForSelector('h1:has-text("PROGRESS")'); };
const progressTab = (label: string) => async (p: Page) => { await enterProgress(p); await tap(p, `[aria-label="Progress section"] button:has-text("${label}")`); };
const enterCoach = async (p: Page) => { await tap(p, navTab('Coach')); await p.waitForSelector('[aria-label="Ask your coach"], button[role=tab][aria-label="Chat"]'); };
const coachTab = (label: string) => async (p: Page) => { await enterCoach(p); await tap(p, `button[role=tab][aria-label="${label}"]`); };
const enterShop = async (p: Page) => { await tap(p, navTab('Fuel')); await tap(p, 'button[aria-label="Shopping and budget"]'); };
const enterResume = async (p: Page) => { await tap(p, RESUME); await p.waitForSelector('button[aria-label="Workout tools"]'); };

// A history entry with no exercises (WorkoutDetail empty branch, source L17503)
const emptyHistoryEntry = () => ([{
  id: 'h_empty', name: 'Empty Session', date: '9/7/2026', dateISO: '2026-09-07', sets: 0, vol: '0 kg', dur: '1 min', exercises: [], blocks: [],
}]);

export const PAGES: PageDef[] = [
  {
    slug: 'home', name: 'Home', component: 'HomeScreen L26220', path: 'boot → Home',
    enter: async () => {}, ready: 'text=TOTAL WORKOUTS',
    populated: ['text=Recent Workouts', 'button:has-text("START WORKOUT")', 'button:has-text("VIEW PROGRESS")'],
    empty: { seed: states.empty(), assert: ['text=/first split/i', 'button:has-text("Create a Split")'] },
    error: {
      // ProactiveTipCard fetches the worker on mount when the cached tip is stale (L17862). With the insight block
      // unhidden and the network aborted, the card must fail silently (L17930) and Home must still render.
      seed: { lk_homeLayout: { hidden: {} }, lk_proactiveTip: { date: '2020-01-01', text: 'stale' } },
      bootOpts: { abortNetwork: true },
      trigger: async (p) => { await p.waitForTimeout(800); },
      assert: ['text=TOTAL WORKOUTS'], softAssert: [],
      note: 'insight card fetch aborted; expected silent fallback (L17930)',
    },
  },
  {
    slug: 'progress', name: 'Progress', component: 'ProgressPage L28323', path: 'Home → VIEW PROGRESS',
    enter: enterProgress, ready: 'h1:has-text("PROGRESS")',
    populated: ['text=FEATURED LIFTS', 'text=Barbell Bench Press', 'text=BODY WEIGHT'],
    empty: { seed: states.empty(), assert: ['text=Log your body weight in the Fuel tab', 'text=Track your key lifts here'] },
    error: { na: 'only network branch is GoalsTab aiCall inside a goal detail (L27204); page data is local' },
  },
  {
    slug: 'pr-vault', name: 'PR Vault', component: 'PRHub L29165', path: 'Home → VIEW PROGRESS → PR Vault tab',
    enter: progressTab('PR Vault'), ready: 'h1:has-text("PR VAULT")',
    populated: ['[role=button]:has-text("Barbell Bench Press")', 'button:has-text("LOG A PR WITHOUT A WORKOUT")'],
    empty: { seed: states.empty(), assert: ['text=No PRs yet'] },
    error: { na: 'no network calls (page-map 2.3)' },
  },
  {
    slug: 'photos', name: 'Progress Photos', component: 'ProgressPhotos L30585', path: 'Home → VIEW PROGRESS → Photos tab',
    enter: progressTab('Photos'), ready: 'text=Progress Photos',
    populated: ['button:has-text("Week 5")', 'button:has-text("Camera")'],
    empty: { seed: states.empty(), assert: ['text=Start Your Transformation'] },
    error: {
      bootOpts: { abortNetwork: true },
      trigger: async (p) => {
        await tap(p, 'button:has-text("Week 5")');
        await tap(p, 'button:has-text("ANALYSE PHYSIQUE")');
        await p.waitForTimeout(1200);
      },
      assert: ['text=Progress Photos'],
      softAssert: ['text=/fail|unavailable|error|connection|try again|could not/i'],
      note: '/analyze-physique aborted (L30626)',
      crawlSkip: undefined,
    } as ErrorDef,
  },
  {
    slug: 'cycle', name: 'Cycle Tracker', component: 'CycleTrackerScreen L25108', path: 'Home → cycle card',
    // the LOG button on the Home cycle card is covered by the floating voice button (see SUMMARY); tap the card text instead
    enter: async (p) => { await tap(p, 'text=/Period in/'); await p.waitForSelector('button[aria-label="Cycle settings"]'); },
    ready: 'button[aria-label="Cycle settings"]',
    populated: ['text=CYCLE DAY', 'button:has-text("Log Period")', 'text=NEXT PERIOD'],
    empty: { seed: { lk_mcDays: {} }, assert: ['text=/Log symptoms and energy through a couple of cycles/'] },
    error: { na: 'no network calls (page-map 2.5)' },
  },
  {
    slug: 'train-hub', name: 'Train Hub', component: 'TrainHub L15013', path: 'Nav Train',
    enter: enterTrain, ready: 'h1:has-text("TRAIN")',
    populated: ['text=MY SPLITS (3)', 'button:has-text("Quick Start")', 'text=RECENT'],
    empty: { seed: states.empty(), assert: ['text=No splits yet', 'button:has-text("Build Manually")'] },
    error: { na: 'no network calls in the hub itself (page-map 2.6)' },
  },
  {
    slug: 'workout-log', name: 'Workout Log', component: 'WorkoutLog L10013', path: 'boot with lk_activeWorkout → Resume',
    seed: ACTIVE(), bootOpts: { waitFor: 'text=Resume Workout?' },
    enter: enterResume, ready: 'button[aria-label="Workout tools"]',
    populated: ['button[aria-label="Set 1 weight"]', 'button:has-text("Finish")', 'h2:has-text("PPL - Push")'],
    empty: {
      seed: { lk_activeWorkout: null, lk_activeWorkoutRows: null, lk_activeWorkoutSec: null }, bootOpts: {},
      enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("Quick Start")'); },
      assert: ['text=No exercises yet', 'button:has-text("Add Exercise")'],
    },
    error: {
      bootOpts: { waitFor: 'text=Resume Workout?', abortNetwork: true },
      trigger: async (p) => { await tap(p, 'button:has-text("AI Rec")'); await p.waitForTimeout(1000); },
      assert: ['button[aria-label="Workout tools"]'],
      softAssert: ['text=Could not get a recommendation'],
      note: 'AI set recommendation aiCall aborted (L13586)',
    },
    crawlSkip: /^(Finish|Discard)$/i,
  },
  {
    slug: 'review', name: 'Review', component: 'Review L15965', path: 'boot with lk_activeWorkout → Resume → Finish',
    seed: ACTIVE(), bootOpts: { waitFor: 'text=Resume Workout?' },
    enter: async (p) => { await enterResume(p); await tap(p, 'button:has-text("Finish")'); await p.waitForSelector('text=WORKOUT COMPLETE'); },
    ready: 'text=WORKOUT COMPLETE',
    populated: ['button:has-text("Save without reflection")', 'button:has-text("HOW DID IT FEEL?")', 'text=Barbell Bench Press'],
    empty: {
      // no completed sets → Review "done.length===0" branch (L16250)
      seed: { ...ACTIVE(), lk_activeWorkoutRows: [{ type: 'exercise', id: 111, name: 'Barbell Bench Press', muscle: 'Mid Chest', kg: null, sets: [
        { w: '', r: '', rL: '', rR: '', rir: '2', done: false, setType: 'normal', partials: '' }] }] },
      assert: ['text=WORKOUT COMPLETE', 'text=/0\\s*Sets|No sets|no completed|nothing logged|empty/i'],
    },
    error: {
      bootOpts: { waitFor: 'text=Resume Workout?', abortNetwork: true },
      trigger: async (p) => {
        await tap(p, 'button:has-text("HOW DID IT FEEL?")');
        for (const l of ['Ok', 'Good', 'Normal', '6h', 'Medium']) await tap(p, `button:text-matches("^3\\s*${l}$")`);
        await tap(p, 'button:has-text("GET AI COACH INSIGHT")');
        await p.waitForSelector('button:has-text("SAVE WORKOUT")', { timeout: 8000 });
      },
      assert: ['button:has-text("SAVE WORKOUT")'],
      softAssert: [],
      note: 'insight aiCall aborted → canned fallback text (L16126)',
    },
    crawlSkip: /Save without reflection|Skip and save|SAVE WORKOUT/i,
  },
  {
    slug: 'workout-detail', name: 'Workout Detail', component: 'WorkoutDetail L17084', path: 'Nav Train → History → row',
    enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("History")'); await tap(p, '[role=button]:has-text("PPL - Legs")'); },
    ready: 'button:has-text("Convert")',
    populated: ['h1:has-text("PPL - Legs")', 'text=EXERCISES', 'text=Barbell Squat'],
    empty: {
      seed: { lk_history: emptyHistoryEntry() },
      enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("History")'); await tap(p, '[role=button]:has-text("Empty Session")'); },
      ready: 'h1:has-text("Empty Session")',
      // v6 shows only the header, Delete and a stray "0" for a session without exercises; the "No exercises" copy (L17503) is edit-mode only
      assert: ['text=/no exercises/i'],
      note: 'expected finding: no empty-state copy outside edit mode',
    },
    error: { na: 'no network calls (page-map 2.9)' },
  },
  {
    slug: 'exercise-library', name: 'Exercise Library', component: 'ExLib L7761', path: 'Nav Train → Library tab',
    enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("Library")'); },
    ready: 'h1:has-text("Exercise Library")',
    populated: ['button:has-text("Chest")', 'input[placeholder="Search all exercises..."]', 'button:has-text("Create Custom Exercise")'],
    empty: {
      enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("Library")'); await p.fill('input[placeholder="Search all exercises..."]', 'zzzzqq'); },
      ready: 'text=Search Results',
      assert: ['text=No results'],
    },
    error: { na: 'only network branch is ExerciseDetailModal /exercise-detail (L7090); not reached from the Library tab in v6' },
  },
  {
    slug: 'split-builder', name: 'Split Builder', component: 'SplitBuilder L8782', path: 'Nav Train → split card Edit',
    enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("Edit")'); },
    ready: 'h1:has-text("Edit Split")',
    populated: ['input[value="PPL"]', 'button:has-text("SAVE SPLIT")', 'p[role=button]:has-text("Push")'],
    empty: {
      enter: async (p) => {
        await enterTrain(p); await tap(p, 'button:text-is("New")');
        await p.waitForSelector('h1:has-text("New Split")');
        await p.fill('input[placeholder="e.g. Push, Pull, Legs..."]', 'Push');
        await tap(p, 'button:text-is("Add")');
      },
      ready: 'h1:has-text("New Split")',
      assert: ['text=No exercises yet'],
    },
    error: {
      bootOpts: { abortNetwork: true },
      enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("AI Builder")'); await tap(p, '[role=button]:has-text("Chat with AI Coach")'); },
      ready: 'h1:has-text("AI Split Builder")',
      trigger: async (p) => {
        await p.fill('input[placeholder="Type your answer..."]', '3 days a week, push pull legs');
        // the Send button is covered by the floating voice button at 393px (see SUMMARY); Enter submits, else force the tap
        await p.press('input[placeholder="Type your answer..."]', 'Enter');
        await p.waitForTimeout(400);
        if ((await p.inputValue('input[placeholder="Type your answer..."]').catch(() => '')) !== '') await tap(p, 'button[aria-label="Send answer"]', { force: true });
        await p.waitForTimeout(1500);
      },
      assert: ['h1:has-text("AI Split Builder")'],
      softAssert: ['text=/error|failed|try again|connection|down/i'],
      note: 'AISplitBuilder POST aborted (L13993)',
    },
  },
  {
    slug: 'cardio', name: 'Cardio', component: 'CardioSection L56216', path: 'Nav Train → Cardio',
    enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("Cardio")'); },
    ready: 'h1:has-text("CARDIO")',
    populated: ['text=FAVORITES (1)', '[role=button][aria-label="Log Treadmill run"]'],
    empty: {
      seed: states.empty(),
      enter: async (p) => { await enterTrain(p); await tap(p, 'button:has-text("Cardio")'); await tap(p, 'button:has-text("History")'); },
      assert: ['text=No cardio yet'],
    },
    error: { na: 'no network calls (page-map 2.12)' },
  },
  {
    slug: 'coach-chat', name: 'Coach Chat', component: 'CoachScreen L49915 (chat)', path: 'Nav Coach',
    enter: enterCoach, ready: '[aria-label="Ask your coach"]',
    populated: ['text=Your bench went 60', 'button[aria-label="Send message to coach"]'],
    empty: { seed: { lk_coachLastMsgs: [], lk_coachLastHist: [] }, assert: ['button:has-text("Build me a training plan")', 'text=Ask me anything about your training'] },
    error: {
      seed: { lk_coachLastMsgs: [], lk_coachLastHist: [] }, bootOpts: { abortNetwork: true },
      trigger: async (p) => {
        await p.fill('[aria-label="Ask your coach"]', 'hello');
        await tap(p, 'button[aria-label="Send message to coach"]');
        await p.waitForSelector('button:has-text("Retry")', { timeout: 8000 });
      },
      assert: ['text=The coach is down. Not your fault.', 'button:has-text("Retry")'],
      note: 'worker POST aborted → error bubble + retry (L50098)',
    },
  },
  {
    slug: 'coach-plan', name: 'Coach Plan', component: 'CoachScreen L50957 (plan)', path: 'Nav Coach → Plan tab',
    enter: coachTab('Plan'), ready: 'button[role=tab][aria-label="Plan"][aria-selected="true"]',
    populated: ['text=THIS WEEK', 'button:has-text("Adjust this plan")', 'text=Phase 2 of 3'],
    empty: { seed: { lk_coachPlan: null }, assert: ['text=No plan yet'] },
    error: { na: 'no network calls; plan is parsed out of chat replies (page-map 2.14)' },
  },
  {
    slug: 'coach-setup', name: 'Coach Setup', component: 'CoachSetupPane L49483', path: 'Nav Coach → Setup tab',
    enter: coachTab('Setup'), ready: 'text=COACHING STYLE',
    populated: ['text=Left knee gets tight', 'button[role=switch][aria-label="Memory on"]', 'button:has-text("Let the coach interview you")'],
    empty: { seed: { lk_coachMemory: [] }, assert: ['text=Nothing remembered yet.'] },
    error: { na: 'CoachInterview POST (L49772) fires only after the six interview answers; not exercised in baseline' },
  },
  {
    slug: 'profile', name: 'Profile', component: 'ProfileScreen L30153', path: 'Nav Profile',
    enter: async (p) => { await tap(p, navTab('Profile')); }, ready: 'button:has-text("Settings")',
    populated: ['text=@cesco', 'text=Personal Records', 'text=Guest account'],
    empty: { seed: states.empty(), assert: ['text=@cesco', 'text=Workouts'] },
    error: { na: 'no network calls (page-map 2.16)' },
  },
  {
    slug: 'settings', name: 'Settings', component: 'SettingsScreen L32031', path: 'Nav Profile → Settings',
    enter: async (p) => { await tap(p, navTab('Profile')); await tap(p, 'button:has-text("Settings")'); },
    ready: 'h1:has-text("Settings")',
    populated: ['button:has-text("KG - Switch to LBS")', 'button:has-text("CUSTOMIZE")', 'text=DANGER ZONE'],
    empty: { na: 'settings has no empty branch (page-map 2.17)' },
    error: {
      bootOpts: { abortNetwork: true },
      trigger: async (p) => {
        await p.fill('input[placeholder="Enter invite code"]', 'TEST123');
        await tap(p, 'button:has-text("Verify")');
        await p.waitForTimeout(1000);
      },
      assert: ['h1:has-text("Settings")'],
      softAssert: ['text=/Invalid code|connection|failed|error/i'],
      note: '/beta-validate with network aborted. A local format check (validateBetaCode L2722) rejects TEST123 as "Invalid code" before any request; the remote .catch (L2751) calls onResult(true) — fail-open on network failure, not exercised here',
    },
    crawlSkip: /Replay Tutorial|SIGN UP|Full backup|Nutrition CSV/i,
  },
  {
    slug: 'shopping-budget', name: 'Shopping & Budget', component: 'ShoppingBudgetTab L45968', path: 'Nav Fuel → shop icon',
    enter: enterShop, ready: 'text=SHOP & BUDGET',
    populated: ['text=Chicken thighs', 'button:has-text("ADD TO LIST")', '[aria-label="Shopping section"] button:has-text("Budget")'],
    empty: { seed: states.empty(), assert: ['text=Your list is empty'] },
    error: {
      bootOpts: { abortNetwork: true },
      trigger: async (p) => {
        // an enabled store makes typing fire /store-search (L42458); aborted → silent catch
        await p.fill('input[placeholder="e.g. Chicken Breast"]', 'Chicken');
        await p.waitForTimeout(1200);
      },
      assert: ['text=SHOP & BUDGET', 'button:has-text("ADD TO LIST")'],
      softAssert: [],
      note: '/store-search aborted (L42458); expected silent fallback',
    },
  },
];

export const pageBySlug = (slug: string) => {
  const p = PAGES.find(x => x.slug === slug);
  if (!p) throw new Error('unknown page slug ' + slug);
  return p;
};

// ---------------------------------------------------------------------------------------------
// Interactive-element crawl
// ---------------------------------------------------------------------------------------------
export const DESTRUCTIVE = /\b(delete|reset|sign\s?out|log\s?out|clear|remove|discard|forget|unpin|start fresh|sign up|sign in)\b/i;
export const INTERACTIVE = 'button,[role=button],a,input,select,textarea,[tabindex]';

interface ElInfo { sig: string; path: string; tag: string; role: string; aria: string; text: string; label: string; w: number; h: number; x: number; y: number; href: string; type: string; selected: boolean }

/** Enumerate visible interactive elements inside `root`, excluding nav + voice button. Runs in page. */
export async function enumerateInteractive(page: Page, root = SHELL, exclude: string[] = ['nav', VOICE_BTN]): Promise<ElInfo[]> {
  return page.evaluate(({ root, sel, excl }) => {
    const r = document.querySelector(root) || document.body;
    const seen: Record<string, number> = {};
    const out: ElInfo[] = [];
    const cssPath = (el: Element) => {
      const parts: string[] = [];
      let e: Element | null = el;
      while (e && e !== r && e.parentElement) {
        const parent: Element = e.parentElement;
        const idx = Array.prototype.indexOf.call(parent.children, e) + 1;
        parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${idx})`);
        e = parent;
      }
      return root + ' > ' + parts.join(' > ');
    };
    for (const el of Array.from(r.querySelectorAll(sel))) {
      if (excl.some(x => el.closest(x))) continue;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || cs.visibility === 'hidden' || cs.display === 'none' || cs.pointerEvents === 'none') continue;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') continue;
      if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'hidden') continue;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || '';
      const aria = el.getAttribute('aria-label') || '';
      const text = ((el as HTMLElement).innerText || (el as HTMLInputElement).value || (el as HTMLInputElement).placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      const base = `${tag}|${role}|${aria}|${text}`;
      seen[base] = (seen[base] || 0) + 1;
      out.push({
        sig: `${base}#${seen[base]}`, path: cssPath(el), tag, role, aria, text, label: aria || text || (el as HTMLInputElement).placeholder || '',
        w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.left), y: Math.round(rect.top),
        href: (el as HTMLAnchorElement).href || '', type: (el as HTMLInputElement).type || '',
        selected: el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-current') === 'true',
      });
    }
    return out;
  }, { root, sel: INTERACTIVE, excl: exclude });
}

/** Is the page's ready element covered by something else (sheet backdrop, modal)? Hit-tests its centre. */
async function coveredBy(page: Page, ready: string): Promise<string | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel.replace(/^text=/, '')) as HTMLElement | null;
    let target: Element | null = el;
    if (!target) {
      // text= selectors: find the element containing that text
      const t = sel.startsWith('text=') ? sel.slice(5).replace(/^\/|\/$/g, '') : null;
      if (t) target = Array.from(document.querySelectorAll('h1,h2,h3,p,span,div,button')).find(x => (x as HTMLElement).innerText && (x as HTMLElement).innerText.trim().startsWith(t) && x.children.length === 0) || null;
    }
    if (!target) return null;
    target.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = target.getBoundingClientRect(); if (r.width === 0) return null;
    const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1));
    if (!hit || hit === target || target.contains(hit) || hit.contains(target)) return null;
    if (hit.closest('nav') || hit.closest('.lk-statusbar-scrim') || hit.closest('[aria-label="Start voice command"]')) return null;
    return hit.tagName.toLowerCase() + (hit.getAttribute('aria-label') ? `[aria-label="${hit.getAttribute('aria-label')}"]` : '') + (hit.getAttribute('role') ? `[role=${hit.getAttribute('role')}]` : '') + ' ' + ((hit.getAttribute('style') || '').slice(0, 80));
  }, ready).catch(() => null);
}

/** After Escape: if an overlay still covers the page, try Close / Cancel / Done, then a backdrop tap. Returns what worked. */
async function sheetOpen(page: Page) {
  return page.evaluate(() => {
    const sr = document.getElementById('lk-sheet-root'); if (!sr) return false;
    return Array.from(sr.children).some(c => { const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  }).catch(() => false);
}
async function dismissOverlays(page: Page, ready: string): Promise<string | null> {
  // a NumPad / action sheet in the portal root covers the lower half without covering the page header
  if (await sheetOpen(page)) {
    for (const c of [`${SHEET_ROOT} button:text-is("CANCEL")`, `${SHEET_ROOT} button:text-is("Cancel")`, `${SHEET_ROOT} [aria-label^="Close"]`, `${SHEET_ROOT} button:text-is("DONE")`, `${SHEET_ROOT} button:text-is("Done")`]) {
      const loc = page.locator(c).last();
      if (await loc.isVisible().catch(() => false)) { await loc.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(200); if (!(await sheetOpen(page))) return c; }
    }
    if (await sheetOpen(page)) { await page.mouse.click(4, 120).catch(() => {}); await page.waitForTimeout(200); }
    if (await sheetOpen(page)) return 'unresolved (sheet root)';
    if (!(await coveredBy(page, ready))) return 'sheet closed';
  }
  if (!(await coveredBy(page, ready))) return null;
  const candidates = [
    `${SHEET_ROOT} [aria-label^="Close"]`, `[role=dialog] [aria-label^="Close"]`, `[aria-label^="Close"]`, `[aria-label="Back"]`,
    `${SHEET_ROOT} button:text-is("Cancel")`, `${SHEET_ROOT} button:text-is("Done")`, `${SHEET_ROOT} button:text-is("CANCEL")`, `button:text-is("Cancel")`, `button:text-is("Done")`,
  ];
  for (const c of candidates) {
    const loc = page.locator(c).last();
    if (await loc.isVisible().catch(() => false)) {
      await loc.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(200);
      if (!(await coveredBy(page, ready))) return c;
    }
  }
  await page.mouse.click(4, 120).catch(() => {}); // backdrop above the shell content
  await page.waitForTimeout(200);
  if (!(await coveredBy(page, ready))) return 'backdrop';
  return 'unresolved';
}

async function domSnapshot(page: Page, root = SHELL) {
  return page.evaluate((root) => {
    const r = document.body; void root;
    const sheet = document.getElementById('lk-sheet-root');
    const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
    const ae = document.activeElement;
    const aePath: string[] = []; let e: Element | null = ae;
    while (e && e.parentElement && aePath.length < 12) { aePath.unshift(String(Array.prototype.indexOf.call(e.parentElement.children, e))); e = e.parentElement; }
    return [hash(r.innerHTML), hash((r as HTMLElement).innerText || ''), document.querySelectorAll('*').length, sheet ? hash(sheet.innerHTML) : -1,
      ae ? ae.tagName + '@' + aePath.join('.') + (ae.getAttribute('aria-label') || '') + ((ae as HTMLInputElement).value || '') : '',
      document.body.className, (document.scrollingElement || document.body).scrollTop].join('|');
  }, root);
}

export interface CrawlResult {
  clicked: { label: string; sig: string; responded: boolean; navigatedAway: boolean; blocked?: string }[];
  skipped: { label: string; reason: string }[];
  nonResponders: string[];
  blocked: { label: string; by: string }[];
  recoveries: number;
  overlays: { after: string; closedBy: string }[];
  truncated: boolean;
  total: number;
  ms: number;
}

/**
 * Click every visible interactive element inside the page root (excluding nav + voice button), up to `cap`
 * clicks, re-enumerating after each click so tab switches expose their content. Escape after each click closes
 * sheets; if the page's `ready` selector is gone we recover by reseed+reload+enter. Destructive labels are skipped.
 */
export async function crawlInteractive(page: Page, def: PageDef, state: { seed?: Overrides; bootOpts?: BootOpts; enter?: (p: Page) => Promise<void>; ready?: string },
  opts: { cap?: number; budgetMs?: number } = {}): Promise<CrawlResult> {
  const cap = opts.cap ?? 60;
  const budget = opts.budgetMs ?? 42_000;
  const start = Date.now();
  const ready = state.ready || def.ready;
  const enter = state.enter || def.enter;
  const root = def.root || SHELL;
  const res: CrawlResult = { clicked: [], skipped: [], nonResponders: [], blocked: [], recoveries: 0, overlays: [], truncated: false, total: 0, ms: 0 };
  const visited = new Set<string>();
  const skipRe = def.crawlSkip;

  const isReady = async () => page.locator(ready).first().isVisible().catch(() => false);
  const recover = async () => {
    res.recoveries++;
    await reboot(page, { waitFor: (state.bootOpts || def.bootOpts || {}).waitFor });
    await enter(page);
    await page.waitForSelector(ready, { state: 'visible', timeout: 10000 });
  };

  let clicks = 0;
  while (clicks < cap) {
    if (Date.now() - start > budget) { res.truncated = true; break; }
    const els = await enumerateInteractive(page, root);
    res.total = Math.max(res.total, els.length);
    const next = els.find(e => !visited.has(e.sig));
    if (!next) break;
    visited.add(next.sig);
    const label = next.label || `${next.tag}${next.role ? '[' + next.role + ']' : ''}`;
    if (DESTRUCTIVE.test(label) || (skipRe && skipRe.test(label))) { res.skipped.push({ label, reason: 'destructive/allowlisted label' }); continue; }
    if (next.selected) { res.skipped.push({ label, reason: 'already selected (aria-selected/aria-current)' }); continue; }
    if (next.tag === 'a' && /^https?:/.test(next.href) && !next.href.startsWith(page.url().split('/tests/')[0])) { res.skipped.push({ label, reason: 'external link ' + next.href }); continue; }
    if (next.type === 'file') { res.skipped.push({ label, reason: 'file input' }); continue; }
    clicks++;
    const before = await domSnapshot(page, root);
    let blocked = '';
    try {
      try {
        await page.locator(next.path).first().click({ timeout: 4000 });
      } catch (e1) {
        // the element may have re-rendered (path changed) or be mid-animation: re-enumerate and retry once by signature
        const m1 = String((e1 as Error).message || e1);
        if (!/not visible|not stable|detached|waiting for locator/.test(m1)) throw e1;
        await page.waitForTimeout(350);
        const again = (await enumerateInteractive(page, root)).find(e => e.sig === next.sig);
        if (!again) throw e1;
        await page.locator(again.path).first().click({ timeout: 4000 });
      }
    } catch (e) {
      const msg = String((e as Error).message || e).replace(/\u001b\[[0-9;]*m/g, '');
      const lines = msg.split('\n');
      const line = lines.find(l => /intercepts pointer events/.test(l)) || [...lines].reverse().find(l => /not visible|not stable|outside of the viewport|detached|not enabled|waiting for/.test(l));
      blocked = line ? line.replace(/^\s*-\s*/, '').trim().slice(0, 200) : msg.split('\n')[0].slice(0, 160);
      res.blocked.push({ label, by: blocked });
    }
    await page.waitForTimeout(220);
    let after = await domSnapshot(page, root);
    // slow feedback (toast fade-in, deferred state): re-check once before calling it a non-responder
    if (after === before) { await page.waitForTimeout(600); after = await domSnapshot(page, root); }
    const responded = before !== after;
    // close whatever opened (sheet, modal, dropdown): Escape, then Close/Cancel/Done, then the backdrop
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(120);
    const overlayClosedBy = await dismissOverlays(page, ready);
    if (overlayClosedBy) res.overlays.push({ after: label, closedBy: overlayClosedBy });
    let navigatedAway = false;
    if (!(await isReady()) || (await coveredBy(page, ready)) || (await sheetOpen(page))) { navigatedAway = true; await recover(); }
    res.clicked.push({ label, sig: next.sig, responded, navigatedAway, ...(blocked ? { blocked } : {}) });
    if (!responded && !blocked) res.nonResponders.push(label);
  }
  if (clicks >= cap) res.truncated = res.truncated || (await enumerateInteractive(page, root)).some(e => !visited.has(e.sig));
  res.ms = Date.now() - start;
  return res;
}

// ---------------------------------------------------------------------------------------------
// Page suite: the body of every e2e/pages/<slug>.spec.ts
// ---------------------------------------------------------------------------------------------
export function recordPage(slug: string, test_: string, data: Record<string, unknown>) {
  appendJsonl(path.join(RESULTS_DIR, 'page-metrics.jsonl'), { ts: new Date().toISOString(), run: process.env.RESULTS_DIR || 'baseline', slug, test: test_, ...data });
}

async function bootState(page: Page, def: PageDef, st: StateDef | undefined) {
  const seed = { ...(def.seed || {}), ...((st && st.seed) || {}) };
  const bootOpts = (st && st.bootOpts) || def.bootOpts || {};
  return boot(page, seed, bootOpts);
}

function hardErrorChecks(b: Booted) {
  const errs = splitErrors(b.errors);
  expect(errs.page, 'page errors: ' + JSON.stringify(errs.page, null, 2)).toEqual([]);
  expect(errs.console, 'console errors: ' + JSON.stringify(errs.console, null, 2)).toEqual([]);
}

export function pageSuite(slug: string) {
  const def = pageBySlug(slug);
  test.describe(`page ${def.slug} (${def.component})`, () => {
    test.describe.configure({ timeout: 60_000 });

    test(`${def.slug}: loads with populated seed`, async ({ page }, testInfo) => {
      const b = await bootState(page, def, undefined);
      await def.enter(page);
      await expect(page.locator(def.ready).first()).toBeVisible();
      for (const s of def.populated) await expect.soft(page.locator(s).first(), s).toBeVisible();
      await expect(page.locator(SCREEN_ERROR)).toHaveCount(0);
      await page.waitForTimeout(300);
      const errs = splitErrors(b.errors);
      const rec = { state: 'populated', ready: true, populatedChecks: def.populated, consoleErrors: errs.console.length, pageErrors: errs.page.length, errors: b.errors.map(e => e.text), unexpected: b.net.unexpected };
      await testInfo.attach('page-state', { body: JSON.stringify(rec, null, 2), contentType: 'application/json' });
      recordPage(def.slug, 'populated', rec);
      hardErrorChecks(b);
    });

    if ('na' in def.empty) {
      test(`${def.slug}: empty state N/A (${def.empty.na})`, async () => { /* documented: no empty branch */ });
    } else {
      const st = def.empty;
      test(`${def.slug}: renders empty state`, async ({ page }, testInfo) => {
        const b = await bootState(page, def, st);
        await (st.enter || def.enter)(page);
        await expect(page.locator(st.ready || def.ready).first()).toBeVisible();
        for (const s of st.assert) await expect.soft(page.locator(s).first(), s).toBeVisible();
        await expect(page.locator(SCREEN_ERROR)).toHaveCount(0);
        const errs = splitErrors(b.errors);
        const rec = { state: 'empty', checks: st.assert, consoleErrors: errs.console.length, pageErrors: errs.page.length, errors: b.errors.map(e => e.text) };
        await testInfo.attach('page-state', { body: JSON.stringify(rec, null, 2), contentType: 'application/json' });
        recordPage(def.slug, 'empty', rec);
        hardErrorChecks(b);
      });
    }

    if ('na' in def.error) {
      test(`${def.slug}: error state N/A (${def.error.na})`, async () => { /* documented: no network branch */ });
    } else {
      const st = def.error;
      test(`${def.slug}: renders error state (network aborted)`, async ({ page }, testInfo) => {
        const b = await bootState(page, def, st);
        await (st.enter || def.enter)(page);
        await expect(page.locator(st.ready || def.ready).first()).toBeVisible();
        await st.trigger(page);
        for (const s of st.assert) await expect.soft(page.locator(s).first(), s).toBeVisible();
        const softHits: Record<string, boolean> = {};
        for (const s of st.softAssert || []) {
          const vis = await page.locator(s).first().isVisible().catch(() => false);
          softHits[s] = vis;
          expect.soft(vis, `error feedback expected: ${s}`).toBe(true);
        }
        await expect(page.locator(SCREEN_ERROR)).toHaveCount(0);
        const errs = splitErrors(b.errors, { ignoreAbortNoise: true });
        const rec = { state: 'error', note: st.note, checks: st.assert, softChecks: softHits, consoleErrors: errs.console.length, pageErrors: errs.page.length, abortNoise: errs.abortNoise.length, errors: [...errs.console, ...errs.page].map(e => e.text) };
        await testInfo.attach('page-state', { body: JSON.stringify(rec, null, 2), contentType: 'application/json' });
        recordPage(def.slug, 'error', rec);
        expect(errs.page, 'page errors: ' + JSON.stringify(errs.page, null, 2)).toEqual([]);
        expect(errs.console, 'console errors (abort noise excluded): ' + JSON.stringify(errs.console, null, 2)).toEqual([]);
      });
    }

    test(`${def.slug}: every interactive element responds`, async ({ page }, testInfo) => {
      const b = await bootState(page, def, undefined);
      await def.enter(page);
      await expect(page.locator(def.ready).first()).toBeVisible();
      const crawl = await crawlInteractive(page, def, {});
      const errs = splitErrors(b.errors);
      const rec = { state: 'interactive', ...crawl, consoleErrors: errs.console.length, pageErrors: errs.page.length, errors: b.errors.map(e => e.text) };
      await testInfo.attach('interactive', { body: JSON.stringify(rec, null, 2), contentType: 'application/json' });
      recordPage(def.slug, 'interactive', rec);
      expect.soft(crawl.nonResponders, 'non-responders (no DOM change after click)').toEqual([]);
      expect.soft(crawl.blocked, 'clicks intercepted by another element').toEqual([]);
      hardErrorChecks(b);
    });
  });
}
