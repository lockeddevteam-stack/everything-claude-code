import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);
const PV=async()=>T(await p.locator('[data-testid="view-plan"]').innerText()).slice(0,1000);
const toast=async()=>{const c=await p.locator('[data-testid="toast"]').count();return c?T(await p.locator('[data-testid="toast"]').innerText()):'(none)'};
await p.click('[data-testid="seg-plan"]'); await p.waitForTimeout(500);
await p.click('[data-testid="plan-bind-open"]'); await p.waitForTimeout(500);
await p.click('[data-testid="bind-split-1"]'); await p.waitForTimeout(700);
console.log('AFTER BIND:',await PV()); console.log('toast:',await toast());
await p.reload(); await p.waitForTimeout(1200); await p.click('[data-testid="seg-plan"]'); await p.waitForTimeout(500);
console.log('\nAFTER RELOAD:',await PV());
// delete
await p.click('[data-testid="plan-delete"]'); await p.waitForTimeout(600);
console.log('\nAFTER DELETE ids:',(await IDS(p)).join(','));
console.log('view:',T(await p.locator('[data-testid="view-plan"]').innerText()).slice(0,800));
console.log('toast:',await toast());
// confirm dialog?
const cd=await p.locator('[data-testid$="-confirm"], [role=alertdialog]').count();
console.log('confirm count',cd);
console.log('ERRS',errs);
await b.close();
