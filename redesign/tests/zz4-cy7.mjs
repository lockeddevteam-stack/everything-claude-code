import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home');
await p.waitForTimeout(1400);
console.log('home ids:',(await IDS(p)).filter(x=>/cycle|account|row-/.test(x)).join(','));
await p.click('[data-testid="open-account"]'); await p.waitForTimeout(1200);
console.log('URL',p.url());
await p.click('[data-testid="switch-cycle"]'); await p.waitForTimeout(600);
console.log('switch:',await p.getAttribute('[data-testid="switch-cycle"]','aria-checked'));
await p.locator('[data-testid="back"]').first().click(); await p.waitForTimeout(1000);
console.log('URL',p.url());
console.log('home ids:',(await IDS(p)).filter(x=>/cycle/.test(x)).join(','));
const r=p.locator('[data-testid="row-cycle"]');
if(await r.count()){await r.first().click();await p.waitForTimeout(1400);
console.log('URL',p.url());
console.log('TEXT:',T(await p.locator('[data-testid="screen-cycle"]').first().innerText()).slice(0,350));}
console.log('ERRS',errs);
await b.close();
