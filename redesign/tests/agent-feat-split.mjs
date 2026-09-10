import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/split-builder.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
const acts=()=>p.evaluate(()=>{const v=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled;};
  return [...new Set(Array.from(document.querySelectorAll('[data-action]')).filter(v).map(e=>e.getAttribute('data-action')+'|'+(e.getAttribute('data-testid')||e.tagName)))];});
const seen={};
async function preset(i){ await p.goto(U); await p.waitForTimeout(350); await p.click('#devToggle').catch(()=>{});
  await p.click('[data-testid="dev-preset-'+i+'"]'); await p.waitForTimeout(400); }
const N=await (async()=>{await p.goto(U);await p.waitForTimeout(350);await p.click('#devToggle').catch(()=>{});
  return p.evaluate(()=>document.querySelectorAll('[data-testid^="dev-preset-"]').length);})();
console.log('presets:',N);
for(let i=0;i<N;i++){
  await preset(i); const list=await acts();
  for(const key of list){ const [act,tid]=key.split('|');
    if(seen[act]==='ok') continue;
    await preset(i);
    const b=await snap();
    const ok=await p.evaluate(([a,t])=>{const v=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled;};
      const el=Array.from(document.querySelectorAll('[data-action="'+a+'"]')).filter(v).filter(e=>(e.getAttribute('data-testid')||e.tagName)===t)[0];
      if(!el) return false; if(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return 'input'; el.click(); return true;},[act,tid]);
    if(ok==='input'){ seen[act]=seen[act]||'input'; continue; }
    if(!ok) continue;
    await p.waitForTimeout(380);
    seen[act]=(b!==await snap())?'ok':(seen[act]||'DEAD:'+tid);
  }
}
const declared=[...new Set([...(await (await import('fs')).promises.readFile('/home/user/everything-claude-code/redesign/08-build/split-builder.html','utf8')).matchAll(/data-action="([^"]+)"/g)].map(m=>m[1]))].filter(a=>!a.includes('+'));
for(const a of declared) console.log(a.padEnd(16), seen[a]||'NOT-REACHED');
await br.close();
