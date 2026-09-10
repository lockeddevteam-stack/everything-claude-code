import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
await ctx.grantPermissions(['clipboard-read','clipboard-write']).catch(()=>{});
const L=(...a)=>console.log(...a);
const txt=async s=>p.locator(s).first().textContent().catch(()=>'<none>');
const cnt=async s=>p.locator(s).count();
const go=async(panel)=>{await p.goto(D+'shopping.html');await p.waitForTimeout(400);
  if(panel)await p.locator(`[data-testid="seg-${panel}"]`).click();await p.waitForTimeout(300);};
const state=()=>p.evaluate(()=>{
  const rows=[...document.querySelectorAll('[data-testid^="item-"]')].map(e=>e.textContent.trim().replace(/\s+/g,' '));
  return {rows,count:rows.length,hdr:document.querySelector('[data-testid="hdr-count"]')?.textContent||document.querySelector('.hdr__title .t-meta')?.textContent||''};});

L('=== A. list rows and header');
await go(null);
L('rows',(await state()).count, 'hdrcount', JSON.stringify((await state()).hdr));
const listTids=await p.evaluate(()=>[...document.querySelectorAll('[data-testid]')].map(e=>e.dataset.testid).filter(t=>/^(item|row|tick)/.test(t)).slice(0,30));
L('list testids',listTids.join(','));

L('\n=== B. clear all');
await go(null);
const before=await p.evaluate(()=>document.body.innerText.match(/\d+ to get/)?.[0]);
L('header before:',before);
await p.locator('[data-testid="clear-all"]').click().catch(e=>L('clear-all click fail'));
await p.waitForTimeout(400);
L('sheet open?',await cnt('.sheet,.dialog'), await txt('.sheet,.dialog'));
const doClear=await p.evaluate(()=>[...document.querySelectorAll('[data-action="do-clear-all"]')].map(e=>e.dataset.testid));
L('confirm testids',doClear.join(','));
if(doClear[0]){await p.locator(`[data-testid="${doClear[0]}"]`).click();await p.waitForTimeout(400);}
L('toast:',await txt('[data-testid="toast"]'));
L('header after:',await p.evaluate(()=>document.body.innerText.match(/\d+ to get/)?.[0]));
L('rows after:',(await state()).count);
L('undo present?',await cnt('[data-testid="undo"]'));
await p.locator('[data-testid="undo"]').click().catch(()=>{});await p.waitForTimeout(400);
L('after undo header:',await p.evaluate(()=>document.body.innerText.match(/\d+ to get/)?.[0]),'rows',(await state()).count);

L('\n=== C. merge (add duplicate)');
await go(null);
const firstName=await p.evaluate(()=>document.querySelector('.row__title')?.textContent.trim());
L('existing first item:',firstName);
await p.locator('#add-name').fill(firstName||'Eggs');await p.waitForTimeout(250);
await p.locator('#add-qty').fill('3').catch(()=>{});
const unitVal=await p.evaluate(()=>document.getElementById('add-unit')?.value);
L('unit select value',unitVal);
await p.locator('[data-testid="add-item"]').click().catch(async()=>{await p.keyboard.press('Enter');});
await p.waitForTimeout(400);
L('merge sheet?',await cnt('.sheet,.dialog'),(await txt('.sheet,.dialog'))?.replace(/\s+/g,' ').slice(0,240));
const rowBefore=await p.evaluate(n=>{const el=[...document.querySelectorAll('.row')].find(r=>r.textContent.includes(n));return el?el.textContent.replace(/\s+/g,' ').trim():null;},firstName);
await p.locator('[data-action="merge-do"]').click().catch(()=>L('merge-do missing'));
await p.waitForTimeout(400);
const rowAfter=await p.evaluate(n=>{const el=[...document.querySelectorAll('.row')].find(r=>r.textContent.includes(n));return el?el.textContent.replace(/\s+/g,' ').trim():null;},firstName);
L('row before merge:',rowBefore);L('row after merge :',rowAfter);
L('query cleared?',await p.evaluate(()=>document.getElementById('add-name')?.value));

