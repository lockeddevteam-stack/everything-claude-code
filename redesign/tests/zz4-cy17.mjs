import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle',CYCLEON);
await p.waitForTimeout(1400);
const CS=async()=>T(await p.locator('[data-testid="cycle-scroll"]').innerText());
// open a past day: Sep 3
await p.click('[data-testid="cyc-2026-09-03"]'); await p.waitForTimeout(600);
await p.click('[data-testid="event-miscarriage"]'); await p.waitForTimeout(300);
await p.click('[data-testid="day-save"]'); await p.waitForTimeout(800);
console.log('AFTER LOSS:',(await CS()).slice(0,1500));
console.log('\nIDS:',(await IDS(p)).filter(x=>!/^cyc-2026|^sym-|^today-/.test(x)).join(','));
console.log('ERRS',errs);
await b.close();
