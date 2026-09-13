import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle',CYCLEON);
await p.waitForTimeout(1400);
await p.click('[data-testid="cycle-settings"]'); await p.waitForTimeout(700);
console.log('IDS:',(await IDS(p)).filter(x=>!/^cyc-2026|^sym-|^ins-|^acc-|^today-|^pred-/.test(x)).join(','));
const sh=p.locator('[data-testid$="sheet"]').first();
console.log('SHEET:',T(await sh.innerText()).slice(0,1800));
console.log('ERRS',errs);
await b.close();
