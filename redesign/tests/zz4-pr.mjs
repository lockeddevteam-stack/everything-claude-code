import {open,DEMO,T} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile');
await p.waitForTimeout(1400);
console.log(await p.$$eval('[data-testid^="pr-"],[data-testid^="stat-"],[data-testid="identity"]',ns=>ns.map(n=>n.dataset.testid+' <'+n.tagName+'> role='+(n.getAttribute('role')||'-')+' tabindex='+(n.getAttribute('tabindex')||'-'))));
await b.close();
