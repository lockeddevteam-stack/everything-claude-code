import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);
const PV=async()=>T(await p.locator('[data-testid="view-plan"]').innerText()).slice(0,900);
await p.click('[data-testid="seg-plan"]'); await p.waitForTimeout(500);
// bind
await p.click('[data-testid="plan-bind-open"]'); await p.waitForTimeout(600);
console.log('BIND ids:',(await IDS(p)).filter(x=>/bind|sheet|split/.test(x)).join(','));
const sheetSel='[data-testid$="-sheet"]';
console.log('BIND sheet:',T(await p.locator(sheetSel).first().innerText()).slice(0,800));
console.log('ERRS',errs);
await b.close();
