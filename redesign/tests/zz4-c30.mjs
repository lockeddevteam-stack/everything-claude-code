import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(900);
// delete existing plan first so a save is meaningful
await p.click('[data-testid="seg-plan"]'); await p.waitForTimeout(400);
await p.click('[data-testid="plan-delete"]'); await p.waitForTimeout(400);
await p.click('[data-testid="delete-confirm"]'); await p.waitForTimeout(700);
await p.click('[data-testid="seg-chat"]'); await p.waitForTimeout(400);
await p.fill('[data-testid="composer-input"]','Write me the next 8-week block.');
await p.click('[data-testid="composer-send"]'); await p.waitForTimeout(4000);
console.log('THREAD:',T(await p.locator('[data-testid="chat-thread"]').innerText()).slice(-1400));
console.log('IDS:',(await IDS(p)).filter(x=>/offer|save|plan/.test(x)).join(','));
console.log('ERRS',errs);
await b.close();
