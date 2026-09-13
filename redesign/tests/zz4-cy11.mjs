import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle',CYCLEON);
await p.waitForTimeout(1400);
await p.click('[data-testid="qa-log-symptoms"]'); await p.waitForTimeout(700);
console.log('IDS:',(await IDS(p)).join(','));
const sh=p.locator('[data-testid$="sheet"]').first();
console.log('SHEET:',T(await sh.innerText()).slice(0,1200));
console.log('ERRS',errs);
await b.close();
