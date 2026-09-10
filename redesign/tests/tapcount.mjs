/* Flow 2 from user-flows.md, logging one set, counted the same way the
   original was counted: every tap, including digits, deletions, sheet
   dismissals and Resume. Best known is 3. The original took 15. */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 393, height: 852 } });
let taps = 0, screens = 0;
p.on('pageerror', e => console.log('PAGEERROR', e.message));
const tap = async (sel) => { await p.click(sel); taps++; await p.waitForTimeout(120); };
await p.goto(pathToFileURL('/home/user/everything-claude-code/redesign/08-build/workout-log.html').href);
await p.waitForTimeout(600);

/* The first set of the first exercise. Cells are addressed by exercise,
   set and field, the way the screen names them. */
const first = await p.evaluate(() => {
  const c = document.querySelector('[data-testid^="cell-"]');
  return c ? c.getAttribute('data-testid') : null;
});
console.log('first cell:', first);
const parts = first.split('-');            // cell-<ex>-<set>-<field>
const ex = parts[1], set = parts[2];

const readCell = (field) => p.evaluate(t => {
  const el = document.querySelector('[data-testid="' + t + '"]');
  return el ? el.textContent.trim() : null;
}, `cell-${ex}-${set}-${field}`);

await tap(`[data-testid="cell-${ex}-${set}-weight"]`);
const onOpen = await p.evaluate(() => {
  const v = document.querySelector('[data-testid="pad-value"]');
  return v ? v.textContent.trim() : null;
});
console.log('keypad opens showing:', JSON.stringify(onOpen), '<- empty means no deletions needed');

for (const k of ['1', '0', '0']) await tap(`[data-testid="pad-${k}"]`);
await tap('[data-testid="pad-done"]');
console.log('weight now:', JSON.stringify(await readCell('weight')));

await tap(`[data-testid="cell-${ex}-${set}-reps"]`);
await tap('[data-testid="pad-8"]');
await tap('[data-testid="pad-done"]');
console.log('reps now:', JSON.stringify(await readCell('reps')));

await tap(`[data-act="done"][data-ex="${ex}"][data-set="${set}"]`);
const marked = await p.evaluate((sel) => {
  const el = document.querySelector(sel);
  return el ? el.getAttribute('aria-pressed') || el.className : null;
}, `[data-act="done"][data-ex="${ex}"][data-set="${set}"]`);
console.log('set marked done:', marked);
console.log('\nTyped values, every tap counted:', taps, 'taps (original 15, best known 3)');

/* The other path the flow allows: last session's numbers are already in the
   cells, so a lifter repeating them marks the set done and is finished. */
const p2 = await br.newPage({ viewport: { width: 393, height: 852 } });
await p2.goto(pathToFileURL('/home/user/everything-claude-code/redesign/08-build/workout-log.html').href);
await p2.waitForTimeout(600);
const t2 = await p2.evaluate(() => {
  const c = document.querySelector('[data-testid^="cell-"]');
  const parts = c.getAttribute('data-testid').split('-');
  const btn = document.querySelector(`[data-act="done"][data-ex="${parts[1]}"][data-set="${parts[2]}"]`);
  const w = document.querySelector(`[data-testid="cell-${parts[1]}-${parts[2]}-weight"]`).textContent.trim();
  const r = document.querySelector(`[data-testid="cell-${parts[1]}-${parts[2]}-reps"]`).textContent.trim();
  btn.click();
  return { w, r };
});
await p2.waitForTimeout(200);
console.log('Accepting what is already there:', JSON.stringify(t2), '-> 1 tap');
await br.close();
