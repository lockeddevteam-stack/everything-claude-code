const { chromium } = require('playwright');
const URL = 'file:///home/user/everything-claude-code/redesign/08-build/coach.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('!! PAGEERROR', e.message));
  p.on('console', m => { if (m.type()==='error') console.log('!! CONSOLE', m.text()); });
  await p.goto(URL);

  const presets = await p.$$eval('.dev__item', els => els.map(e => e.textContent));
  await p.click('[data-testid="dev-toggle"]');
  console.log('PRESETS:', presets.join(' | '));

  // --- empty chat: intro line + openers
  await p.click('[data-testid="dev-preset-1"]');
  console.log('\n== INTRO ==');
  console.log(await p.textContent('[data-testid="chat-intro"]'));
  const op = await p.$$eval('[data-testid^="chat-suggest-"]', e => e.map(x=>x.textContent));
  console.log('OPENERS:', JSON.stringify(op));
  console.log('RECEIPT ROW:', (await p.textContent('[data-testid="chat-data-receipt"]')).replace(/\s+/g,' '));

  // --- check-in pane
  await p.click('[data-testid="seg-checkin"]');
  console.log('\n== CHECKIN ==');
  console.log((await p.textContent('[data-testid="checkin-scroll"]')).replace(/\s+/g,' ').slice(0,1200));

  // --- plan pane default
  await p.click('[data-testid="seg-plan"]');
  console.log('\n== PLAN ==');
  console.log((await p.textContent('[data-testid="plan-scroll"]')).replace(/\s+/g,' ').slice(0,2000));
  // expand each phase
  for (const i of [0,1,2]) {
    await p.click(`[data-testid="plan-phase-toggle-${i}"]`);
    console.log(`PHASE ${i} OPEN:`, (await p.textContent(`[data-testid="plan-phase-${i}"]`)).replace(/\s+/g,' '));
    await p.click(`[data-testid="plan-phase-toggle-${i}"]`);
  }
  await b.close();
})();
