import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(400);
await p.click('[data-testid="setup-interview-open"]'); await p.waitForTimeout(600);
for(let q=1;q<=6;q++){await p.click('[data-testid="iv-option-0"]'); await p.waitForTimeout(150); await p.click('[data-testid="iv-next"]'); await p.waitForTimeout(400);}
console.log('REVIEW:',T(await p.locator('[data-testid="iv-review"]').innerText()).slice(0,1200));
await p.click('[data-testid="iv-write"]'); await p.waitForTimeout(9000);
console.log('\nAFTER WRITE ids:',(await IDS(p)).join(','));
const views=await p.$$eval('[data-testid^="view-"]',ns=>ns.filter(n=>n.offsetParent!==null).map(n=>n.dataset.testid+': '+n.innerText));
console.log(T(views.join(' || ')).slice(0,2000));
console.log('ERRS',errs);
await b.close();
