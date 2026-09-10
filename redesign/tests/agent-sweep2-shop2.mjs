import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
const L=console.log;
const names=()=>p.evaluate(()=>[...document.querySelectorAll('.item__name')].map(e=>e.textContent.trim()));
const go=async()=>{await p.goto(D+'shopping.html');await p.waitForTimeout(400);};
await go();
L('list:',JSON.stringify(await names()));

L('\n--- merge with a different unit');
// find an item with a non-qty unit
const target=await p.evaluate(()=>{const e=[...document.querySelectorAll('.item__name')].map(x=>x.textContent.trim());return e;});
await p.locator('#add-name').fill('Chicken breast');await p.waitForTimeout(250);
const units=await p.evaluate(()=>[...document.getElementById('add-unit').options].map(o=>o.value));
L('units',units.join(','));
await p.selectOption('#add-unit',units[units.length-1]);
await p.locator('#add-qty').fill('3');
await p.locator('[data-testid="add-item"]').click();await p.waitForTimeout(400);
L('sheet:',(await p.locator('.sheet,.dialog').first().textContent().catch(()=>'none'))?.replace(/\s+/g,' ').slice(0,300));
L('merge buttons:',await p.evaluate(()=>[...document.querySelectorAll('.sheet [data-action],.dialog [data-action]')].map(e=>e.dataset.action+'/'+(e.dataset.testid||''))));
L('row before:',(await names()).filter(n=>/Chicken/i.test(n)));
await p.locator('[data-action="merge-do"]').click({timeout:1500}).catch(()=>L('no merge-do offered (unit mismatch) - good'));await p.waitForTimeout(400);
L('row after:',(await names()).filter(n=>/Chicken/i.test(n)));
L('--- same unit merge');
await go();
await p.locator('#add-name').fill('Chicken breast');await p.waitForTimeout(200);
await p.selectOption('#add-unit','lb');await p.locator('#add-qty').fill('3');
await p.locator('[data-testid="add-item"]').click();await p.waitForTimeout(400);
L('sheet:',(await p.locator('.sheet,.dialog').first().textContent().catch(()=>'')).replace(/\s+/g,' ').slice(0,200));
L('buttons:',await p.evaluate(()=>[...document.querySelectorAll('.sheet [data-action],.dialog [data-action]')].map(e=>e.dataset.action)));
await p.locator('[data-action="merge-do"]').click({timeout:2000}).catch(()=>L('merge-do absent'));await p.waitForTimeout(400);
L('row after merge-do:',(await names()).filter(n=>/Chicken/i.test(n)),'(expect 5 lb)');

L('\n--- merge-sep');
await go();
await p.locator('#add-name').fill('Chicken breast');await p.waitForTimeout(200);
await p.locator('[data-testid="add-item"]').click();await p.waitForTimeout(400);
await p.locator('[data-action="merge-sep"]').click();await p.waitForTimeout(400);
L('rows:',(await names()).filter(n=>/Chicken/i.test(n)));

L('\n--- clear done');
await go();
const ticks=await p.evaluate(()=>[...document.querySelectorAll('[data-action="tick"]')].length);
L('ticks',ticks);
await p.locator('[data-action="tick"]').first().click();await p.waitForTimeout(300);
L('header:',await p.evaluate(()=>document.querySelector('.hdr__title .t-meta')?.textContent));
await p.locator('[data-testid="clear-done"]').click();await p.waitForTimeout(400);
L('sheet:',(await p.locator('.sheet,.dialog').first().textContent().catch(()=>'')).replace(/\s+/g,' ').slice(0,220));
await p.locator('[data-action="do-clear-done"]').click();await p.waitForTimeout(400);
L('toast:',await p.locator('[data-testid="toast"]').textContent().catch(()=>'none'));
L('rows:',(await names()).length);
await p.locator('[data-testid="undo"]').click();await p.waitForTimeout(400);
L('after undo rows:',(await names()).length,'order:',JSON.stringify(await names()));

L('\n--- pantry writes');
await go();await p.locator('[data-testid="seg-pantry"]').click();await p.waitForTimeout(350);
L('pantry hdr:',await p.evaluate(()=>document.querySelector('.hdr__title .t-meta')?.textContent));
const prow=await p.evaluate(()=>[...document.querySelectorAll('[data-action="pan-open"]')].map(e=>e.dataset.testid+'|'+e.textContent.replace(/\s+/g,' ').trim().slice(0,40)));
L('pantry rows:',prow.slice(0,8).join('\n  '));
if(prow[0]){const t=prow[0].split('|')[0];await p.locator(`[data-testid="${t}"]`).click();await p.waitForTimeout(400);
 L('sheet:',(await p.locator('.sheet,.dialog').first().textContent().catch(()=>'')).replace(/\s+/g,' ').slice(0,300));
 L('sheet actions:',await p.evaluate(()=>[...document.querySelectorAll('.sheet [data-action]')].map(e=>e.dataset.action+'/'+(e.dataset.testid||''))));
 // bad interval
 const iv=await p.evaluate(()=>document.querySelector('.sheet input[id^="iv-"]')?.id);
 L('interval field',iv);
 if(iv){await p.locator('#'+iv).fill('999');await p.locator('[data-action="pan-interval-save"]').click();await p.waitForTimeout(400);
   L('after bad interval:',(await p.locator('.sheet').first().textContent().catch(()=>'')).replace(/\s+/g,' ').slice(0,300));}
}
L('\nERRORS '+JSON.stringify(errs));
await b.close();
