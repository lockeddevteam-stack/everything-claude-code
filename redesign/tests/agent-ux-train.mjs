import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'train.html')).href); await p.waitForTimeout(500);
await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
await p.evaluate(()=>{document.querySelector('[data-testid="train-scroll"]').scrollTop=560;});
await p.waitForTimeout(300);
await p.screenshot({path:S+'/train-cardio.png'});
const before=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,'').length);
await p.click('[data-testid="log-q_row"]'); await p.waitForTimeout(900);
await p.screenshot({path:S+'/train-cardio-logged.png'});
console.log('toast?',await p.evaluate(()=>!!document.querySelector('.toast')),'textlen',before,'->',await p.evaluate(()=>document.body.textContent.replace(/\s+/g,'').length));
// history view + back
await p.click('[data-testid="open-history"]'); await p.waitForTimeout(700);
await p.screenshot({path:S+'/train-history.png'});
await br.close();
