import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);
const sheet=async()=>T(await p.locator('[data-testid="iv-sheet"]').innerText());
await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(400);
await p.click('[data-testid="setup-interview-open"]'); await p.waitForTimeout(600);
for(let q=1;q<=3;q++){await p.click('[data-testid="iv-option-1"]'); await p.waitForTimeout(200); await p.click('[data-testid="iv-next"]'); await p.waitForTimeout(400);}
await p.click('[data-testid="iv-close"]'); await p.waitForTimeout(400);
await p.reload(); await p.waitForTimeout(1200); await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
console.log('IDS in block:',(await IDS(p)).filter(x=>/setup-interview|iv-/.test(x)).join(','));
await p.click('[data-testid="setup-interview-resume"]').catch(async()=>{await p.getByText('Resume at question 4').click();});
await p.waitForTimeout(600);
console.log('RESUMED:',(await sheet()).slice(0,500));
for(let q=4;q<=6;q++){
  const o=p.locator('[data-testid="iv-option-0"]'); if(await o.count()){await o.click();await p.waitForTimeout(200);}
  console.log('Q'+q+':',(await sheet()).slice(0,400));
  await p.click('[data-testid="iv-next"]'); await p.waitForTimeout(600);
}
console.log('\nEND:',(await IDS(p)).join(','));
try{console.log('sheet:',(await sheet()).slice(0,900));}catch(e){console.log('no sheet');}
console.log('setup block:',T(await p.locator('[data-testid="setup-interview-block"]').innerText()).slice(0,400));
await p.reload(); await p.waitForTimeout(1200); await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
console.log('AFTER RELOAD:',T(await p.locator('[data-testid="setup-interview-block"]').innerText()).slice(0,400));
console.log('ERRS',errs);
await b.close();
