import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle',CYCLEON);
await p.waitForTimeout(1400);
await p.click('[data-testid="cycle-view-toggle"]'); await p.waitForTimeout(800);
console.log('CALENDAR:',T(await p.locator('[data-testid="cycle-scroll"]').innerText()).slice(0,1400));
console.log('ids:',(await IDS(p)).filter(x=>!/^cyc-/.test(x)).join(','));
console.log('ERRS',errs);
await b.close();
