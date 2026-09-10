import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
async function open(f){const p=await br.newPage({viewport:{width:393,height:852}});
  await p.goto(pathToFileURL(path.join(BUILD,f+'.html')).href); await p.waitForTimeout(600);
  await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';}); return p;}

// coach composer
let p=await open('coach');
const inp = await p.evaluate(()=>{const i=document.querySelector('[data-testid="composer-input"]')||document.querySelector('input[placeholder*="Ask"],textarea'); return i?(i.dataset.testid||i.tagName):null;});
console.log('coach composer input:',inp);
await p.fill('[data-testid="composer-input"]','Should I deload?').catch(async()=>{await p.fill('input[placeholder*="Ask"]','Should I deload?');});
await p.waitForTimeout(200);
await p.screenshot({path:S+'/coach-typed.png'});
await p.click('[data-testid="composer-send"]'); await p.waitForTimeout(1200);
await p.screenshot({path:S+'/coach-sent.png'});
console.log('coach input value after send:', await p.evaluate(()=>{const i=document.querySelector('[data-testid="composer-input"]')||document.querySelector('input[placeholder*="Ask"]');return i?i.value:null;}));
console.log('msg count:', await p.evaluate(()=>document.querySelectorAll('.msg,[data-testid^="msg"]').length));
await p.close();

// split-builder edit toggle
p=await open('split-builder');
await p.screenshot({path:S+'/sb-0.png'});
await p.click('[data-testid="edit-toggle"]'); await p.waitForTimeout(600);
await p.screenshot({path:S+'/sb-edit.png'});
console.log('edit label now:', await p.evaluate(()=>{const b=document.querySelector('[data-testid="edit-toggle"]');return b?b.textContent.trim():null;}));
// back with unsaved
await p.close();

// shopping back + export
p=await open('shopping');
await p.click('[data-testid="export"]'); await p.waitForTimeout(700);
await p.screenshot({path:S+'/shop-export2.png'});
await p.click('[data-testid="back"]'); await p.waitForTimeout(600);
await p.screenshot({path:S+'/shop-back.png'});
await p.close();

// fuel meal row
p=await open('fuel');
await p.screenshot({path:S+'/fuel-0.png'});
await p.click('[data-testid="meal-0"]'); await p.waitForTimeout(700);
await p.screenshot({path:S+'/fuel-meal0.png'});
await p.close();
await br.close();
