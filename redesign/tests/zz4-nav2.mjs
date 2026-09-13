import {open,DEMO,T} from './zz4-lib.mjs';
const targets=[['seg-plan','plan-start'],['seg-plan','plan-open-split'],['seg-plan','plan-adjust'],['seg-plan','plan-more']];
for(const [seg,tid] of targets){
  const {b,p,errs}=await open(DEMO+'#/coach');
  await p.waitForTimeout(700);
  await p.click('[data-testid="'+seg+'"]'); await p.waitForTimeout(400);
  // bind first so plan-start exists
  const bo=p.locator('[data-testid="plan-bind-open"]');
  if(await bo.count()){await bo.click();await p.waitForTimeout(300);await p.click('[data-testid="bind-split-0"]');await p.waitForTimeout(500);
    const ta=p.locator('[data-testid="toast"]'); if(await ta.count()){await p.keyboard.press('Escape');}
    await p.waitForTimeout(2500);}
  const el=p.locator('[data-testid="'+tid+'"]');
  if(!await el.count()){console.log(tid,'-> NOT PRESENT');await b.close();continue;}
  const before=p.url();
  await el.click().catch(e=>console.log('clickerr',e.message)); await p.waitForTimeout(1500);
  console.log(tid,'-> url',p.url()===before?'(same)':p.url(),'| errs',errs.length?errs:'none');
  if(p.url().startsWith('chrome-error'))console.log('   !!! DEAD END');
  else console.log('   view:',T(await p.locator('body').innerText()).slice(0,150));
  await b.close();
}
