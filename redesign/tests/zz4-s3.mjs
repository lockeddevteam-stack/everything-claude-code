import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1500);
await p.click('[data-testid="row-weight-unit"]'); await p.waitForTimeout(700);
console.log('IDS:',(await IDS(p)).filter(x=>!/^switch|^notif|^sound|^row-(rest|remind|week|appe|dist|stor|exp|force|sign|reset|delete|tutorial|password|identity|body)/.test(x)).join(','));
const sh=p.locator('[role=dialog],[data-testid$="sheet"],[data-testid$="dialog"]').first();
if(await sh.count())console.log('SHEET:',T(await sh.innerText()).slice(0,600));
console.log('ERRS',errs);
await b.close();
