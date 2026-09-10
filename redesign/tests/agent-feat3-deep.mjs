/* Q2 deep pass: reach the control through its own dev state, type real input
   where the control needs it, and compare the region the control's label
   promises to change. Steps: "click:SEL", "fill:SEL=value", "state:NAME",
   "preset:N", "wait:MS". */
import { chromium } from '@playwright/test';
const B = 'file:///home/user/everything-claude-code/redesign/08-build/';

const CASES = [
  ['progress.html', 'Log a record without a workout', [
    'click:[data-testid="log-record"]', 'fill:[data-testid="rec-kg"]=200', 'fill:[data-testid="rec-reps"]=5',
    'click:[data-testid="rec-save"]'
  ], '[data-testid="records-list"]'],
  ['progress.html', 'Body weight, changed value', [
    'click:[data-testid="row-body-weight"]', 'fill:[data-testid="wt-kg"]=70.5', 'click:[data-testid="weight-log"]'
  ], '#body'],
  ['progress.html', 'Goals row', ['click:[data-testid="row-goals"]'], '#overlay'],
  ['settings.html', 'Change the display name', [
    'click:[data-testid="row-identity"]', 'fill:[data-testid="field-name"]=Bruno', 'click:[data-testid="save-name"]'
  ], '#body'],
  ['settings.html', 'Change body stats', [
    'click:[data-testid="row-body"]', 'fill:[data-testid="field-weight"]=99', 'click:[data-testid="save-body"]'
  ], '#body'],
  ['coach.html', 'Type and send', [
    'fill:[data-testid="composer-input"]=what about deadlifts', 'click:[data-testid="composer-send"]', 'wait:1800'
  ], '[data-testid="chat-thread"]'],
  ['coach.html', 'Plan: Start next day', ['preset:6', 'click:[data-testid="plan-start"]'], '#screen'],
  ['coach.html', 'Setup: save', ['preset:11', 'click:[data-testid="setup-save"]'], '#body'],
  ['coach.html', 'Setup: add a memory', ['preset:11', 'click:[data-testid="setup-add-memory"]'], '#body'],
  ['exercise-library.html', 'Create a custom exercise', [
    'preset:12', 'fill:[data-testid="create-name"]=Zercher hold', 'click:[data-testid="create-save"]', 'wait:500'
  ], '#body'],
  ['split-builder.html', 'Save the split', ['preset:2', 'click:[data-testid="save-split"]', 'wait:600'], '#body'],
  ['split-builder.html', 'AI: accept a proposal', ['preset:10', 'click:[data-testid="ai-accept"]', 'wait:600'], '#body'],
  ['workout-log.html', 'Add a set', ['click:[data-action="addset"]', 'wait:400'], '#body']
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

const text = sel => page.evaluate(s => {
  const e = document.querySelector(s);
  return e ? e.innerText.replace(/\s+/g, ' ').trim() : '(no ' + s + ')';
}, sel);

async function listPresets() {
  return page.evaluate(() => {
    const t = document.querySelector('[data-testid="dev-toggle"]');
    if (t) t.click();
    return Array.from(document.querySelectorAll('.dev__item')).map(b => ({
      id: b.getAttribute('data-testid'), label: b.textContent.trim()
    }));
  });
}

for (const [file, name, steps, watch] of CASES) {
  await page.goto(B + file);
  await page.waitForTimeout(350);
  console.log(`\n### ${file} — ${name}`);
  if (steps[0] === 'switches') {
    const r = await page.evaluate(() => {
      const out = [];
      const sw = Array.from(document.querySelectorAll('[role="switch"],input[type="checkbox"]'));
      sw.forEach((s, i) => {
        const label = (s.closest('.row,.list__row,li,div') || s).innerText.replace(/\s+/g, ' ').trim().slice(0, 40);
        const before = s.getAttribute('aria-checked') ?? String(s.checked);
        s.click();
        const after = s.getAttribute('aria-checked') ?? String(s.checked);
        out.push({ i, label, before, after, moved: before !== after });
      });
      return out;
    });
    r.forEach(x => console.log(`   switch ${x.i} "${x.label}" ${x.before} -> ${x.after} ${x.moved ? '' : ' DID NOT MOVE'}`));
    /* do they survive a re-render? flip the dev state and back */
    const after = await page.evaluate(() => {
      const t = document.querySelector('[data-testid="dev-toggle"]'); if (t) t.click();
      const items = Array.from(document.querySelectorAll('.dev__item'));
      if (items[1]) items[1].click();
      if (items[0]) items[0].click();
      return Array.from(document.querySelectorAll('[role="switch"],input[type="checkbox"]'))
        .map(s => s.getAttribute('aria-checked') ?? String(s.checked)).join(',');
    });
    console.log('   after a state round-trip: ' + after);
    continue;
  }
  const before = await text(watch);
  for (const step of steps) {
    const [kind, ...rest] = step.split(':');
    const arg = rest.join(':');
    if (kind === 'wait') { await page.waitForTimeout(+arg); console.log('   wait ' + arg); continue; }
    if (kind === 'preset') {
      const ok = await page.evaluate(i => {
        const t = document.querySelector('[data-testid="dev-toggle"]'); if (t) t.click();
        const b = document.querySelector('[data-testid="dev-preset-' + i + '"]') ||
                  document.querySelector('[data-testid="dev-state-' + i + '"]');
        if (!b) return false; b.click();
        if (t) t.click();
        return true;
      }, arg);
      console.log(`   ${ok ? 'preset' : 'NO PRESET'} ${arg}`);
      await page.waitForTimeout(450);
      continue;
    }
    if (kind === 'fill') {
      const cut = arg.lastIndexOf(']=');
      const sel = arg.slice(0, cut + 1); const val = arg.slice(cut + 2);
      const ok = await page.evaluate(([sel, val]) => {
        const e = document.querySelector(sel);
        if (!e) return false;
        e.focus(); e.value = val;
        e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }, [sel, val]);
      console.log(`   ${ok ? 'fill' : 'MISSING'} ${sel} = ${val}`);
      await page.waitForTimeout(200);
      continue;
    }
    const ok = await page.evaluate(sel => {
      const els = Array.from(document.querySelectorAll(sel)).filter(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; });
      if (!els.length) return false;
      els[0].click(); return true;
    }, arg);
    console.log(`   ${ok ? 'click' : 'MISSING'} ${arg}`);
    await page.waitForTimeout(400);
  }
  const after = await text(watch);
  const toast = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="toast"],.toast');
    return t && t.offsetParent !== null ? t.innerText.replace(/\s+/g, ' ').trim().slice(0, 90) : null;
  });
  console.log('   watch ' + watch + ': ' + (before === after ? 'UNCHANGED' : 'CHANGED'));
  if (before !== after) {
    console.log('     before: ' + before.slice(0, 200));
    console.log('     after : ' + after.slice(0, 200));
  } else console.log('     text: ' + before.slice(0, 200));
  if (toast) console.log('   TOAST: ' + toast);
}

/* presets available per screen, for the record */
for (const f of ['coach.html', 'exercise-library.html', 'split-builder.html', 'workout-log.html']) {
  await page.goto(B + f);
  await page.waitForTimeout(300);
  console.log(`\n${f} dev items: ` + JSON.stringify(await listPresets()));
}
console.log('\nerrors:', errs.slice(0, 8));
await browser.close();
