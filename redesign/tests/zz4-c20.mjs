import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
console.log('initial status:',T(await p.locator('[data-testid="setup-status"]').innerText()));
// add a fact then clear all (2 facts -> plural)
await p.click('[data-testid="setup-add-memory"]'); await p.waitForTimeout(600);
console.log('add ids:',(await IDS(p)).filter(x=>/mem|sheet|dialog|add/.test(x)).join(','));
const inp=p.locator('[data-testid="mem-input"], textarea, input[type=text]').last();
await inp.fill('Trains at 6am'); await p.waitForTimeout(200);
const sv=p.locator('[data-testid="mem-save"],[data-testid$="-save"]').first();
if(await sv.count())await sv.click();
await p.waitForTimeout(700);
console.log('memory block:',T(await p.locator('[data-testid="setup-memory-block"]').innerText()).slice(0,400));
await p.click('[data-testid="setup-clear-memory"]'); await p.waitForTimeout(700);
const cf=p.locator('[data-testid$="-confirm"],[data-testid="confirm-forget"]').first();
if(await cf.count()){await cf.click();await p.waitForTimeout(600);}
console.log('toast HTML:',await p.locator('[data-testid="toast"]').count()?await p.locator('[data-testid="toast"]').innerText():'(none)');
console.log('ERRS',errs);
await b.close();
