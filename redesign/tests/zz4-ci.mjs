import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);
const CV=async()=>T(await p.locator('[data-testid="view-checkin"]').innerText());
const go=async()=>{await p.click('[data-testid="seg-checkin"]');await p.waitForTimeout(500);};
await go();
for(const [k,v] of [['energy',4],['sleep',2],['soreness',5],['stress',1],['mood',3]]){await p.click(`[data-testid="feel-${k}-${v}"]`);await p.waitForTimeout(150);}
console.log('BEFORE SAVE:',(await CV()).slice(0,700));
await p.click('[data-testid="checkin-save"]'); await p.waitForTimeout(800);
console.log('\nAFTER SAVE:',(await CV()).slice(0,1200));
await p.reload(); await p.waitForTimeout(1200); await go();
console.log('\nAFTER RELOAD:',(await CV()).slice(0,1200));
console.log('storage feedback count:',await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk_feedback')).length}catch(e){return 'n/a'}}));
console.log('ERRS',errs);
await b.close();
