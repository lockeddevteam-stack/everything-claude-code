import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
await p.click('[data-testid="setup-add-memory"]'); await p.waitForTimeout(400);
await p.fill('[data-testid="setup-memory-text"]','Trains at 6am');
await p.click('[data-testid="setup-memory-save"]'); await p.waitForTimeout(1200);
await p.waitForTimeout(3500); // let toast clear
console.log('before clear:',T(await p.locator('[data-testid="setup-memory-block"]').innerText()).slice(0,300));
await p.click('[data-testid="setup-clear-memory"]'); await p.waitForTimeout(900);
console.log('after clear :',T(await p.locator('[data-testid="setup-memory-block"]').innerText()).slice(0,300));
const t=p.locator('[data-testid="toast"]');
await p.click('[data-testid="setup-clear-memory"]'); await p.waitForTimeout(900);
console.log('after 2nd tap:',T(await p.locator('[data-testid="setup-memory-block"]').innerText()).slice(0,300));
console.log('toast:',await t.count()?await t.innerText():'(none)');
console.log('toast HTML:',await t.count()?await t.innerHTML():'');
console.log('ERRS',errs);
await b.close();
