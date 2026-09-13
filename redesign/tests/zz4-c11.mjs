import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);
const S=async()=>T(await p.locator('[data-testid="setup-instructions-block"]').innerText()).slice(0,260);
const ST=async()=>T(await p.locator('[data-testid="setup-status"]').innerText());
const tone=async()=>T(await p.locator('[data-testid="setup-style-block"]').innerText());
const pressed=async()=>p.$$eval('[data-testid^="setup-style-"]',ns=>ns.map(n=>n.dataset.testid+'='+(n.getAttribute('aria-pressed')||n.getAttribute('aria-checked'))));
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(400);
console.log('tone init:',await pressed());
// edit instructions
await p.fill('[data-testid="setup-instructions"]','Always give me a 3-item checklist. Use kg.');
await p.waitForTimeout(300);
console.log('after typing:',await S(),'| status:',await ST());
// change tone
await p.click('[data-testid="setup-style-technical"]'); await p.waitForTimeout(300);
console.log('tone after click:',await pressed(),'| status:',await ST());
await p.click('[data-testid="setup-save"]'); await p.waitForTimeout(500);
console.log('status after save:',await ST());
await p.reload(); await p.waitForTimeout(1200); await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
console.log('\nAFTER RELOAD instructions:',await S());
console.log('AFTER RELOAD value:',JSON.stringify(await p.inputValue('[data-testid="setup-instructions"]')));
console.log('AFTER RELOAD tone:',await pressed());
console.log('storage:',await p.evaluate(()=>({i:localStorage.getItem('lk_coachInstructions'),s:localStorage.getItem('lk_coachStyle')})));
// quick chips
await p.click('[data-testid="setup-quick-2"]'); await p.waitForTimeout(300);
console.log('\nafter quick-2:',JSON.stringify(await p.inputValue('[data-testid="setup-instructions"]')),'status',await ST());
console.log('ERRS',errs);
await b.close();
