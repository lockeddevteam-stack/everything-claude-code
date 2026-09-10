import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'review.html')).href); await p.waitForTimeout(500);
await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
await p.evaluate(()=>document.querySelector('[data-testid="review-scroll"]').scrollTop=9999); await p.waitForTimeout(300);
await p.click('[data-testid="action-discard"]'); await p.waitForTimeout(500);
// where are the confirm buttons?
console.log(await p.evaluate(()=>{
  const o={};
  for(const id of ['action-discard-confirm','action-discard-cancel','section-discard','actionbar']){
    const e=document.querySelector(`[data-testid="${id}"]`); o[id]=e?e.getBoundingClientRect().toJSON():null;}
  o.vh=innerHeight; return JSON.stringify(o);}));
await p.click('[data-testid="action-discard-confirm"]',{force:true}); await p.waitForTimeout(300);
console.log('toast el:', await p.evaluate(()=>{const t=document.querySelector('.toast,[data-testid="toast"]'); return t?JSON.stringify({txt:t.textContent.trim(),box:t.getBoundingClientRect().toJSON()}):null;}));
await p.screenshot({path:S+'/rev-discarded2.png'});
await br.close();
