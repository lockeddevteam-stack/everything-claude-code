import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
await p.click('[data-testid="setup-add-memory"]'); await p.waitForTimeout(500);
await p.fill('[data-testid="setup-memory-text"]','Trains at 6am');
await p.click('[data-testid="setup-memory-save"]'); await p.waitForTimeout(600);
console.log('memory:',T(await p.locator('[data-testid="setup-memory-block"]').innerText()).slice(0,400));
await p.click('[data-testid="setup-clear-memory"]'); await p.waitForTimeout(700);
console.log('ids:',(await IDS(p)).filter(x=>/confirm|dialog|toast|forget/.test(x)).join(','));
const cf=p.locator('[data-testid$="-confirm"]').first();
if(await cf.count()){console.log('dialog',T(await p.locator('[data-testid$="-dialog"]').first().innerText()).slice(0,200));await cf.click();await p.waitForTimeout(600);}
const t=p.locator('[data-testid="toast"]');
if(await t.count()){console.log('toast TEXT:',T(await t.innerText()));console.log('toast HTML:',await t.innerHTML());}
// single forget
await p.click('[data-testid="toast-action"]').catch(()=>{}); await p.waitForTimeout(500);
await p.click('[data-testid="setup-forget-0"]').catch(()=>{}); await p.waitForTimeout(600);
const t2=p.locator('[data-testid="toast"]'); if(await t2.count())console.log('single forget toast:',T(await t2.innerText()));
console.log('ERRS',errs);
await b.close();
