import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'shopping.html')).href); await p.waitForTimeout(500);
await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
await p.click('[data-testid="seg-pantry"]').catch(()=>p.click('text=Pantry')); await p.waitForTimeout(500);
await p.screenshot({path:S+'/shop-pantry.png'});
const ids=await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="pan-remove-"]')].map(e=>e.dataset.testid));
console.log('pantry removes',ids.slice(0,3));
if(ids[0]){ await p.click(`[data-testid="${ids[0]}"]`); await p.waitForTimeout(700);
  await p.screenshot({path:S+'/shop-pantry-removed.png'});
  console.log('toast?', await p.evaluate(()=>!!document.querySelector('.toast,[data-testid="toast"]'))); }
await p.click('text=Stores'); await p.waitForTimeout(500);
await p.screenshot({path:S+'/shop-stores.png'});
const sids=await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="store-del-"]')].map(e=>e.dataset.testid));
console.log('store dels',sids);
if(sids[0]){ await p.click(`[data-testid="${sids[0]}"]`); await p.waitForTimeout(700);
  await p.screenshot({path:S+'/shop-store-removed.png'});
  console.log('toast?', await p.evaluate(()=>!!document.querySelector('.toast,[data-testid="toast"]'))); }
// empty state check: where are picks?
await p.goto(pathToFileURL(path.join(BUILD,'shopping.html')).href); await p.waitForTimeout(400);
await p.evaluate(()=>{document.querySelector('.dev__item[data-state="empty"]').click();}); await p.waitForTimeout(600);
const geo=await p.evaluate(()=>{
  const empty=[...document.querySelectorAll('*')].find(e=>/Tap a pick above/.test(e.textContent)&&e.children.length===0);
  const picks=[...document.querySelectorAll('*')].find(e=>/FITNESS PICKS|Fitness picks/i.test(e.textContent)&&e.children.length===0);
  return {emptyTop: empty?Math.round(empty.getBoundingClientRect().top):null, picksTop: picks?Math.round(picks.getBoundingClientRect().top):null, copy: empty?empty.textContent.trim():null};
});
console.log(JSON.stringify(geo));
await br.close();
