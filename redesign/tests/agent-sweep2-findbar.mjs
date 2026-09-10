import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const L=console.log;
await p.goto(D+'exercise-library.html');await p.waitForTimeout(800);
await p.evaluate(()=>{document.getElementById('dev-menu').hidden=false;document.querySelector('[data-testid="dev-preset-4"]').click();});
await p.waitForTimeout(800);
await p.evaluate(()=>{const sc=document.getElementById('body');sc.scrollTop=sc.scrollHeight;});
await p.waitForTimeout(600);
L('scroll maxed:',await p.evaluate(()=>{const sc=document.getElementById('body');return {st:sc.scrollTop,max:sc.scrollHeight-sc.clientHeight,padB:getComputedStyle(sc).paddingBottom};}));
const fb=await p.evaluate(()=>{const f=document.querySelector('.findbar--bottom');const r=f.getBoundingClientRect();
  return {t:Math.round(r.top),b:Math.round(r.bottom),h:Math.round(r.height)};});
L('findbar:',JSON.stringify(fb));
const rows=await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="row-ex-"]')].map(e=>{const r=e.getBoundingClientRect();
  const cx=r.left+r.width/2,cy=r.top+r.height/2;const hit=document.elementFromPoint(cx,cy);
  return {t:e.dataset.testid,top:Math.round(r.top),bot:Math.round(r.bottom),
    hitTid:hit?(hit.closest('[data-testid]')?.dataset.testid||hit.className):'null',
    reachable:!!(hit&&e.contains(hit))};}));
L(rows.map(r=>JSON.stringify(r)).join('\n'));
L('\nreal click on last row:');
const last=rows[rows.length-1];
try{await p.locator(`[data-testid="${last.t}"]`).click({timeout:2500});L('  clicked OK, sheet:',await p.evaluate(()=>document.querySelector('.sheet')?.dataset.testid||'none'));}
catch(e){L('  BLOCKED:',String(e).split('\n').slice(0,6).join(' | ').slice(0,400));}
await p.screenshot({path:'/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/exlib-findbar.png'});
L('\nsame check on the plain browse list (preset 0):');
await p.goto(D+'exercise-library.html');await p.waitForTimeout(800);
await p.evaluate(()=>{const sc=document.getElementById('body');sc.scrollTop=sc.scrollHeight;});await p.waitForTimeout(600);
L(await p.evaluate(()=>{const rows=[...document.querySelectorAll('[data-testid^="row-group-"]')];const last=rows[rows.length-1];
  const r=last.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  const sc=document.getElementById('body');
  return {last:last.dataset.testid,top:Math.round(r.top),bot:Math.round(r.bottom),
    hit:hit?(hit.closest('[data-testid]')?.dataset.testid||hit.className):'null',
    reachable:!!(hit&&last.contains(hit)),st:sc.scrollTop,max:sc.scrollHeight-sc.clientHeight};}));
await b.close();
