import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/workout-log.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
await p.goto(U); await p.waitForTimeout(450);
// open the add-exercise sheet
const ax=await p.$('[data-act="addex"]');
console.log('addex present:', !!ax);
if(ax){ await ax.click(); await p.waitForTimeout(450);
  const rows=()=>p.evaluate(()=>document.querySelectorAll('[data-testid^="addex-pick-"]').length);
  console.log('rows before typing:', await rows());
  const b=await snap();
  await p.fill('[data-testid="addex-search"]','zzzqqq'); await p.waitForTimeout(500);
  console.log('rows after typing zzzqqq:', await rows(), '| dom changed:', b!==await snap());
}
await br.close();
