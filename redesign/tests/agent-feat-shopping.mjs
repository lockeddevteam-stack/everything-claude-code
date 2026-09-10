import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/shopping.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,160)));
const snap=()=>p.evaluate(()=>document.getElementById('screen').innerHTML);
async function step(label, fn){ const b=await snap(); try{ await fn(); }catch(e){ console.log(label.padEnd(34),'THREW',e.message.slice(0,80)); return; } await p.waitForTimeout(320); const a=await snap();
  console.log(label.padEnd(34), b===a?'NO CHANGE':'changed ('+(a.length-b.length)+')'); }
const go=async(q='')=>{ await p.goto(U+q); await p.waitForTimeout(320); };
const T=t=>'[data-testid="'+t+'"]';

console.log('--- LIST panel');
await go(); await step('tick first item', ()=>p.click('.tick'));
await go(); await step('open-item -> sheet', ()=>p.click(T('open-n1')).catch(()=>p.click('.item__main')));
await go(); await p.click('.item__main'); await p.waitForTimeout(300);
await step('  item sheet: remove', ()=>p.click(T('remove')).catch(()=>p.click('[data-action="remove"]')));
await go(); await p.click('.item__main'); await p.waitForTimeout(300);
await step('  item sheet: find-<store> row', ()=>p.click('[data-testid^="find-"]'));
await go(); await step('export', ()=>p.click(T('export')));
await go(); await step('shop-at open', ()=>p.click(T('shop-at')));
await go(); await p.click(T('shop-at')); await p.waitForTimeout(300);
await step('  shop-at: pick a store', ()=>p.click('[data-testid^="sa-"]:not([data-testid="sa-close"])'));
await go(); await step('clear-done open', ()=>p.click(T('clear-done')));
await go(); await p.click(T('clear-done')); await p.waitForTimeout(300);
await step('  confirm clear-done', ()=>p.click(T('confirm-clear-done')));
await go(); await p.click(T('clear-all')); await p.waitForTimeout(300);
await step('  confirm clear-all', ()=>p.click(T('confirm-clear-all')));
await go(); await step('pick chip', ()=>p.click('[data-testid^="pick-"]'));
await go(); await p.fill(T('add-name'),'Chick'); await p.waitForTimeout(320);
await step('suggest row', ()=>p.click('[data-testid^="suggest-"]'));
await go(); await p.fill(T('add-name'),'Papaya'); await p.waitForTimeout(320);
await step('add-item (new)', ()=>p.click(T('add-item')));
await go(); await p.fill(T('add-name'),'Chicken breast'); await p.waitForTimeout(320);
await step('add-item (dup -> merge sheet)', ()=>p.click(T('add-item')));
await go(); await p.fill(T('add-name'),'Chicken breast'); await p.waitForTimeout(320); await p.click(T('add-item')); await p.waitForTimeout(320);
await step('  merge: Merge', ()=>p.click(T('merge-do')));
await go(); await p.fill(T('add-name'),'Chicken breast'); await p.waitForTimeout(320); await p.click(T('add-item')); await p.waitForTimeout(320);
await step('  merge: Add separate', ()=>p.click(T('merge-sep')));
await go('?state=empty'); await step('add-meal 0', ()=>p.click(T('add-meal-0')));

console.log('--- PANTRY panel');
await go('?panel=pantry'); await step('pan-filter staples', ()=>p.click(T('pan-staples')));
await go('?panel=pantry'); await step('pan-open sheet', ()=>p.click('[data-testid^="pan-open-"]'));
for (const [lbl,tid] of [['pn-empty','pn-empty'],['pn-staple','pn-staple'],['pn-to-list','pn-to-list'],['pn-remove','pn-remove']]) {
  await go('?panel=pantry'); await p.click('[data-testid^="pan-open-"]'); await p.waitForTimeout(320);
  await step('  '+lbl, ()=>p.click(T(tid)));
}
await go('?panel=pantry'); await p.click('[data-testid^="pan-open-"]'); await p.waitForTimeout(320);
const hasIv = await p.$('[data-testid^="iv-save-"]');
if (hasIv) { await step('  interval save (valid)', async()=>{ await p.fill('[data-testid^="iv-"]:not([data-testid^="iv-save"])','21'); await p.click('[data-testid^="iv-save-"]'); }); }
else console.log('  interval save                  not present on first pantry item (needs a staple)');
await go('?panel=pantry'); await p.fill(T('pan-name'),'Paprika'); await step('pan-add', ()=>p.click(T('pan-add')));

console.log('--- STORES panel');
await go('?panel=stores'); await step('add-store preset', ()=>p.click('[data-testid^="preset-"]'));
await go('?panel=stores'); await step('store-toggle', ()=>p.click('[data-testid^="toggle-"]'));
await go('?panel=stores'); await step('store-remove', ()=>p.click('[data-testid^="store-del-"]'));
await go('?panel=stores'); await p.fill(T('cs-name'),'Halal Butcher'); await p.fill(T('cs-url'),'hb.com');
await step('add-custom', ()=>p.click(T('add-custom')));

console.log('--- BUDGET panel');
await go('?panel=budget'); await step('edit-target', ()=>p.click(T('edit-target')));
await go('?panel=budget'); await p.click(T('edit-target')); await p.waitForTimeout(300); await p.fill(T('target-input'),'150');
await step('  save-target', ()=>p.click(T('save-target')));
await go('?panel=budget'); await step('add-purchase (open form)', ()=>p.click(T('add-purchase')));
await go('?panel=budget'); await p.click(T('add-purchase')); await p.waitForTimeout(300);
await p.fill(T('p-name'),'Eggs'); await p.fill(T('p-price'),'4.50');
await step('  save-purchase', ()=>p.click(T('save-purchase')));
await go('?panel=budget'); await step('scan-cam', ()=>p.click(T('scan-cam')));
await go('?panel=budget'); await step('scan-lib', ()=>p.click(T('scan-lib')));
await go('?panel=budget'); await p.click(T('scan-cam')); await p.waitForTimeout(320);
await step('  receipt-save', ()=>p.click(T('receipt-save')));
await go('?panel=budget'); await p.click(T('scan-cam')); await p.waitForTimeout(320);
await step('  receipt-cancel', ()=>p.click(T('receipt-cancel')));
await go('?panel=budget'); await p.fill(T('cmp-input'),'chicken breast');
await step('compare', ()=>p.click(T('compare')));
await go('?panel=budget'); await step('find-swaps', ()=>p.click(T('find-swaps')));
for (const f of ['week','month','all','receipts']) { await go('?panel=budget'); await step('hist '+f, ()=>p.click(T('hist-'+f))); }
await go('?panel=budget'); await step('del-hist', ()=>p.click('[data-testid^="del-"]'));
await go(); await step('back button', ()=>p.click(T('back')));
console.log('--- history rows per filter');
for (const f of ['week','month','all','receipts']) { await go('?panel=budget'); await p.click(T('hist-'+f)); await p.waitForTimeout(300);
  console.log('  '+f, await p.evaluate(()=>document.querySelectorAll('[data-testid^="hist-h"]').length)); }
await br.close();
