import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
async function open(file, theme='dark'){
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.addInitScript(t=>{try{localStorage.setItem('lk_theme',t)}catch(e){}},theme);
  await p.goto(pathToFileURL(path.join(BUILD,file)).href);
  await p.waitForTimeout(500);
  await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d) d.style.display='none';});
  return p;
}
const p = await open('workout-log.html');
const st = () => p.evaluate(()=>{const e=document.querySelector('[data-testid="log-scroll"]'); return e?e.scrollTop:-1;});
// discard
await p.click('[data-testid="btn-discard"]'); await p.waitForTimeout(500);
await p.screenshot({path:S+'/wl-discard.png'});
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
await p.screenshot({path:S+'/wl-after-esc.png'});
console.log('after esc, dialog present?', await p.evaluate(()=>!!document.querySelector('.dialog,[role=alertdialog]')));
// finish
await p.evaluate(()=>{const s=document.querySelector('[data-testid="scrim"]')||document.querySelector('.scrim'); if(s)s.click();});
await p.waitForTimeout(300);
await p.click('[data-testid="btn-finish"]'); await p.waitForTimeout(500);
await p.screenshot({path:S+'/wl-finish.png'});
await br.close();
