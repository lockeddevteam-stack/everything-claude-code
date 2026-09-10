import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/workout-log.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
const states=['mid-session','first-set','keypad','rest','exercise-done','plates','empty','loading','error'];
async function st(n){await p.goto(U);await p.waitForTimeout(320);await p.click('[data-testid="dev-toggle"]');await p.click('[data-testid="dev-'+n+'"]');await p.waitForTimeout(380);}
const seen={};
for(const n of states){ await st(n);
  const list=await p.evaluate(()=>{const v=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled;};
    const c={},o=[];Array.from(document.querySelectorAll('[data-act]')).filter(v).forEach(e=>{const a=e.getAttribute('data-act');
      const t=e.getAttribute('data-testid');const sel='[data-act="'+a+'"]'+(t?'[data-testid="'+t+'"]':'');c[sel]=c[sel]||0;
      o.push({a,sel,n:c[sel]++,tag:e.tagName,t:t||e.tagName});});return o;});
  for(const it of list){ if(seen[it.a]==='ok') continue;
    await st(n); const b=await snap();
    const r=await p.evaluate(o=>{const v=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled;};
      const els=Array.from(document.querySelectorAll(o.sel)).filter(v); if(!els[o.n])return false;
      if(/^(INPUT|TEXTAREA|SELECT)$/.test(els[o.n].tagName))return 'input'; els[o.n].click(); return true;},it);
    if(r===false) continue; if(r==='input'){seen[it.a]=seen[it.a]||'input';continue;}
    await p.waitForTimeout(340); seen[it.a]=(b!==await snap())?'ok':(seen[it.a]||'DEAD:'+it.t); }
}
import fs from 'fs';
const declared=[...new Set([...fs.readFileSync('/home/user/everything-claude-code/redesign/08-build/workout-log.html','utf8').matchAll(/data-act="([^"]+)"/g)].map(m=>m[1]))].filter(a=>!a.includes('+')&&!a.includes("'"));
for(const a of declared){ const v=seen[a]||'NOT-REACHED'; if(v!=='ok') console.log(a.padEnd(18), v); }
console.log('total declared', declared.length, 'ok', declared.filter(a=>seen[a]==='ok').length);
await br.close();
