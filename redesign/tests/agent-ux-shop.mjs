import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'shopping.html')).href);
await p.waitForTimeout(500);
// go to Budget panel
await p.click('text=Budget'); await p.waitForTimeout(400);
await p.screenshot({path:S+'/shop-budget.png'});
const scroller = await p.evaluate(()=>{ const e=[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+20 && x.clientHeight>200); return e.map(x=>x.dataset.testid||x.className);});
console.log('scrollers',scroller);
// scroll budget panel to history
await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.scrollHeight>x.clientHeight+20&&x.clientHeight>200); e.scrollTop=e.scrollHeight;});
await p.waitForTimeout(300);
await p.screenshot({path:S+'/shop-budget-bottom.png'});
const dels = await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="del-"]')].map(e=>e.dataset.testid));
console.log('dels',dels);
if(dels.length){
  const before = await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.scrollHeight>x.clientHeight+20&&x.clientHeight>200); return e.scrollTop;});
  await p.click(`[data-testid="${dels[0]}"]`); await p.waitForTimeout(500);
  const after = await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.scrollHeight>x.clientHeight+20&&x.clientHeight>200); return e.scrollTop;});
  console.log('scrollTop before/after delete:',before,after);
  await p.screenshot({path:S+'/shop-budget-after-del.png'});
}
await br.close();
