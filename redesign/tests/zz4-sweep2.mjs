import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const SKIP=/^(tab-|dev|demo|shelf-resume|back|row-reset|row-delete|row-sign-out|row-force-refresh|row-restore|row-export|cs-delete|cs-export|confirm-|cyc-|cal-2026|setup-clear-memory|plan-delete|action-new-chat|msg-)/;
const r=process.argv[2];
const {b,p,errs}=await open(DEMO+r,CYCLEON);
await p.waitForTimeout(1300);
const base=(await IDS(p)).filter(x=>!SKIP.test(x));
const noops=[];
for(const tid of base){
  await p.goto(DEMO+r); await p.reload(); await p.waitForTimeout(1100);
  const el=p.locator('[data-testid="'+tid+'"]').first();
  if(!await el.count())continue;
  const before=(await IDS(p)).join(',')+'|'+await p.evaluate(()=>document.body.innerText);
  const n0=errs.length;
  try{await el.click({timeout:2500});}catch(e){console.log(tid,'NOT CLICKABLE');continue;}
  await p.waitForTimeout(800);
  const url=p.url();
  if(url.startsWith('chrome-error')){console.log(tid,'!! DEAD END');continue;}
  const after=(await IDS(p)).join(',')+'|'+await p.evaluate(()=>document.body.innerText);
  if(before===after&&url===DEMO+r)noops.push(tid);
  if(errs.length>n0)console.log(tid,'ERRS',errs.slice(n0));
}
console.log('## '+r+' no-ops:',noops.join(',')||'(none)');
console.log('## all errs:',errs);
await b.close();
