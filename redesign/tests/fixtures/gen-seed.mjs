// Deterministic seed generator for LOCKED v6 localStorage.
// Usage:  node gen-seed.mjs [YYYY-MM-DD]   → writes seed-data.json next to this file.
//         import { generateSeed } from './gen-seed.mjs'  → generateSeed(anchorISO) returns the key→string map.
//
// Anchor: every date is computed relative to ANCHOR ("today"). Default anchor is 2026-09-08
// (the day the fixtures were frozen). Pass another ISO day (or SEED_ANCHOR env) to regenerate,
// or call generateSeed(todayISO) at test time so "today"-gated keys (proactive tip, feedback,
// throwback dismissal) stay valid. Randomness comes from a fixed mulberry32 seed, so the same
// anchor always yields byte-identical output.
//
// Every value is the exact string to store: JSON.stringify'd for keys read via ld() (storage-keys.md
// L2417), raw for lk_guestMode (storage-keys.md §A, page-map boot gate 4).
// Exercise ids/names come from exercise-db.json, extracted from GROUPS (source L2975-L4257).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXDB = JSON.parse(fs.readFileSync(path.join(HERE, 'exercise-db.json'), 'utf8'));
const EX = Object.fromEntries(EXDB.map(e => [e.id, e]));

export const DEFAULT_ANCHOR = '2026-09-08';

// ---------- helpers ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const MS_DAY = 86400000;
function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; }
function dayUTC(iso, hour = 17, min = 30) { const { y, m, d } = parseISO(iso); return Date.UTC(y, m - 1, d, hour, min, 0); }
function addDays(iso, n) { const t = dayUTC(iso, 12) + n * MS_DAY; const dt = new Date(t); return dt.toISOString().slice(0, 10); }
function locale(iso) { const { y, m, d } = parseISO(iso); return `${m}/${d}/${y}`; }               // en-US toLocaleDateString L1961/L16056
function shortDate(iso) { const { m, d } = parseISO(iso); return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] + ' ' + d; } // cardio L56436
function isoTS(iso, hour = 17, min = 30) { return new Date(dayUTC(iso, hour, min)).toISOString(); }
function fmtW(kg) { return String(Math.round(kg * 2) / 2).replace(/\.0$/, ''); }               // "100" / "22.5"
function ex(id) { const e = EX[id]; if (!e) throw new Error('unknown exercise id ' + id); return e; }

// 1x1 JPEG (progress photo thumbs are base64 data URLs, storage-keys.md §B)
const TINY_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

// ---------- programme ----------
// [exId, workingSets, startKg, weeklyIncKg, repsLow, repsHigh]
const PPL = {
  Push: [[111, 4, 60, 2.5, 5, 8], [302, 3, 20, 1, 8, 10], [103, 3, 12.5, 0.5, 10, 12], [311, 3, 8, 0.5, 12, 15], [411, 3, 25, 1, 10, 12]],
  Pull: [[221, 4, 90, 5, 4, 6], [202, 3, 50, 2.5, 8, 10], [213, 3, 45, 2.5, 10, 12], [321, 3, 15, 1, 12, 15], [503, 3, 25, 1, 8, 10]],
  Legs: [[701, 4, 75, 2.5, 5, 8], [801, 3, 65, 2.5, 8, 10], [703, 3, 140, 5, 10, 12], [802, 3, 40, 2.5, 10, 12], [1101, 3, 60, 2.5, 12, 15]],
};
const DAY_ORDER = ['Push', 'Pull', 'Legs'];

