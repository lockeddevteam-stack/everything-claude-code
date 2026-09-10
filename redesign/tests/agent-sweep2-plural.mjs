import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const L=console.log;
await p.goto(D+'shopping.html');await p.waitForTimeout(500);
// untick everything, then tick exactly one
await p.evaluate(()=>{[...document.querySelectorAll('[data-action="tick"]')].forEach(t=>{if(t.getAttribute('aria-pressed')==='true')t.click();});});
await p.waitForTimeout(400);
L('done count now:',await p.evaluate(()=>[...document.querySelectorAll('[data-action="tick"]')].filter(t=>t.getAttribute('aria-pressed')==='true').length));
await p.evaluate(()=>document.querySelector('[data-action="tick"]').click());await p.waitForTimeout(400);
L('done count:',await p.evaluate(()=>[...document.querySelectorAll('[data-action="tick"]')].filter(t=>t.getAttribute('aria-pressed')==='true').length));
await p.evaluate(()=>document.querySelector('[data-testid="clear-done"]').click());await p.waitForTimeout(500);
L('dialog text:',(await p.evaluate(()=>document.querySelector('.dialog')?.textContent||'none')).replace(/\s+/g,' '));
await p.evaluate(()=>document.querySelector('[data-action="do-clear-done"]').click());await p.waitForTimeout(500);
L('toast:',await p.evaluate(()=>document.querySelector('[data-testid="toast"]')?.textContent));
// header count with 0 left
await p.goto(D+'shopping.html');await p.waitForTimeout(500);
await p.evaluate(()=>{[...document.querySelectorAll('[data-action="tick"]')].forEach(t=>{if(t.getAttribute('aria-pressed')!=='true')t.click();});});
await p.waitForTimeout(600);
L('all ticked header:',await p.evaluate(()=>document.querySelector('.hdr__title')?.textContent.replace(/\s+/g,' ').trim()));
await p.evaluate(()=>document.querySelector('[data-testid="clear-all"]')?.click());await p.waitForTimeout(500);
L('clear-all dialog with 0 unpicked:',(await p.evaluate(()=>document.querySelector('.dialog')?.textContent||'none')).replace(/\s+/g,' '));
await p.evaluate(()=>document.querySelector('[data-action="do-clear-all"]').click());await p.waitForTimeout(500);
L('empty list header:',await p.evaluate(()=>document.querySelector('.hdr__title')?.textContent.replace(/\s+/g,' ').trim()));
L('empty body:',(await p.evaluate(()=>document.getElementById('body')?.innerText||'')).replace(/\s+/g,' ').slice(0,220));
await b.close();
