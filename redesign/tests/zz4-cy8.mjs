import {open,DEMO,T} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1400);
await p.click('[data-testid="switch-cycle"]'); await p.waitForTimeout(400);
await p.goto(DEMO+'#/home'); await p.reload(); await p.waitForTimeout(1600);
console.log('HOME cycle row:',T(await p.locator('[data-testid="row-cycle"]').innerText()));
console.log('ERRS',errs);
await b.close();
