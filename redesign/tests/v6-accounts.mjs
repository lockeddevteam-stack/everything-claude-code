/* THE ACCOUNT SHAPES ON THE LIVE PROJECT.

   Read off it structurally rather than invented, and shared by
   v6-render.mjs (the screens as files) and v6-demo.mjs (the assembled
   build). The values are not anybody's: a real account's numbers do not
   belong in a repository, and the shapes are the whole point.

   Of the five accounts there, three have no training at all and the one
   with a split has never logged a session against it. Those are the
   shapes most of this build's first readers will arrive with. */
export const V6 = {
  lk_profile: { age: 31, sex: 'Male', goal: 'Maintain', useKg: true, heightCm: 170.18,
                username: 'reader', displayName: 'Reader', createdAt: '5/13/2026',
                weightKg: 57.15270658889061 },
  /* every row dated with the word the shipped app showed at the time */
  lk_prs: { 104: [{ date: 'Today', r: 3, w: 58.96707822663317 },
                  { date: 'Today', r: 5, w: 54.43114913227677 }],
            311: [{ date: 'Today', r: 8, w: 22.67964547178199 }] },
  lk_history: [
    { name: 'Pull Hotel', date: '6/18/2026', dateISO: '2026-06-19', vol: '3608 kg',
      dur: '39 min', sets: 12, blocks: null, note: '',
      exercises: [
        { name: 'Technogym Low row',
          sets: [{ r: '8', w: '35', rL: '', rR: '', rir: '2', done: true },
                 { r: '9', w: '90', rL: '', rR: '', rir: '0', done: true }] },
        { name: 'Technogym Vertical Pulldown',
          sets: [{ r: '8', w: '55', rL: '', rR: '', rir: '2', done: true }] }] },
    { name: 'Push', date: '6/12/2026', dateISO: '2026-06-12', vol: '2940 kg',
      dur: '45 min', sets: 9,
      exercises: [{ name: 'Incline Machine Press',
                    sets: [{ r: '5', w: '58.96707822663317', rir: '1', done: true }] }] }
  ],
  lk_splits: [{ id: 1, name: 'Push Pull Legs', created: 1780000000000,
                days: [{ name: 'Push', exIds: [104, 311] }, { name: 'Pull', exIds: [106] }] }],
  lk_weightLog: [{ kg: 58.96707822663317, date: '2026-05-22' }],
  lk_customEx: [],
  lk_exNotes: {},
  lk_gamingLayer: true,
  lk_weightsKgMigrated: true,
  lk_weightStorageUnit: 'lb',
  lk_theme: 'dark',
  lk_tutorialSeen: true
};

export const ACCOUNTS = {
  'signed up, never used it': {
    lk_profile: { useKg: false, username: 'newer', displayName: 'Newer', createdAt: '07/09/2026' },
    lk_theme: 'dark', lk_tutorialSeen: true
  },
  'markers but no content': {
    lk_profile: { useKg: false, username: 'zed', displayName: 'Zed', createdAt: '07/09/2026' },
    lk_theme: 'dark', lk_tutorialSeen: true, lk_cardioMigrated: true,
    lk_prDatesFixed: true, lk_weightsKgMigrated: true, lk_weightStorageUnit: 'kg'
  },
  'fuel only, no training': {
    lk_profile: { useKg: false, username: 'liv', displayName: 'Liv', createdAt: '24/07/2026' },
    lk_theme: 'dark', lk_tutorialSeen: true, lk_voiceEnabled: true, lk_voiceBtnCorner: 'br',
    lk_fuelLogDayTs: {},
    lk_fuelLog: { '2026-07-25': { water: 1905, meals: { breakfast: [], lunch: [], dinner: [],
      snacks: [{ name: 'Cheese crackers', cal: 170, pro: 3, carb: 20, fat: 10,
                 est: true, src: 'ai', fromVoice: true }] } } },
    lk_fuelProfile: { age: '16', sex: 'female', goal: 'recomp', tdee: 1219, tdeeSeed: 1219,
      heightCm: 15, heightFt: '', heightIn: '6.5', heightUnit: 'ft',
      weightKg: 49.9, weightVal: '110', weightUnit: 'lbs',
      macroFat: 34, macroCarbs: 118, macroProtein: 110,
      activityLevel: 'light', useCustomMacros: false, preferences: [],
      allergies: '', fridge: 'rice, pasta, mixed vegetables' }
  },
  'a split, never trained against it': {
    lk_profile: { useKg: false, username: 'jay', displayName: 'Jay', createdAt: '9/1/2026',
                  goal: 'Cut' },
    lk_theme: 'dark', lk_tutorialSeen: true, lk_gamingLayer: true,
    lk_cardioMigrated: true, lk_prDatesFixed: true, lk_weightsKgMigrated: true,
    lk_weightStorageUnit: 'kg', lk_splitsExpanded: { 1: true },
    lk_customEx: [], lk_exNotes: {},
    lk_weightLog: [{ kg: 68.94612223421724, date: '2026-09-01' }],
    lk_splits: [{ id: 1, name: 'Upper Lower', created: 1780000000000,
                  days: [{ name: 'Upper', exIds: [104, 311] }, { name: 'Lower', exIds: [106] }] }],
    lk_fuelLog: {}
  }
};

