import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const br=await chromium.launch();
const jobs = [
  ['workout-log.html', null, ['done-2-0','partials-2-0','rir-2-0','exercise-menu-2','btn-add-set-2','unit-head-2','grip-2']],
  ['shopping.html', null, ['clear-done','export','shop-at']],
  ['fuel.html', null, []],
  ['settings.html', null, []],
  ['exercise-library.html', null, []],
  ['progress.html', null, []],
  ['train.html', null, []],
  ['home.html', null, []],
  ['profile.html', null, []],
  ['coach.html', null, []],
  ['review.html', null, []],
  ['split-builder.html', null, []],
];
for (const [file,, ids] of jobs) {
  const p=await br.newPage({viewport:{width:393,height:852}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(pathToFileURL(path.join(BUILD,file)).href);
  await p.waitForTimeout(600);
  const sc = await p.evaluate(()=>{
    const e=[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+40&&x.clientHeight>300);
    return e.length? (e[0].dataset.testid||e[0].id||e[0].className):null;});
  console.log(`\n### ${file} scroller=${sc}`);
  if(!sc) { await p.close(); continue; }
  const sel = sc.startsWith('.')||sc.includes(' ')? null : `[data-testid="${sc}"]`;
  // find clickable buttons in the middle of the scroller
  const targets = ids.length? ids : await p.evaluate(()=> {
    const e=[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+40&&x.clientHeight>300)[0];
    return [...e.querySelectorAll('button[data-testid],input[type=checkbox][data-testid],select[data-testid]')].slice(0,14).map(b=>b.dataset.testid);
  });
  for (const id of targets) {
    await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+40&&x.clientHeight>300)[0]; e.scrollTop=Math.round(e.scrollHeight/3);});
    await p.waitForTimeout(150);
    const before=await p.evaluate(()=>[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+40&&x.clientHeight>300)[0].scrollTop);
    try { await p.click(`[data-testid="${id}"]`, {timeout:1200, force:true}); } catch(e){ continue; }
    await p.waitForTimeout(450);
    const after=await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+40&&x.clientHeight>300)[0]; return e?e.scrollTop:-1;});
    if (Math.abs(after-before)>8) console.log(`  JUMP ${id}: ${before} -> ${after}`);
    // reset by reload for isolation
    await p.goto(pathToFileURL(path.join(BUILD,file)).href); await p.waitForTimeout(400);
  }
  if(errs.length) console.log('  pageerrors', errs);
  await p.close();
}
await br.close();
