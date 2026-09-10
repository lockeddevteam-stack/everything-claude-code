import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
// preset 2 is "Search inside a group"
await p.goto(U); await p.waitForTimeout(350); await p.click('#dev-toggle');
await p.click('[data-testid="dev-preset-2"]'); await p.waitForTimeout(500);
const has=await p.$('[data-testid="search-all"]');
console.log('search-all present in preset 2:', !!has);
if(has){ const b=await snap(); await has.click(); await p.waitForTimeout(450);
  console.log('scope-all ->', b===await snap()?'NO CHANGE (dead)':'ok'); }
await br.close();
