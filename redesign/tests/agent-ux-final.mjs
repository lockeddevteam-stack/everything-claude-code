import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const br=await chromium.launch();
// settings dialog focus
let p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'settings.html')).href); await p.waitForTimeout(500);
for(const id of ['row-reset','row-delete','row-sign-out']){
  await p.evaluate(i=>document.querySelector(`[data-testid="${i}"]`).click(),id);
  await p.waitForTimeout(400);
  console.log(id,'-> focused:', await p.evaluate(()=>document.activeElement.dataset.testid+' / '+document.activeElement.textContent.trim()));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
}
await p.close();
// split-builder trash geometry
p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'split-builder.html')).href); await p.waitForTimeout(500);
await p.evaluate(()=>document.querySelector('[data-testid="edit-toggle"]').click()); await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{
  const d=document.querySelector('[data-testid^="day-remove-"]');
  const e=document.querySelector('[data-testid^="ex-remove-"]');
  return JSON.stringify({day:{id:d.dataset.testid,label:d.getAttribute('aria-label'),box:d.getBoundingClientRect().toJSON()},
   ex:{id:e.dataset.testid,label:e.getAttribute('aria-label'),box:e.getBoundingClientRect().toJSON()}});}));
// delete a day -> confirmation?
const before=await p.evaluate(()=>document.querySelectorAll('[data-testid^="day-remove-"]').length);
await p.evaluate(()=>document.querySelector('[data-testid^="day-remove-"]').click()); await p.waitForTimeout(700);
console.log('days',before,'->',await p.evaluate(()=>document.querySelectorAll('[data-testid^="day-remove-"]').length),
 'dialog?',await p.evaluate(()=>!!document.querySelector('.dialog')),'toast:',await p.evaluate(()=>{const t=document.querySelector('.toast');return t?t.textContent.trim():null;}));
await br.close();
