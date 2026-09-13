import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const SKIP=/^(tab-|dev|demo|shelf-resume|back|row-reset|row-delete|row-sign-out|row-force-refresh|row-restore|row-export|cs-delete|cs-export|confirm-|setup-clear-memory|plan-delete|action-new-chat|row-storage-unit)/;
const routes=[['#/coach','coach'],['#/home/cycle','cycle'],['#/profile/settings','settings'],['#/profile','profile']];
for(const [r,name] of routes){
  const seen=new Set(); let noops=[];
  for(let round=0;round<70;round++){
    const {b,p,errs}=await open(DEMO+r,CYCLEON);
    await p.waitForTimeout(1200);
    const all=(await IDS(p)).filter(x=>!SKIP.test(x));
    const next=all.find(x=>!seen.has(x));
    if(!next){await b.close();break;}
    seen.add(next);
    const before=JSON.stringify((await IDS(p)))+await p.evaluate(()=>document.body.innerText.length);
    try{ await p.locator('[data-testid="'+next+'"]').first().click({timeout:3000}); }catch(e){ await b.close(); continue; }
    await p.waitForTimeout(900);
    const url=p.url();
    const after=JSON.stringify((await IDS(p)))+await p.evaluate(()=>document.body.innerText.length);
    if(url.startsWith('chrome-error'))console.log(name,next,'!! DEAD END',url);
    else if(before===after&&url===DEMO+r)noops.push(next);
    if(errs.length)console.log(name,next,'ERRS',errs);
    await b.close();
  }
  console.log('##',name,'no-op candidates:',noops.join(',')||'(none)');
}
