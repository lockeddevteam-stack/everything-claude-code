import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle',CYCLEON);
await p.waitForTimeout(1400);
const CS=async()=>T(await p.locator('[data-testid="cycle-scroll"]').innerText());
const has=async(t)=>await p.locator('[data-testid="'+t+'"]').count();
await p.click('[data-testid="cyc-2026-09-03"]'); await p.waitForTimeout(500);
await p.click('[data-testid="event-miscarriage"]'); await p.click('[data-testid="day-save"]'); await p.waitForTimeout(700);
console.log('recovery present:',await has('cycle-recovery'));
await p.click('[data-testid="end-recovery"]'); await p.waitForTimeout(700);
console.log('IDS after dismiss:',(await IDS(p)).filter(x=>/recov|dialog|confirm|ring/.test(x)).join(','));
console.log('text:',(await CS()).slice(0,400));
// maybe confirm dialog
const cf=p.locator('[data-testid$="-confirm"]');
if(await cf.count()){console.log('confirm dialog:',T(await p.locator('[role=alertdialog],[data-testid$="-dialog"]').first().innerText()).slice(0,300)); await cf.first().click(); await p.waitForTimeout(700);}
console.log('\nAFTER DISMISS:',(await CS()).slice(0,600));
console.log('recovery present:',await has('cycle-recovery'));
await p.reload(); await p.waitForTimeout(1500);
console.log('AFTER RELOAD recovery present:',await has('cycle-recovery'),'| ring:',T(await p.locator('[data-testid="cycle-ring"]').innerText()));
// log a LATER loss
await p.click('[data-testid="cyc-2026-09-07"]'); await p.waitForTimeout(500);
await p.click('[data-testid="event-miscarriage"]'); await p.click('[data-testid="day-save"]'); await p.waitForTimeout(800);
console.log('\nAFTER LATER LOSS recovery present:',await has('cycle-recovery'));
console.log('ring:',T(await p.locator('[data-testid="cycle-ring"]').innerText()));
console.log('text:',(await CS()).slice(0,600));
console.log('ERRS',errs);
await b.close();