L('\n=== D. budget: numbers');
await go('budget');
L('header count:',await p.evaluate(()=>document.querySelector('.hdr .t-meta,.hdr__title .t-meta')?.textContent));
L('budget card:',(await txt('[data-testid="budget-card"]'))?.replace(/\s+/g,' ').slice(0,200));
const hist=await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="hist-"]')].map(e=>e.dataset.testid+' :: '+e.textContent.replace(/\s+/g,' ').trim().slice(0,60)));
L('history:',hist.join('\n  '));

L('\n=== E. log a purchase');
await p.locator('[data-testid="add-purchase"]').click().catch(()=>L('add-purchase missing'));await p.waitForTimeout(350);
const fields=await p.evaluate(()=>[...document.querySelectorAll('#p-name,#p-price,#p-qty,#p-store')].map(e=>e.id));
L('form fields:',fields.join(','));
await p.locator('#p-name').fill('Test protein');
await p.locator('#p-price').fill('10.00');
await p.locator('#p-qty').fill('2');
const storeOpts=await p.evaluate(()=>[...(document.getElementById('p-store')?.options||[])].map(o=>o.value+':'+o.text));
L('store options:',storeOpts.join(' | '));
await p.locator('[data-testid="save-purchase"]').click().catch(()=>L('save-purchase testid missing'));
await p.waitForTimeout(450);
L('budget card after:',(await txt('[data-testid="budget-card"]'))?.replace(/\s+/g,' ').slice(0,200));
L('header after:',await p.evaluate(()=>document.querySelector('.hdr .t-meta,.hdr__title .t-meta')?.textContent));
L('top history row:',await p.evaluate(()=>document.querySelector('[data-testid^="hist-"]')?.textContent.replace(/\s+/g,' ').trim().slice(0,80)));
L('expected week: 86.40 + 20.00 = 106.40  -> left 13.60');

L('\n=== F. delete a history row + undo');
const delTid=await p.evaluate(()=>document.querySelector('[data-action="del-hist"]')?.dataset.testid);
L('del testid',delTid);
if(delTid){await p.locator(`[data-testid="${delTid}"]`).click();await p.waitForTimeout(400);
 L('toast:',await txt('[data-testid="toast"]'));
 L('budget card:',(await txt('[data-testid="budget-card"]'))?.replace(/\s+/g,' ').slice(0,160));
 await p.locator('[data-testid="undo"]').click().catch(()=>L('no undo'));await p.waitForTimeout(400);
 L('budget after undo:',(await txt('[data-testid="budget-card"]'))?.replace(/\s+/g,' ').slice(0,160));}

L('\n=== G. receipt');
await go('budget');
const scanT=await p.evaluate(()=>[...document.querySelectorAll('[data-action^="scan"]')].map(e=>e.dataset.testid+'/'+e.dataset.action));
L('scan controls:',scanT.join(', '));
await p.locator('[data-action="scan-cam"]').click().catch(()=>L('scan-cam missing'));await p.waitForTimeout(400);
L('receipt total shown:',await txt('[data-testid="receipt-total"]'));
const rstore=await p.evaluate(()=>document.getElementById('r-store')?document.getElementById('r-store').value:'<no r-store>');
L('r-store value:',rstore);
await p.locator('[data-action="receipt-save"]').click().catch(()=>L('receipt-save missing'));await p.waitForTimeout(450);
L('budget card:',(await txt('[data-testid="budget-card"]'))?.replace(/\s+/g,' ').slice(0,200));
L('top history:',await p.evaluate(()=>document.querySelector('[data-testid^="hist-"]')?.textContent.replace(/\s+/g,' ').trim().slice(0,80)));
L('expected week: 86.40 + 52.40 = 138.80 -> OVER by 18.80');
await p.locator('[data-testid="seg-pantry"]').click().catch(()=>{});await p.waitForTimeout(350);
L('pantry count text:',await p.evaluate(()=>document.querySelector('.hdr .t-meta,.hdr__title .t-meta')?.textContent));
L('pantry rows:',await p.evaluate(()=>[...document.querySelectorAll('.row__title')].map(e=>e.textContent.trim()).join(' | ')));

L('\n=== H. export');
await go(null);
await p.locator('[data-testid="export"]').click().catch(()=>L('export missing'));await p.waitForTimeout(500);
L('toast:',await txt('[data-testid="toast"]'));

L('\nERRORS: '+JSON.stringify(errs));
await b.close();
