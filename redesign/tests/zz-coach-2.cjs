const { chromium } = require('playwright');
const URL = 'file:///home/user/everything-claude-code/redesign/08-build/coach.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const keys = ['lk_feedback','lk_coachPlan','lk_coachInstructions','lk_coachStyle','lk_coachMemory','lk_coachMemoryOn','lk_coachDataPrefs','lk_coachName','lk_profile','lk_coachLastMsgs','lk_coachOpenersOff'];
const dump = p => p.evaluate(ks => { const o={}; ks.forEach(k=>o[k]=localStorage.getItem(k)); return o; }, keys);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('!! PAGEERROR', e.message));
  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();

  const step = async (label) => console.log('\n--- ' + label);

  // 1. CHECK-IN SAVE
  await step('checkin save');
  await p.click('[data-testid="seg-checkin"]');
  for (const f of ['energy','sleep','soreness','stress','motivation']) await p.click(`[data-testid="feel-${f}-3"]`);
  await p.click('[data-testid="checkin-save"]');
  await sleep(200);
  console.log('toast:', await p.textContent('[data-testid="toast"]').catch(()=>'none'));
  console.log('lk_feedback =', (await dump(p)).lk_feedback);
  await p.reload();
  await p.click('[data-testid="seg-checkin"]');
  console.log('after reload status:', await p.textContent('[data-testid="checkin-status"]'));
  console.log('recent:', (await p.textContent('[data-testid="checkin-0"]')).replace(/\s+/g,' '));

  // 2. RENAME
  await step('rename coach');
  await p.click('[data-testid="seg-setup"]');
  await p.click('[data-testid="setup-rename"]');
  await p.fill('[data-testid="setup-name-input"]', 'Gunnar');
  await p.click('[data-testid="setup-name-save"]');
  await sleep(200);
  let d = await dump(p);
  console.log('lk_coachName=', d.lk_coachName, ' lk_profile=', d.lk_profile);
  await p.reload();
  console.log('h1 after reload:', await p.textContent('h1'));

  // 3. INSTRUCTIONS + SAVE button
  await step('instructions + explicit Save');
  await p.click('[data-testid="seg-setup"]');
  await p.fill('[data-testid="setup-instructions"]', 'Only metric. No pep talk.');
  console.log('status before save:', await p.textContent('[data-testid="setup-status"]'));
  await p.click('[data-testid="setup-save"]');
  await sleep(200);
  console.log('lk_coachInstructions=', (await dump(p)).lk_coachInstructions);
  await p.reload();
  await p.click('[data-testid="seg-setup"]');
  console.log('textarea after reload:', await p.inputValue('[data-testid="setup-instructions"]'));

  // 4. TONE without save, then reload
  await step('tone chip, no Save, reload');
  await p.click('[data-testid="setup-style-technical"]');
  await sleep(100);
  console.log('lk_coachStyle right after chip =', (await dump(p)).lk_coachStyle);
  console.log('status:', await p.textContent('[data-testid="setup-status"]'));
  await p.click('[data-testid="setup-save"]');
  await sleep(150);
  console.log('lk_coachStyle after Save =', (await dump(p)).lk_coachStyle);

  // 5. PERM toggle + save
  await step('perm toggle + Save');
  await p.click('[data-testid="setup-perm-nutrition"]');
  await p.click('[data-testid="setup-save"]');
  await sleep(150);
  console.log('lk_coachDataPrefs=', (await dump(p)).lk_coachDataPrefs);
  await p.reload();
  await p.click('[data-testid="seg-setup"]');
  console.log('nutrition aria-checked after reload:', await p.getAttribute('[data-testid="setup-perm-nutrition"]','aria-checked'));

  // 6. MEMORY: add, forget, clear
  await step('memory add');
  await p.click('[data-testid="setup-add-memory"]');
  await p.fill('[data-testid="setup-memory-text"]', 'Trains Mon Wed Fri');
  await p.click('[data-testid="setup-memory-save"]');
  await sleep(150);
  console.log('lk_coachMemory=', (await dump(p)).lk_coachMemory);
  await step('memory forget (no explicit save)');
  await p.click('[data-testid="setup-forget-1"]');
  await sleep(150);
  console.log('after forget lk_coachMemory=', (await dump(p)).lk_coachMemory);
  console.log('status:', await p.textContent('[data-testid="setup-status"]'));
  await p.reload();
  await p.click('[data-testid="seg-setup"]');
  console.log('memory rows after reload:', await p.$$eval('[data-testid^="setup-forget-"]', e=>e.length));

  await b.close();
})();
