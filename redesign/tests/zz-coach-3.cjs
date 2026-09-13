const { chromium } = require('playwright');
const URL = 'file:///home/user/everything-claude-code/redesign/08-build/coach.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const g = (p,k) => p.evaluate(k => localStorage.getItem(k), k);

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext()).newPage();
  p.on('pageerror', e => console.log('!! PAGEERROR', e.message));
  await p.goto(URL); await p.evaluate(()=>localStorage.clear()); await p.reload();

  // ---- 1. dirty state not painted when typing instructions
  console.log('--- typing instructions');
  await p.click('[data-testid="seg-setup"]');
  await p.click('[data-testid="setup-instructions"]');
  await p.type('[data-testid="setup-instructions"]', ' Extra.', {delay:10});
  await sleep(60);
  console.log('status right after typing :', await p.textContent('[data-testid="setup-status"]'));
  console.log('save disabled right after :', await p.getAttribute('[data-testid="setup-save"]','disabled'));
  console.log('counter               :', await p.textContent('[data-testid="setup-instructions-block"] .t-meta'));
  await sleep(1500);
  console.log('status after 1.5s tick   :', await p.textContent('[data-testid="setup-status"]'));

  // ---- 2. interview answers persistence
  console.log('\n--- interview');
  await p.reload(); await p.click('[data-testid="seg-setup"]');
  await p.click('[data-testid="setup-interview-open"]');
  await p.click('[data-testid="iv-option-2"]'); await p.click('[data-testid="iv-next"]');
  await p.click('[data-testid="iv-option-0"]'); await p.click('[data-testid="iv-next"]');
  await p.click('[data-testid="iv-option-0"]');
  console.log('sheet head:', (await p.textContent('[data-testid="iv-sheet"]')).replace(/\s+/g,' ').slice(0,140));
  await p.keyboard.press('Escape');
  await sleep(200);
  console.log('close toast:', await p.textContent('[data-testid="toast"]').catch(()=>'none'));
  console.log('block after close:', (await p.textContent('[data-testid="setup-interview-block"]')).replace(/\s+/g,' '));
  const ls = await p.evaluate(()=>Object.keys(localStorage).sort());
  console.log('localStorage keys now:', JSON.stringify(ls));
  await p.reload(); await p.click('[data-testid="seg-setup"]');
  console.log('block after RELOAD:', (await p.textContent('[data-testid="setup-interview-block"]')).replace(/\s+/g,' '));

  // ---- 3. interview -> write -> preview -> "Save and edit them"
  console.log('\n--- iv-edit-first claims a save');
  await p.click('[data-testid="dev-toggle"]');
  await p.click('[data-testid="dev-preset-14"]'); // answers review
  await p.click('[data-testid="iv-write"]');
  await sleep(3200);
  console.log('preview draft:', (await p.textContent('[data-testid="iv-preview"]')).replace(/\s+/g,' '));
  await p.click('[data-testid="iv-edit-first"]');
  await sleep(200);
  console.log('toast:', await p.textContent('[data-testid="toast"]').catch(()=>'none'));
  console.log('status:', await p.textContent('[data-testid="setup-status"]'));
  console.log('lk_coachInstructions =', await g(p,'lk_coachInstructions'));
  await p.reload(); await p.click('[data-testid="seg-setup"]');
  console.log('textarea after reload:', await p.inputValue('[data-testid="setup-instructions"]'));

  // ---- 4. iv-use
  console.log('\n--- iv-use');
  await p.evaluate(()=>localStorage.clear()); await p.reload();
  await p.click('[data-testid="dev-toggle"]');
  await p.click('[data-testid="dev-preset-14"]');
  await p.click('[data-testid="iv-write"]'); await sleep(3200);
  await p.click('[data-testid="iv-use"]'); await sleep(200);
  console.log('lk_coachInstructions =', await g(p,'lk_coachInstructions'));

  await b.close();
})();
