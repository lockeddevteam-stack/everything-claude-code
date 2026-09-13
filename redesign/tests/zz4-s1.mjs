import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile');
await p.waitForTimeout(1500);
console.log('PROFILE:',T(await p.locator('[data-testid="screen-profile"]').first().innerText()).slice(0,1600));
console.log('IDS:',(await IDS(p)).join(','));
console.log('ERRS',errs);
await b.close();
