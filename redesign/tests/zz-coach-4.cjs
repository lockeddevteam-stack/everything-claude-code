const { chromium } = require('playwright');
const URL = 'file:///home/user/everything-claude-code/redesign/08-build/coach.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const g = (p,k) => p.evaluate(k => localStorage.getItem(k), k);
const preset = async (p,i) => { await p.evaluate(i=>{document.querySelector('#dev-menu').hidden=false;document.querySelector('[data-testid="dev-preset-'+i+'"]').click();}, i); await sleep(150); };

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({viewport:{width:1200,height:1000}})).newPage();
  p.on('pageerror', e => console.log('!! PAGEERROR', e.message));
  await p.goto(URL); await p.evaluate(()=>localStorage.clear()); await p.reload();

  console.log('--- iv preview / Save and edit them');
  await preset(p,14);
  await p.click('[data-testid="iv-write"]'); await sleep(3400);
  console.log('preview:', (await p.textContent('[data-testid="iv-preview"]')).replace(/\s+/g,' '));
  await p.click('[data-testid="iv-edit-first"]'); await sleep(200);
  console.log('toast:', await p.textContent('[data-testid="toast"]').catch(()=>'none'));
  console.log('status:', await p.textContent('[data-testid="setup-status"]'));
  console.log('lk_coachInstructions =', await g(p,'lk_coachInstructions'));
  await p.reload(); await p.click('[data-testid="seg-setup"]');
  console.log('textarea after reload:', JSON.stringify(await p.inputValue('[data-testid="setup-instructions"]')));

  console.log('\n--- iv-use');
  await p.evaluate(()=>localStorage.clear()); await p.reload();
  await preset(p,14);
  await p.click('[data-testid="iv-write"]'); await sleep(3400);
  await p.click('[data-testid="iv-use"]'); await sleep(200);
  console.log('lk_coachInstructions =', await g(p,'lk_coachInstructions'));

  console.log('\n--- PLAN: bind');
  await p.evaluate(()=>localStorage.clear()); await p.reload();
  await preset(p,7); // Plan / unbound
  console.log('unbound head:', (await p.textContent('[data-testid="plan-bind"]')).replace(/\s+/g,' '));
  await p.click('[data-testid="plan-bind-open"]');
  await p.click('[data-testid="bind-split-1"]'); await sleep(200);
  console.log('toast:', await p.textContent('[data-testid="toast"]'));
  console.log('lk_coachPlan after bind =', await g(p,'lk_coachPlan'));
  console.log('this week:', (await p.textContent('[data-testid="plan-this-week"]')).replace(/\s+/g,' '));
  await p.click('[data-testid="toast-action"]'); await sleep(200);
  console.log('after Open in Train toast:', await p.textContent('[data-testid="toast"]').catch(()=>'none'), '| url:', p.url().split('/').pop());

  console.log('\n--- PLAN: delete');
  await p.evaluate(()=>localStorage.clear()); await p.reload();
  await p.click('[data-testid="seg-plan"]');
  await p.click('[data-testid="plan-delete"]');
  console.log('dialog:', (await p.textContent('[data-testid="delete-dialog"]')).replace(/\s+/g,' '));
  await p.click('[data-testid="delete-confirm"]'); await sleep(200);
  console.log('toast:', await p.textContent('[data-testid="toast"]'));
  console.log('lk_coachPlan after delete =', await g(p,'lk_coachPlan'));
  await p.reload(); await p.click('[data-testid="seg-plan"]'); await sleep(150);
  console.log('plan pane after reload:', (await p.textContent('[data-testid="plan-scroll"]')).replace(/\s+/g,' ').slice(0,160));

  console.log('\n--- CHAT: save plan from a reply');
  await p.evaluate(()=>localStorage.clear()); await p.reload();
  await preset(p,4); // plan offered
  await p.click('[data-testid="chat-save-plan"]'); await sleep(200);
  console.log('toast:', await p.textContent('[data-testid="toast"]'));
  console.log('card now:', (await p.textContent('[data-testid="plan-card"]')).replace(/\s+/g,' '));
  console.log('lk_coachPlan name =', JSON.parse(await g(p,'lk_coachPlan')).name);
  await p.reload(); await sleep(200);
  console.log('after reload, chat card:', (await p.textContent('[data-testid="plan-card"]').catch(()=>'no card')).replace(/\s+/g,' '));
  await p.click('[data-testid="seg-plan"]');
  console.log('plan pane:', (await p.textContent('[data-testid="plan-head"]')).replace(/\s+/g,' '));

  await b.close();
})();
