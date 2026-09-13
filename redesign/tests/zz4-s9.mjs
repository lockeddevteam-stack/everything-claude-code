import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1500);
// make changes first
await p.click('[data-testid="row-body"]'); await p.waitForTimeout(400);
await p.fill('[data-testid="field-weight"]','99'); await p.click('[data-testid="save-body"]'); await p.waitForTimeout(500);
await p.click('[data-testid="row-reset"]'); await p.waitForTimeout(800);
console.log('IDS:',(await IDS(p)).filter(x=>/reset|dialog|confirm|cancel/.test(x)).join(','));
const dl=p.locator('[data-testid$="dialog"]').first();
if(await dl.count())console.log('dialog:',T(await dl.innerText()).slice(0,500));
console.log('ERRS',errs);
await b.close();
