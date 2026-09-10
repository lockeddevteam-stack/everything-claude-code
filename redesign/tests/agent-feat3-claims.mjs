/* Q2: drive the controls whose label/copy promises a write, and check whether
   the thing they name actually moves. One fresh load per chain, standalone
   files (that is where each screen's own dev state switcher lives). */
import { chromium } from '@playwright/test';
const B = 'file:///home/user/everything-claude-code/redesign/08-build/';

const CHAINS = [
  ['progress.html', 'log a record without a workout', ['[data-testid="log-record"]', '[data-testid="rec-save"]'], '[data-testid="records-list"]'],
  ['progress.html', 'log body weight', ['[data-testid="row-body-weight"]', '[data-testid="weight-log"]'], '#body'],
  ['progress.html', 'goals row', ['[data-testid="row-goals"]', '[data-testid="goals-add"]', '[data-testid="goals-save"]'], '#body'],
  ['progress.html', 'pick a lift for the chart', ['[data-testid="choose-lift"]'], '[data-testid="card-trend"]'],
  ['exercise-library.html', 'create a custom exercise', ['[data-testid="create-custom"]', '[data-testid="create-save"]'], '#body'],
  ['exercise-library.html', 'show customs', ['[data-testid="show-customs"]'], '#body'],
  ['split-builder.html', 'save a split', ['[data-testid="save-split"]'], '#screen-manual'],
  ['settings.html', 'change display name', ['[data-testid="row-identity"]', '[data-testid="save-name"]'], '#body'],
  ['settings.html', 'sync now', ['[data-testid="sync-now"]'], '#body'],
  ['settings.html', 'sign in', ['[data-testid="sign-in"]'], '#screen'],
  ['settings.html', 'create an account', ['[data-testid="create-account"]'], '#screen'],
  ['coach.html', 'send a chat message', ['[data-testid="composer-send"]'], '[data-testid="chat-thread"]'],
  ['coach.html', 'new chat', ['[data-testid="action-new-chat"]'], '[data-testid="chat-thread"]'],
  ['coach.html', 'plan: start next day', ['[data-testid="plan-start"]'], '#screen'],
  ['coach.html', 'setup: add a memory', ['[data-testid="setup-add-memory"]'], '#body'],
  ['coach.html', 'setup: save', ['[data-testid="setup-save"]'], '#body']
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.file + ':' + m.text()); });

async function textOf(sel) {
  return page.evaluate(sel => {
    const e = document.querySelector(sel);
    return e ? e.innerText.replace(/\s+/g, ' ').trim() : '(no ' + sel + ')';
  }, sel);
}

for (const [file, name, sels, watch, state] of CHAINS) {
  await page.goto(B + file + (state ? '?state=' + state : ''));
  await page.waitForTimeout(350);
  const before = await textOf(watch);
  const steps = [];
  for (const sel of sels) {
    const ok = await page.evaluate(sel => {
      const els = Array.from(document.querySelectorAll(sel)).filter(e => {
        const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2;
      });
      if (!els.length) return false;
      els[0].click(); return true;
    }, sel);
    await page.waitForTimeout(400);
    steps.push((ok ? 'click ' : 'MISSING ') + sel);
  }
  const after = await textOf(watch);
  const toast = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="toast"],.toast');
    return t && t.offsetParent !== null ? t.innerText.replace(/\s+/g, ' ').trim().slice(0, 90) : null;
  });
  console.log(`\n### ${file}${state ? '?state=' + state : ''} — ${name}`);
  steps.forEach(s => console.log('   ' + s));
  console.log('   watch ' + watch + ': ' + (before === after ? 'UNCHANGED (' + before.length + ' chars)' : 'changed ' + before.length + ' -> ' + after.length));
  if (before !== after) {
    console.log('     before: ' + before.slice(0, 150));
    console.log('     after : ' + after.slice(0, 150));
  } else {
    console.log('     text  : ' + before.slice(0, 150));
  }
  if (toast) console.log('   TOAST: ' + toast);
}
console.log('\nerrors:', errs.slice(0, 10));
await browser.close();
