import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:402,height:874}}); const p = await ctx.newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/home.html'); await p.waitForTimeout(400);
for (const st of ['training','loading','error']) {
  await p.goto('file:///home/user/everything-claude-code/redesign/08-build/home.html?state='+st); await p.waitForTimeout(400);
  const r = await p.evaluate(()=>{
    const e=document.querySelector('[data-testid="open-account"]');
    const r=e.getBoundingClientRect();
    const top = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
    return {rect:{x:r.x,y:r.y,w:r.width,h:r.height}, topEl: top ? top.tagName+'.'+top.className+'#'+(top.dataset.testid||'') : null,
      vis: getComputedStyle(e).visibility, op: getComputedStyle(e).opacity, pe: getComputedStyle(e).pointerEvents};
  });
  console.log(st, JSON.stringify(r));
}
await b.close();
