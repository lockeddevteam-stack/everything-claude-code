import {open,DEMO,T} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(400);
await p.click('[data-testid="setup-interview-open"]'); await p.waitForTimeout(500);
for(let q=1;q<=6;q++){await p.click('[data-testid="iv-option-0"]');await p.waitForTimeout(120);await p.click('[data-testid="iv-next"]');await p.waitForTimeout(350);}
await p.click('[data-testid="iv-write"]'); await p.waitForTimeout(9000);
await p.click('[data-testid="iv-use"]'); await p.waitForTimeout(900);
console.log('status:',T(await p.locator('[data-testid="setup-status"]').innerText()));
console.log('instructions:',JSON.stringify((await p.inputValue('[data-testid="setup-instructions"]')).slice(0,90)));
console.log('stored:',String(await p.evaluate(()=>localStorage.getItem('lk_coachInstructions'))).slice(0,90));
await p.reload(); await p.waitForTimeout(1400); await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
console.log('AFTER RELOAD:',JSON.stringify((await p.inputValue('[data-testid="setup-instructions"]')).slice(0,90)));
console.log('ERRS',errs);
await b.close();
