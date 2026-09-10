import {browser,page,DIR} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const st=()=>p.evaluate(()=>{const t=document.querySelector('.tabbar');const r=t.getBoundingClientRect();
  return {min:t.getAttribute('data-minimized'),box:[Math.round(r.left),Math.round(r.right)],
    items:[...t.querySelectorAll('.tabbar__item')].map(e=>e.dataset.testid+':'+Math.round(e.getBoundingClientRect().width))};});
await p.goto(DIR+'train.html');await p.waitForTimeout(700);
L('rest      ',JSON.stringify(await st()));
await p.mouse.move(196,400);await p.mouse.wheel(0,700);await p.waitForTimeout(700);
L('collapsed ',JSON.stringify(await st()));
L('\n-- can a tap on the collapsed bar bring the other tabs back?');
await p.mouse.click(196,812);await p.waitForTimeout(700);
L('after tapping the capsule',JSON.stringify(await st()),'url',p.url().split("/").pop());
await p.goto(DIR+'train.html');await p.waitForTimeout(700);
await p.mouse.move(196,400);await p.mouse.wheel(0,700);await p.waitForTimeout(700);
L('\n-- can any of the four hidden tabs be clicked while collapsed?');
for(const t of ['tab-home','tab-fuel','tab-coach','tab-profile']){
  let e=null;
  try{await p.locator('[data-testid="'+t+'"]').click({timeout:1500});}catch(x){e=String(x.message).split('\n')[0].slice(0,70);}
  L('  ',t,e||('CLICKED -> '+p.url().split('/').pop()));
  if(!e){await p.goto(DIR+'train.html');await p.waitForTimeout(600);await p.mouse.move(196,400);await p.mouse.wheel(0,700);await p.waitForTimeout(600);}
}
L('\n-- keyboard: can Tab reach them?');
await p.goto(DIR+'train.html');await p.waitForTimeout(700);
await p.mouse.move(196,400);await p.mouse.wheel(0,700);await p.waitForTimeout(700);
const reach=await p.evaluate(()=>{const out=[];
  document.querySelectorAll('.tabbar__item').forEach(e=>{const cs=getComputedStyle(e);const r=e.getBoundingClientRect();
    out.push(e.dataset.testid+' w='+Math.round(r.width)+' disp='+cs.display+' vis='+cs.visibility+' pe='+cs.pointerEvents+' tabindex='+e.tabIndex);});
  return out;});
L(JSON.stringify(reach,null,1));
L('\n-- does a keyboard focus on a hidden tab restore the bar?');
await p.evaluate(()=>document.querySelector('[data-testid="tab-profile"]').focus());
await p.waitForTimeout(500);
L('after focus',JSON.stringify(await st()),'activeElement',await p.evaluate(()=>document.activeElement.dataset?.testid));
L('ERRS',p.__errs);
await b.close();
