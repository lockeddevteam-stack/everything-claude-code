import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1400);
await p.click('[data-testid="switch-cycle"]'); await p.waitForTimeout(600);
await p.click('[data-testid="tab-home"]'); await p.waitForTimeout(1200);
console.log('URL',p.url());
const row=p.locator('[data-testid="row-cycle"]');
console.log('home row-cycle count',await row.count());
if(await row.count()){await row.first().click();await p.waitForTimeout(1400);}
console.log('URL',p.url());
console.log('TEXT:',T(await p.locator('[data-testid="screen-cycle"]').first().innerText()).slice(0,300));
console.log('ERRS',errs);
await b.close();
