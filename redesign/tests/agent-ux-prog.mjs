import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
for (const theme of ['dark','light']){
const p=await br.newPage({viewport:{width:393,height:852}});
await p.addInitScript(t=>{try{localStorage.setItem('lk_theme',t)}catch(e){}},theme);
await p.goto(pathToFileURL(path.join(BUILD,'progress.html')).href); await p.waitForTimeout(600);
await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
await p.evaluate(()=>{document.querySelector('[data-testid="progress-scroll"]').scrollTop=600;});
await p.waitForTimeout(400);
await p.screenshot({path:`${S}/prog-${theme}-scrolled.png`});
await p.click('[data-testid="record-701"]'); await p.waitForTimeout(2000);
console.log(theme,'scrollTop',await p.evaluate(()=>document.querySelector('[data-testid="progress-scroll"]').scrollTop));
await p.screenshot({path:`${S}/prog-${theme}-afterrecord.png`});
// header geometry
console.log(await p.evaluate(()=>{const h=document.querySelector('.hdr,[data-large-title]'); return h? JSON.stringify({h:h.style.height, box:h.getBoundingClientRect().toJSON()}):'none';}));
await p.close();
}
await br.close();
