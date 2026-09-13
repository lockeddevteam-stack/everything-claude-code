import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);
const sheet=async()=>T(await p.locator('[data-testid="iv-sheet"]').innerText());
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(400);
await p.click('[data-testid="setup-interview-open"]'); await p.waitForTimeout(600);
for(let q=1;q<=3;q++){
  console.log('\n--- Q'+q+': '+(await sheet()).slice(0,600));
  await p.click('[data-testid="iv-option-1"]'); await p.waitForTimeout(250);
  await p.click('[data-testid="iv-next"]'); await p.waitForTimeout(500);
}
console.log('\n--- Q4 (abandon here): '+(await sheet()).slice(0,400));
await p.click('[data-testid="iv-close"]'); await p.waitForTimeout(500);
console.log('\nsetup block:',T(await p.locator('[data-testid="setup-interview-block"]').innerText()));
await p.reload(); await p.waitForTimeout(1200);
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
console.log('AFTER RELOAD block:',T(await p.locator('[data-testid="setup-interview-block"]').innerText()));
await p.click('[data-testid="setup-interview-open"]'); await p.waitForTimeout(600);
console.log('RESUMED sheet:',(await sheet()).slice(0,600));
console.log('IDS',(await IDS(p)).filter(x=>/iv-/.test(x)).join(','));
console.log('ERRS',errs);
await b.close();
