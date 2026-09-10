import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/shots';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text().slice(0,120));});
await p.goto('file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html');
await p.waitForTimeout(1500);
console.log('errors:',errs.slice(0,8));
console.log(await p.evaluate(()=>({
  statePills:document.querySelectorAll('.statepill,[data-state-menu],[class*=state]').length,
  stateText:[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='STATE').length,
  screens:document.querySelectorAll('.screen').length,
  glass:[...document.querySelectorAll('*')].filter(e=>{const b=getComputedStyle(e).backdropFilter;return b&&b!=='none';}).map(e=>String(e.className).slice(0,30)).slice(0,10),
  sheets:document.querySelectorAll('.sheet').length,
  grabbers:document.querySelectorAll('.sheet__grab').length,
  title:document.title
})));
await p.screenshot({path:OUT+'/demo-entry.png'});
// try opening a sheet
const opened=await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/choose another|add exercise|shop at/i.test(x.textContent));if(b){b.click();return b.textContent.trim();}return null;});
await p.waitForTimeout(900);
await p.screenshot({path:OUT+'/demo-sheet.png'});
console.log('clicked',opened);
await b.close();
