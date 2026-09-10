/* Preset-driven action sweep for screens whose dev menu uses data-preset. */
import { chromium } from '@playwright/test';
import fs from 'fs';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const [file,toggleSel]=process.argv.slice(2);
const U='file://'+BUILD+'/'+file;
const src=fs.readFileSync(BUILD+'/'+file,'utf8');
const declared=[...new Set([...src.matchAll(/data-act(?:ion)?="([^"]+)"/g)].map(m=>m[1]))].filter(a=>!a.includes('+')&&!a.includes("'"));
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,150)));
const snap=()=>p.evaluate(()=>{const h=document.documentElement.innerHTML;let x=0;for(let i=0;i<h.length;i++)x=((x<<5)-x+h.charCodeAt(i))|0;
  let ls='';try{for(let i=0;i<localStorage.length;i++)ls+=localStorage.key(i)+'='+localStorage.getItem(localStorage.key(i));}catch(e){}
  return x+'|'+location.href+'|'+ls;});
const list=()=>p.evaluate(()=>{const v=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled&&e.getAttribute('aria-disabled')!=='true';};
  const c={},o=[];Array.from(document.querySelectorAll('[data-action],[data-act]')).filter(v).forEach(e=>{
    const at=e.hasAttribute('data-action')?'data-action':'data-act';const a=e.getAttribute(at);const t=e.getAttribute('data-testid');
    const sel='['+at+'="'+a+'"]'+(t?'[data-testid="'+t+'"]':'');c[sel]=c[sel]||0;o.push({a,t:t||e.tagName,sel,n:c[sel]++,tag:e.tagName});});return o;});
const click=o=>p.evaluate(o=>{const v=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled&&e.getAttribute('aria-disabled')!=='true';};
  const els=Array.from(document.querySelectorAll(o.sel)).filter(v);if(!els[o.n])return false;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(els[o.n].tagName))return 'input';els[o.n].click();return true;},o);
await p.goto(U); await p.waitForTimeout(350); await p.click(toggleSel);
const N=await p.evaluate(()=>document.querySelectorAll('[data-testid^="dev-preset-"]').length);
async function preset(i){await p.goto(U);await p.waitForTimeout(280);await p.click(toggleSel);await p.click('[data-testid="dev-preset-'+i+'"]');await p.waitForTimeout(320);}
const res={};
const note=(a,t,ch)=>{res[a]=res[a]||{ok:[],dead:[],input:[]};const k=t;const b=ch==='input'?res[a].input:(ch?res[a].ok:res[a].dead);if(!b.includes(k))b.push(k);};
for(let i=0;i<N;i++){
  await preset(i); const top=await list();
  for(const it of top){
    if(res[it.a]&&res[it.a].ok.length) continue;
    await preset(i); const b=await snap(); const r=await click(it);
    if(r===false) continue; if(r==='input'){note(it.a,it.t,'input');continue;}
    await p.waitForTimeout(320); note(it.a,it.t,b!==await snap());
    // one level deeper
    const inner=await list(); const fresh=inner.filter(x=>!top.some(y=>y.sel===x.sel&&y.n===x.n));
    for(const j of fresh){ if(res[j.a]&&res[j.a].ok.length) continue;
      await preset(i); await click(it); await p.waitForTimeout(300);
      const b2=await snap(); const r2=await click(j); if(r2===false) continue;
      if(r2==='input'){note(j.a,j.t,'input');continue;}
      await p.waitForTimeout(320); note(j.a,j.t,b2!==await snap()); }
  }
}
console.log('== '+file+'  ('+N+' presets)');
for(const a of declared){const r=res[a];
  if(!r){console.log('  NEVER-REACHED  '+a);continue;}
  if(r.ok.length) { if(r.dead.length) console.log('  PARTIAL        '+a+'   inert: '+r.dead.join(', ')); continue; }
  if(r.input.length&&!r.dead.length){console.log('  INPUT-ONLY     '+a+'   '+r.input.join(', '));continue;}
  console.log('  DEAD           '+a+'   '+r.dead.join(', '));}
if(errs.length)console.log('  pageerrors:',[...new Set(errs)].slice(0,3));
await br.close();
