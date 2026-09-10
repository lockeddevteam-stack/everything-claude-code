import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
async function open(file){
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.goto(pathToFileURL(path.join(BUILD,file)).href); await p.waitForTimeout(600);
  await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
  return p;
}
const top = (p,sel)=>p.evaluate(s=>{const e=document.querySelector(s); return e?e.scrollTop:-1;},sel);

// --- exercise-library: enter a group
let p = await open('exercise-library.html');
console.log('lib scrollTop at rest', await top(p,'[data-testid="library-scroll"]'));
await p.screenshot({path:S+'/lib-0.png'});
await p.click('[data-testid="row-group-triceps"]'); await p.waitForTimeout(600);
console.log('lib after enter triceps', await top(p,'[data-testid="library-scroll"]'));
await p.screenshot({path:S+'/lib-triceps.png'});
await p.close();

// --- progress record
p = await open('progress.html');
await p.screenshot({path:S+'/prog-0.png'});
await p.click('[data-testid="record-701"]'); await p.waitForTimeout(700);
console.log('progress after record open', await top(p,'[data-testid="progress-scroll"]'));
await p.screenshot({path:S+'/prog-record.png'});
await p.close();

// --- shopping clear-done open + cancel
p = await open('shopping.html');
await p.evaluate(()=>{document.querySelector('[data-testid="shop-scroll"]').scrollTop=400;});
await p.waitForTimeout(200);
console.log('shop before', await top(p,'[data-testid="shop-scroll"]'));
await p.click('[data-testid="clear-done"]'); await p.waitForTimeout(500);
await p.screenshot({path:S+'/shop-cleardone.png'});
await p.click('[data-testid="cancel-clear-done"]'); await p.waitForTimeout(500);
console.log('shop after cancel', await top(p,'[data-testid="shop-scroll"]'));
await p.screenshot({path:S+'/shop-after-cancel.png'});
// export
await p.evaluate(()=>{document.querySelector('[data-testid="shop-scroll"]').scrollTop=400;});
await p.click('[data-testid="export"]'); await p.waitForTimeout(600);
await p.screenshot({path:S+'/shop-export.png'});
await p.close();
await br.close();
