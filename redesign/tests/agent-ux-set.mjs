import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'settings.html')).href); await p.waitForTimeout(500);
await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
const top=()=>p.evaluate(()=>document.querySelector('[data-testid="settings-scroll"]').scrollTop);
// scroll to danger zone
await p.evaluate(()=>{const e=document.querySelector('[data-testid="settings-scroll"]'); e.scrollTop=e.scrollHeight;});
await p.waitForTimeout(400);
await p.screenshot({path:S+'/set-danger.png'});
console.log('scroll at danger', await top());
for (const id of ['row-reset','row-delete','row-sign-out']){
  await p.evaluate(()=>{const e=document.querySelector('[data-testid="settings-scroll"]'); e.scrollTop=e.scrollHeight;});
  await p.waitForTimeout(250);
  const before=await top();
  const ok=await p.evaluate(i=>{const b=document.querySelector(`[data-testid="${i}"]`); if(!b)return false; b.click(); return true;},id);
  await p.waitForTimeout(600);
  console.log(id, ok, 'scroll', before,'->', await top());
  await p.screenshot({path:`${S}/set-${id}.png`});
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  console.log('  after Escape, overlay open?', await p.evaluate(()=>!!document.querySelector('.sheet,.dialog')), 'scroll', await top());
}
// appearance row
await p.evaluate(()=>{const e=document.querySelector('[data-testid="settings-scroll"]'); e.scrollTop=500;});
await p.waitForTimeout(200);
const b2=await top();
await p.click('[data-testid="row-appearance"]'); await p.waitForTimeout(600);
await p.screenshot({path:S+'/set-appearance.png'});
console.log('appearance scroll',b2,'->',await top());
await br.close();
