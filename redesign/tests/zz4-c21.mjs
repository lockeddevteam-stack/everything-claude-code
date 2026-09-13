import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
console.log('initial status:',T(await p.locator('[data-testid="setup-status"]').innerText()));
await p.click('[data-testid="setup-add-memory"]'); await p.waitForTimeout(700);
console.log('ids:',(await IDS(p)).join(','));
console.log('inputs:',await p.$$eval('input,textarea',ns=>ns.filter(n=>n.offsetParent).map(n=>n.tagName+':'+(n.dataset.testid||''))));
await b.close();
