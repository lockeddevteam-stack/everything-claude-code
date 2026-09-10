import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html')).sort();
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{
    const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';};
    const parse=c=>{const m=c.match(/[\d.]+/g);return m?m.map(Number):null;};
    const sat=c=>{const v=parse(c);if(!v||v.length<3)return 0;if(v.length>3&&v[3]<0.15)return 0;return Math.max(v[0],v[1],v[2])-Math.min(v[0],v[1],v[2]);};
    const all=[...document.querySelectorAll('*')].filter(vis);
    // real .btn only
    const btn=[...document.querySelectorAll('.btn')].filter(vis).map(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);
      return {cls:e.className.toString(),h:+r.height.toFixed(1),rad:s.borderTopLeftRadius,ok:parseFloat(s.borderTopLeftRadius)>=r.height/2-0.6};});
    // non-capsule buttonish elements >=30px tall that aren't .btn
    const other=[...document.querySelectorAll('button,[role=button]')].filter(vis).filter(e=>!e.classList.contains('btn')).map(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);
      return {cls:e.className.toString().slice(0,50),h:+r.height.toFixed(1),w:+r.width.toFixed(1),rad:s.borderTopLeftRadius};});
    const oR={}; other.forEach(o=>{const k=(o.cls.split(' ')[0]||'?')+' r'+o.rad+' h'+Math.round(o.h);oR[k]=(oR[k]||0)+1;});
    // selects
    const sel=[...document.querySelectorAll('select')].filter(vis).map(e=>{const s=getComputedStyle(e);return {app:s.appearance+'/'+s.webkitAppearance,rad:s.borderTopLeftRadius,bi:s.backgroundImage.slice(0,40),h:Math.round(e.getBoundingClientRect().height)};});
    const selK={}; sel.forEach(s=>{const k=JSON.stringify(s);selK[k]=(selK[k]||0)+1;});
    // fills detail
    const fills=[];
    for(const e of all){const s=getComputedStyle(e);const r=e.getBoundingClientRect();
      if(r.width*r.height>=300&&sat(s.backgroundColor)>40) fills.push(e.tagName+'.'+e.className.toString().slice(0,34)+' '+s.backgroundColor+' '+Math.round(r.width)+'x'+Math.round(r.height));}
    // inks detail
    const inks=[];
    for(const e of all){const s=getComputedStyle(e);
      const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(hasText&&sat(s.color)>40) inks.push('"'+e.textContent.trim().slice(0,20)+'" '+s.color);
      if(sat(s.borderTopColor)>40&&parseFloat(s.borderTopWidth)>0) inks.push('[bd]'+e.className.toString().slice(0,20)+' '+s.borderTopColor);}
    for(const e of document.querySelectorAll('svg')){if(!vis(e))continue;const s=getComputedStyle(e); if(sat(s.color)>40||sat(s.stroke)>40) inks.push('[svg]'+(e.parentElement?.className||'').toString().slice(0,20)+' '+s.color);}
    // tab bar full
    const tb=document.querySelector('.tabbar'); let tabbar=null;
    if(tb){const s=getComputedStyle(tb);tabbar={bs:s.boxShadow,border:s.border,outline:s.outline};}
    return {btnBad:btn.filter(x=>!x.ok),btnN:btn.length,other:oR,sel:selK,fills,inks,tabbar};
  });
  console.log('==== '+f);
  console.log(' .btn total',r.btnN,'non-capsule',r.btnBad.length, JSON.stringify(r.btnBad.slice(0,5)));
  console.log(' other buttons:',JSON.stringify(r.other));
  if(Object.keys(r.sel).length) console.log(' SELECTS:',JSON.stringify(r.sel));
  console.log(' FILLS:',r.fills.join(' | '));
  console.log(' INKS:',r.inks.join(' | ').slice(0,700));
  if(f==='home.html') console.log(' TABBAR:',JSON.stringify(r.tabbar));
}
await b.close();
