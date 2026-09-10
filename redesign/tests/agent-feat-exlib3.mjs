import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
await p.goto(U); await p.waitForTimeout(350); await p.click('#dev-toggle');
await p.click('[data-testid="dev-preset-2"]'); await p.waitForTimeout(500);
console.log('scope:', await p.evaluate(()=>({q:document.querySelector('[data-testid=\"search-input\"]').value, all:!!document.querySelector('[data-testid="search-all"]')})));
for(const q of ['row','press','curl','bench','squat','raise','fly','pull']){
  await p.goto(U); await p.waitForTimeout(300); await p.click('#dev-toggle'); await p.click('[data-testid="dev-preset-2"]'); await p.waitForTimeout(400);
  await p.fill('[data-testid="search-input"]', q); await p.waitForTimeout(500);
  if(await p.$('[data-testid="search-all"]')){ const b=await snap(); await p.click('[data-testid="search-all"]'); await p.waitForTimeout(450);
    console.log('q='+q+' scope-all ->', b===await snap()?'NO CHANGE (dead)':'ok'); await br.close(); process.exit(0); }
}
console.log('search-all never rendered across 8 queries in the grouped-search preset');
await br.close();
