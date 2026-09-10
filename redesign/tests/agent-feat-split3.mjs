import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/split-builder.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
async function preset(i){await p.goto(U);await p.waitForTimeout(320);await p.click('#devToggle');await p.click('[data-testid="dev-preset-'+i+'"]');await p.waitForTimeout(380);}
const names=await (async()=>{await p.goto(U);await p.waitForTimeout(320);await p.click('#devToggle');
  return p.evaluate(()=>Array.from(document.querySelectorAll('[data-testid^="dev-preset-"]')).map(e=>e.textContent));})();
console.log(names.map((n,i)=>i+':'+n).join(' | '));
for(const target of ['add-exercise','open-swap','lift-clear','toast-action','edit-toggle']){
  for(let i=0;i<names.length;i++){ await preset(i);
    if(await p.$('[data-action="'+target+'"]')){ console.log(target,'first in preset',i); break; }
    if(i===names.length-1) console.log(target,'NOT PRESENT in any preset root'); }
}
await br.close();
