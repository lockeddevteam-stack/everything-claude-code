import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
for(const tid of ['plan-more','plan-adjust','plan-target-0','plan-phase-toggle-1']){
  const {b,p,errs}=await open(DEMO+'#/coach');
  await p.waitForTimeout(900);
  await p.click('[data-testid="seg-plan"]'); await p.waitForTimeout(500);
  const before={url:p.url(),ids:(await IDS(p)).join(','),txt:T(await p.locator('[data-testid="view-plan"]').innerText())};
  await p.click('[data-testid="'+tid+'"]'); await p.waitForTimeout(1500);
  const url=p.url(); const ids=(await IDS(p)).join(',');
  let txt=''; try{txt=T(await p.locator('[data-testid="view-plan"]').innerText())}catch(e){txt='(view-plan gone)'}
  console.log('\n'+tid,'url:',url===before.url?'(same)':url);
  console.log('  ids delta:',ids.split(',').filter(x=>!before.ids.split(',').includes(x)).join(',')||'(none)');
  console.log('  text changed:',txt!==before.txt, txt==='(view-plan gone)'?'| body: '+T(await p.locator('body').innerText()).slice(0,200):'');
  if(txt!==before.txt&&txt!=='(view-plan gone)')console.log('  now:',txt.slice(0,400));
  console.log('  errs:',errs);
  await b.close();
}
