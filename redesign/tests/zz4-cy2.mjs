import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle');
await p.waitForTimeout(1200);
console.log('GATED:',T(await p.locator('[data-testid="cycle-gated"]').innerText()));
await p.click('[data-testid="cycle-open-settings"]'); await p.waitForTimeout(1200);
console.log('URL',p.url());
console.log('IDS:',(await IDS(p)).join(',').slice(0,1500));
console.log('ERRS',errs);
await b.close();
