import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1500);
await p.click('[data-testid="row-body"]'); await p.waitForTimeout(800);
console.log('IDS:',(await IDS(p)).filter(x=>/sheet|body|opt-|field|save|close/.test(x)).join(','));
const sh=p.locator('[data-testid$="sheet"],[role=dialog]').first();
console.log('SHEET:',T(await sh.innerText()).slice(0,900));
console.log('ERRS',errs);
await b.close();
