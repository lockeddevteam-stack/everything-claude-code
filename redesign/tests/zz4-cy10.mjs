import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle',CYCLEON);
await p.waitForTimeout(1400);
const CS=async()=>T(await p.locator('[data-testid="cycle-scroll"]').innerText());
console.log('RING:',T(await p.locator('[data-testid="cycle-ring"]').innerText()));
// log flow heavy today
await p.click('[data-testid="today-flow-4"]'); await p.waitForTimeout(500);
console.log('after flow:',(await CS()).slice(0,500));
await p.click('[data-testid="today-energy-2"]'); await p.waitForTimeout(400);
console.log('storage day:',await p.evaluate(()=>JSON.parse(localStorage.getItem('lk_mcDays')||'{}')['2026-09-09']));
await p.reload(); await p.waitForTimeout(1500);
console.log('AFTER RELOAD:',(await CS()).slice(0,700));
console.log('ERRS',errs);
await b.close();