export function generateSeed(anchor = DEFAULT_ANCHOR) {
  const rnd = mulberry32(20260908);
  const today = anchor;
  const yesterday = addDays(today, -1);

  // ---- splits (storage-keys.md §A lk_splits) ----
  const splitBase = dayUTC(addDays(today, -45), 9, 0);
  const splits = [
    { id: 's' + splitBase, name: 'PPL', days: DAY_ORDER.map(n => ({ name: n, exIds: PPL[n].map(r => r[0]), blocks: [] })), created: locale(addDays(today, -45)) },
    { id: 's' + (splitBase + 3600000), name: 'Upper / Lower', days: [
      { name: 'Upper', exIds: [111, 211, 302, 202, 503], blocks: [] },
      { name: 'Lower', exIds: [701, 801, 703, 803, 1102], blocks: [] },
    ], created: locale(addDays(today, -30)) },
    { id: 's' + (splitBase + 7200000), name: 'Full Body 3x', days: [
      { name: 'Day A', exIds: [701, 111, 213, 311, 1101], blocks: [{ title: 'Warm-up', notes: '5 min bike, hip openers', duration: '5 min' }] },
      { name: 'Day B', exIds: [221, 302, 202, 802, 503], blocks: [] },
      { name: 'Day C', exIds: [703, 113, 216, 321, 411], blocks: [] },
    ], created: locale(addDays(today, -12)) },
  ];

  // ---- 18 lifting sessions: 3/week for 6 weeks, newest = yesterday ----
  // Offsets (days back): week w ∈ 0..5 → w*7 + {1,3,5}. Newest first. Day type cycles Legs,Pull,Push backwards.
  const sessions = [];
  let k = 0;
  for (let w = 0; w < 6; w++) {
    for (const off of [1, 3, 5]) {
      const back = w * 7 + off;
      const iso = addDays(today, -back);
      const dayName = DAY_ORDER[(2 - k) % 3 < 0 ? ((2 - k) % 3) + 3 : (2 - k) % 3]; // k=0 → Legs, 1 → Pull, 2 → Push, ...
      const weekIdx = 5 - w; // 0 = oldest week, 5 = newest → progression
      const exercises = PPL[dayName].map(([id, nSets, startKg, inc, rLo, rHi]) => {
        const e = ex(id);
        const load = startKg + inc * weekIdx;
        const sets = [];
        for (let s = 0; s < nSets; s++) {
          const reps = Math.max(rLo, rHi - s - (rnd() < 0.3 ? 1 : 0)); // fatigue drop across sets
          const wkg = s === nSets - 1 && nSets === 4 ? load - inc * 2 : load; // back-off set on 4-set compounds
          sets.push({ w: fmtW(wkg), r: String(reps), rir: s === nSets - 1 ? '1' : '2', done: true, setType: 'normal', partials: '', rL: '', rR: '' });
        }
        if (nSets === 4) sets.unshift({ w: fmtW(Math.round(load * 0.5 / 2.5) * 2.5), r: '8', rir: '5', done: true, setType: 'warmup', partials: '', rL: '', rR: '' });
        return { id, name: e.name, muscle: e.muscle, sets };
      });
      let vol = 0, nSets = 0;
      exercises.forEach(x => x.sets.forEach(s => { if (s.setType !== 'warmup') { vol += parseFloat(s.w) * parseInt(s.r, 10); nSets++; } }));
      const dur = 48 + Math.floor(rnd() * 14);
      sessions.push({
        id: 'w_' + dayUTC(iso, 18, 5),
        name: 'PPL - ' + dayName,
        sets: nSets,
        vol: Math.round(vol) + ' kg',
        dur: dur + ' min',
        date: locale(iso),
        dateISO: iso,
        exercises,
        blocks: null,
        reflection: k % 4 === 0 ? { energy: 4, focus: 4, pump: 3, difficulty: 3, enjoyment: 4 } : null,
        note: k === 0 ? 'Squats felt fast. Left knee fine.' : (k === 5 ? 'Deload on pulldown, shoulder tight.' : ''),
        aiInsight: null,
      });
      k++;
    }
  }

  // ---- cardio records (source L56432-L56465), on non-lifting days ----
  function cardio(iso, modality, name, minutes, distanceM, machine, environment, avgHr, rpe, kcal, legacy) {
    return {
      id: 'w_' + dayUTC(iso, 7, 15), type: 'cardio', name, date: shortDate(iso), dateISO: iso, dur: minutes + ' min',
      schemaVersion: 2, modality, durationSec: minutes * 60, distanceM, surface: environment === 'outdoor' ? 'road' : 'machine',
      environment, machine, metrics: { avgHr: String(avgHr), rpe: String(rpe) },
      heartRate: { avg: avgHr }, intensity: { rpe, estMET: Math.round(kcal / minutes / 1.1 * 10) / 10, talkTest: null }, fasted: false,
      calories: { value: kcal, net: kcal - Math.round(minutes * 1.2), gross: kcal, range: [kcal - 40, kcal + 40], method: 'met-lookup', tier: 4, confidence: 'medium', basis: 'net', estimated: true },
      favoriteId: null, source: 'manual', notes: '', cardioType: legacy, duration: minutes, distance: distanceM ? Math.round(distanceM / 10) / 100 : null, distanceUnit: 'km',
    };
  }
  const cardioRecs = [
    cardio(addDays(today, -2), 'treadmill_run', 'Treadmill run', 30, 5200, { category: 'treadmill', brand: null, model: null }, 'indoor', 152, 6, 340, 'run'),
    cardio(addDays(today, -9), 'row', 'Rowing erg', 20, 4600, { category: 'rower', brand: 'Concept2', model: null }, 'indoor', 148, 7, 230, 'row'),
    cardio(addDays(today, -16), 'walk', 'Walking', 45, 4000, null, 'outdoor', 112, 3, 210, 'walk'),
    cardio(addDays(today, -23), 'bike_upright', 'Upright bike', 25, 9000, { category: 'bike', brand: null, model: null }, 'indoor', 138, 5, 240, 'bike'),
  ];
  const history = sessions.concat(cardioRecs).sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0));

  // ---- PRs: 12 (exId, reps) pairs mined from the history so they are consistent (lk_prs w in kg) ----
  const PR_PAIRS = [[111, 5], [111, 8], [701, 5], [701, 8], [221, 4], [221, 6], [801, 8], [302, 8], [202, 8], [213, 10], [703, 10], [503, 8]];
  const prs = {};
  for (const [id, r] of PR_PAIRS) {
    let best = null;
    for (const s of sessions) for (const x of s.exercises) if (x.id === id) for (const st of x.sets) {
      if (st.setType === 'warmup' || parseInt(st.r, 10) !== r) continue;
      const w = parseFloat(st.w);
      if (!best || w > best.w || (w === best.w && s.dateISO < best.date)) best = { r, w, date: s.dateISO };
    }
    if (!best) throw new Error('no history set for PR pair ' + id + 'x' + r);
    (prs[String(id)] ||= []).push(best);
  }
  Object.values(prs).forEach(l => l.sort((a, b) => a.r - b.r));

  // ---- body / progress ----
  const weightLog = [];
  for (let i = 6; i >= 0; i--) weightLog.push({ date: addDays(today, -i * 7 - 1), kg: Math.round((65.4 - (6 - i) * 0.2 + (rnd() - 0.5) * 0.3) * 10) / 10 });
  const bfLog = [{ pct: 24.1, method: 'manual', date: addDays(today, -36) }, { pct: 23.2, method: 'manual', date: addDays(today, -8) }];
  const goals = [
    { type: 'lift', name: 'Bench 75 kg x5', target: 75, targetDate: addDays(today, 84), exId: 111, unit: 'kg', notes: 'Add 2.5 kg every second week.', start: 60, status: 'active', created: isoTS(addDays(today, -40), 9, 0) },
    { type: 'lift', name: 'Squat 100 kg', target: 100, targetDate: addDays(today, 120), exId: 701, unit: 'kg', notes: '', start: 75, status: 'active', created: isoTS(addDays(today, -40), 9, 5) },
    { type: 'weight', name: 'Body weight 63 kg', target: 63, targetDate: addDays(today, 60), exId: null, unit: 'kg', notes: '', start: 65.4, status: 'active', created: isoTS(addDays(today, -35), 8, 0) },
  ];
  const progressPhotos = [
    { date: isoTS(addDays(today, -41), 8, 0), note: 'Week 1, relaxed', thumb: TINY_JPEG },
    { date: isoTS(addDays(today, -13), 8, 0), note: 'Week 5', thumb: TINY_JPEG },
  ];

  // ---- cycle tracker (storage-keys.md §C) ----
  const lastStart = addDays(today, -10);
  const mcDays = {};
  [2, 3, 2, 1, 1].forEach((flow, i) => { mcDays[addDays(lastStart, i)] = { flow, sym: i < 2 ? { cramps: 2, fatigue: 1 } : {}, mood: i === 0 ? ['tired'] : [], note: '' }; });
  mcDays[addDays(today, -3)] = { flow: 0, sym: {}, mood: ['energised'], note: 'Great squat day' };
  const mcProfile = { setup: true, goal: 'train', lastStart, cycleLen: 28, periodLen: 5, irregular: false, birthControl: 'none', discreet: false, createdAt: addDays(today, -38) };

  // ---- coach (storage-keys.md §D) ----
  const coachMsgs = [
    { role: 'user', text: 'How should I progress bench?' },
    { role: 'assistant', text: 'Your bench went 60 → 72.5 kg for 5 in six weeks. Keep adding 2.5 kg when every working set hits 8 reps at RIR 2. If the top set stalls twice, hold the load and add one rep.' },
    { role: 'user', text: 'Knee felt tight on squats yesterday.' },
    { role: 'assistant', text: 'Tightness without pain after a top set at 87.5 kg is normal. Warm up with two extra sets at 50 percent and keep RIR 2 on Legs this week. Tell me if it is still there Friday.' },
  ];
  const coachHist = coachMsgs.map(m => ({ role: m.role, content: m.text }));
  const planStart = addDays(today, -35);
  const coachPlan = {
    name: '12-week strength block', description: 'Linear progression on PPL, deload week 7.', startDate: planStart,
    phases: [
      { name: 'Base', weekStart: 1, weekEnd: 4, focus: 'volume', targets: [{ name: 'Bench 5RM', value: '70 kg' }, { name: 'Squat 5RM', value: '85 kg' }] },
      { name: 'Build', weekStart: 5, weekEnd: 8, focus: 'intensity', targets: [{ name: 'Bench 5RM', value: '75 kg' }, { name: 'Deadlift 4RM', value: '120 kg' }] },
      { name: 'Peak', weekStart: 9, weekEnd: 12, focus: 'strength', targets: [{ name: 'Squat 1RM', value: '100 kg' }] },
    ],
    created: isoTS(planStart, 9, 0), updatedAt: isoTS(planStart, 9, 0),
  };
  const feedback = [];
  [0, 1, 2, 4, 6, 8].forEach((back, i) => {
    const iso = addDays(today, -back);
    feedback.push({ id: 'fb' + dayUTC(iso, 7, 30), date: isoTS(iso, 7, 30), dateStr: locale(iso), mood: 3 + (i % 2), energy: 3, stress: 2, sleep: back === 0 ? 4 : 3, soreness: back === 0 ? 3 : 2, hoursSlept: 7 + (i % 3) * 0.5, tags: back === 0 ? ['legs sore'] : [], note: '', anchored: 'usual' });
  });

  // ---- shopping & budget (storage-keys.md §E) ----
  const items = [['Chicken thighs', 1, 'kg', 'meat'], ['Greek yogurt', 2, 'tubs', 'dairy'], ['Eggs', 12, 'pcs', 'dairy'], ['Oats', 1, 'kg', 'pantry'], ['Bananas', 6, 'pcs', 'produce'],
    ['Spinach', 1, 'bag', 'produce'], ['Rice', 2, 'kg', 'pantry'], ['Salmon', 500, 'g', 'meat'], ['Almonds', 1, 'bag', 'snacks'], ['Olive oil', 1, 'bottle', 'other']];
  const shoppingList = items.map(([itemName, quantity, unit, category], i) => ({
    id: 'sh_' + (dayUTC(addDays(today, -1), 10, 0) + i * 1000) + '_' + Math.floor(rnd() * 1e7).toString(36).padStart(5, '0'),
    itemName, quantity, unit, category, dateAdded: isoTS(addDays(today, -1), 10, i), checked: i === 3 || i === 8,
  }));
  const pantryItems = [
    { id: 'p_' + dayUTC(addDays(today, -20), 10, 0), name: 'Whey protein', quantity: 1, unit: '', store: '', category: 'pantry', dateAdded: isoTS(addDays(today, -20), 10, 0), empty: false, staple: true, intervalDays: 30 },
    { id: 'p_' + dayUTC(addDays(today, -20), 10, 1), name: 'Peanut butter', quantity: 1, unit: '', store: '', category: 'pantry', dateAdded: isoTS(addDays(today, -20), 10, 1), empty: false },
    { id: 'p_' + dayUTC(addDays(today, -6), 10, 0), name: 'Frozen berries', quantity: 2, unit: '', store: '', category: 'other', dateAdded: isoTS(addDays(today, -6), 10, 0), empty: false },
    { id: 'p_' + dayUTC(addDays(today, -6), 10, 1), name: 'Canned tuna', quantity: 0, unit: '', store: '', category: 'pantry', dateAdded: isoTS(addDays(today, -6), 10, 1), empty: true },
  ];
  const myStores = [{ id: 'store_' + dayUTC(addDays(today, -30), 12, 0), name: "Trader Joe's", url: 'https://www.traderjoes.com', description: 'specialty grocery', enabled: true }];
  const budgetData = {
    weeklyTarget: 120,
    history: [
      { id: 'p_' + dayUTC(addDays(today, -1), 16, 0), items: [{ name: 'Chicken thighs', price: 9.5, qty: 1 }, { name: 'Greek yogurt', price: 4.2, qty: 2 }, { name: 'Bananas', price: 1.8, qty: 1 }], store: "Trader Joe's", date: isoTS(addDays(today, -1), 16, 0), total: 19.7, source: 'manual' },
      { id: 'r_' + dayUTC(addDays(today, -5), 18, 0), items: [{ name: 'Salmon', price: 12.9, qty: 1 }, { name: 'Rice', price: 3.5, qty: 2 }, { name: 'Olive oil', price: 8.9, qty: 1 }], store: 'Safeway', date: isoTS(addDays(today, -5), 18, 0), total: 28.8, source: 'receipt' },
      { id: 'p_' + dayUTC(addDays(today, -9), 17, 0), items: [{ name: 'Eggs', price: 4.5, qty: 2 }, { name: 'Oats', price: 3.2, qty: 1 }], store: "Trader Joe's", date: isoTS(addDays(today, -9), 17, 0), total: 12.2, source: 'manual' },
    ],
    pendingItems: [],
  };

  // ---- supplements (Home `supps` block) ----
  const supplements = [
    { name: 'Creatine', dose: '5 g', freq: 'Daily', timeOf: 'Morning', reminder: true, created: isoTS(addDays(today, -40), 8, 0) },
    { name: 'Vitamin D', dose: '2000 IU', freq: 'Daily', timeOf: 'Morning', reminder: true, created: isoTS(addDays(today, -40), 8, 1) },
  ];

  const profile = { displayName: 'Cesco', username: 'cesco', useKg: true, createdAt: locale(addDays(today, -45)), age: 29, sex: 'female', weightKg: 64.2, heightCm: 168, goal: 'build', coachName: 'Coach' };

  const J = v => JSON.stringify(v);
  const seed = {
    // boot gates (page-map §1)
    lk_guestMode: '1',
    lk_profile: J(profile),
    lk_tutorialSeen: J(true),
    lk_theme: J('dark'),
    lk_textScale: J(100),
    lk_weightStorageUnit: J('kg'),
    lk_unitConversion: J(true),
    lk_weightsKgMigrated: J(true),
    lk_prDatesFixed: J(true),
    lk_cardioMigrated: J(true),
    lk_reminderMigrated: J(true),
    // training core
    lk_splits: J(splits),
    lk_splitsExpanded: J({ [splits[0].id]: true }),
    lk_history: J(history),
    lk_prs: J(prs),
    lk_customEx: J([{ id: 900001, name: 'Cable Fly (low pulley)', eq: 'Cable', gid: 'chest', sid: 'lower', custom: true, startResist: 0, smithNoCB: false }]),
    lk_featuredLifts: J([111, 701, 221]),
    lk_exNotes: J({ '111': { text: 'Pinkies on rings, feet back', updated: isoTS(addDays(today, -8), 10, 0) } }),
    lk_restEnabled: J(true),
    lk_hidePartials: J(false),
    lk_holdTipSeen: J(true),
    lk_cardioPrefs: J({ distUnit: 'km', weeklyTargetMin: 150, maxHrOverride: null, zoneModel: '5zone', restingHr: 58 }),
    lk_cardioFavorites: J([{ id: 'fav_' + dayUTC(addDays(today, -20), 7, 0), label: 'Treadmill run', emoji: 'run', modality: 'treadmill_run', subType: null, environment: 'indoor', machine: { category: 'treadmill', brand: null, model: null }, defaults: { durationSec: 1800, surface: 'machine' }, order: 0, useCount: 3, lastUsedAt: isoTS(addDays(today, -2), 7, 45), pinned: true }]),
    lk_perfTracking: J(false),
    // progress, body, goals
    lk_weightLog: J(weightLog),
    lk_bfLog: J(bfLog),
    lk_goals: J(goals),
    lk_progressPhotos: J(progressPhotos),
    lk_throwbackDismissed: J(isoTS(today, 6, 0)),
    lk_proactiveTip: J({ text: 'Your squat 5RM moved 75 → 87.5 kg in six weeks. Keep RIR 2 on the top set this week and add 2.5 kg Friday.', date: today }),
    // cycle
    lk_mcProfile: J(mcProfile),
    lk_mcDays: J(mcDays),
    lk_mcFuelAdjust: J(false),
    // coach
    lk_coachLastMsgs: J(coachMsgs),
    lk_coachLastHist: J(coachHist),
    lk_coachPlan: J(coachPlan),
    lk_coachInstructions: J('Keep replies under 80 words. Reference my actual numbers.'),
    lk_coachMemory: J([{ text: 'Left knee gets tight on high-bar squats', src: 'added by you, ' + locale(addDays(today, -14)), date: isoTS(addDays(today, -14), 9, 0) }]),
    lk_coachMemoryOn: J(true),
    lk_coachStyle: J('direct'),
    lk_coachDataPrefs: J({ training: true, nutrition: true, weight: true, checkins: true, supplements: true, cycle: true, bodyfat: true, goals: true, plan: true }),
    lk_checkinPerDay: J(1),
    lk_feedback: J(feedback),
    // shopping and budget
    lk_shoppingList: J(shoppingList),
    lk_pantryItems: J(pantryItems),
    lk_myStores: J(myStores),
    lk_budgetData: J(budgetData),
    // supplements (Home supps card)
    lk_supplements: J(supplements),
    lk_suppLog: J({}),
    // settings / UI
    lk_homeLayout: J({ hidden: { insight: true } }),
    lk_gamingLayer: J(false),
    lk_voiceEnabled: J(true),
    lk_voiceBtnCorner: J('br'),
  };
  return seed;
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const anchor = process.argv[2] || process.env.SEED_ANCHOR || DEFAULT_ANCHOR;
  const seed = generateSeed(anchor);
  const out = path.join(HERE, 'seed-data.json');
  fs.writeFileSync(out, JSON.stringify(seed, null, 2) + '\n');
  const hist = JSON.parse(seed.lk_history);
  console.log(`wrote ${out}: ${Object.keys(seed).length} keys, anchor ${anchor}, ${hist.filter(h => h.type !== 'cardio').length} lifting + ${hist.filter(h => h.type === 'cardio').length} cardio sessions, ${Object.values(JSON.parse(seed.lk_prs)).flat().length} PRs, ${(Buffer.byteLength(JSON.stringify(seed)) / 1024).toFixed(0)} KB`);
}
