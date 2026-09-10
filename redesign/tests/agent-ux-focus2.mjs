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
const set=(p,s,v)=>p.evaluate(([s,v])=>{document.querySelector(s).scrollTop=v;},[s,v]);
const top=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.scrollTop:-1;},s);

// library: scroll then enter a group, then back
let p=await open('exercise-library.html');
await set(p,'[data-testid="library-scroll"]',400); await p.waitForTimeout(200);
console.log('lib before', await top(p,'[data-testid="library-scroll"]'));
await p.click('[data-testid="row-group-triceps"]'); await p.waitForTimeout(700);
console.log('lib in group', await top(p,'[data-testid="library-scroll"]'));
await p.screenshot({path:S+'/lib-triceps2.png'});
const backs = await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>/back|Library/i.test(b.getAttribute('aria-label')||b.textContent)).map(b=>b.dataset.testid+'|'+(b.getAttribute('aria-label')||b.textContent.trim())));
console.log('back candidates', backs);
await p.close();

// progress: scroll then open record
p=await open('progress.html');
await set(p,'[data-testid="progress-scroll"]',600); await p.waitForTimeout(200);
console.log('prog before', await top(p,'[data-testid="progress-scroll"]'));
await p.click('[data-testid="record-701"]'); await p.waitForTimeout(700);
console.log('prog in record', await top(p,'[data-testid="progress-scroll"]'));
await p.screenshot({path:S+'/prog-record2.png'});
await p.close();

// train: scroll then open split
p=await open('train.html');
await set(p,'[data-testid="train-scroll"]',500); await p.waitForTimeout(200);
console.log('train before', await top(p,'[data-testid="train-scroll"]'));
await p.click('[data-testid="open-activities"]'); await p.waitForTimeout(700);
console.log('train after open-activities', await top(p,'[data-testid="train-scroll"]'));
await p.screenshot({path:S+'/train-activities.png'});
await p.close();
await br.close();
