import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html')).sort();
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
const out={};
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f);
  await p.waitForTimeout(600);
  out[f]=await p.evaluate(()=>{
    const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';};
    const all=[...document.querySelectorAll('*')].filter(vis);
    // TYPE
    const sizes={},lsUnits={};
    for(const e of all){
      const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(!hasText) continue;
      const s=getComputedStyle(e);
      const fs2=Math.round(parseFloat(s.fontSize)*100)/100;
      sizes[fs2]=(sizes[fs2]||0)+1;
    }
    // SPACING
    const sp={};
    for(const e of all){const s=getComputedStyle(e);
      for(const k of ['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','rowGap','columnGap']){
        const v=parseFloat(s[k]); if(v>0) sp[Math.round(v*100)/100]=(sp[Math.round(v*100)/100]||0)+1;}}
    // RADII + corner-shape
    const radii={}; let cs=0, csCapsule=0, sharedRadius=0;
    for(const e of all){const s=getComputedStyle(e);
      const r=s.borderTopLeftRadius; if(r&&r!=='0px'){radii[r]=(radii[r]||0)+1;
        const pr=e.parentElement?getComputedStyle(e.parentElement).borderTopLeftRadius:null;
        if(pr===r&&r!=='0px') sharedRadius++;}
      if(s.cornerShape&&s.cornerShape!=='round'){cs++; if(parseFloat(r)>100)csCapsule++;}}
    // BUTTONS capsule check
    const btns=[...document.querySelectorAll('.btn,button,[role=button]')].filter(vis).map(e=>{
      const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
      return {cls:e.className.toString().slice(0,60),h:Math.round(r.height),w:Math.round(r.width),rad:s.borderTopLeftRadius,capsule:parseFloat(s.borderTopLeftRadius)>=r.height/2-0.6};
    });
    // GLASS
    const glass=all.filter(e=>{const s=getComputedStyle(e);return s.backdropFilter&&s.backdropFilter!=='none';}).map(e=>({cls:e.className.toString().slice(0,40),bf:getComputedStyle(e).backdropFilter}));
    // TAB BAR
    const tb=document.querySelector('.tabbar');
    let tabbar=null;
    if(tb){const r=tb.getBoundingClientRect();const s=getComputedStyle(tb);
      tabbar={left:Math.round(r.left),right:Math.round(393-r.right),bottom:Math.round(852-r.bottom),h:Math.round(r.height),w:Math.round(r.width),rad:s.borderTopLeftRadius,border:s.borderTopWidth+' '+s.borderTopColor,bs:s.boxShadow.slice(0,120),bf:s.backdropFilter};}
    // SELECTS
    const sel=[...document.querySelectorAll('select')].map(e=>({app:getComputedStyle(e).appearance,rad:getComputedStyle(e).borderTopLeftRadius}));
    // EMOJI
    const emoji=(document.body.innerText.match(/\p{Extended_Pictographic}/gu)||[]);
    // ACCENT: fills and inks
    const accentVar=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const parse=c=>{const m=c.match(/[\d.]+/g);return m?m.map(Number):null;};
    const sat=c=>{const v=parse(c);if(!v||v.length<3)return 0;if(v.length>3&&v[3]<0.15)return 0;const mx=Math.max(v[0],v[1],v[2]),mn=Math.min(v[0],v[1],v[2]);return mx-mn;};
    const fills=[],inks=[];
    for(const e of all){const s=getComputedStyle(e);const r=e.getBoundingClientRect();
      if(r.width*r.height>=300&&sat(s.backgroundColor)>40) fills.push({cls:e.className.toString().slice(0,40),tag:e.tagName,bg:s.backgroundColor,area:Math.round(r.width*r.height)});
      const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(hasText&&sat(s.color)>40) inks.push({t:e.textContent.trim().slice(0,24),c:s.color});
      if(sat(s.borderTopColor)>40&&parseFloat(s.borderTopWidth)>0) inks.push({t:'[border]'+e.className.toString().slice(0,24),c:s.borderTopColor});
    }
    // svg strokes with saturated color
    for(const e of document.querySelectorAll('svg')){ if(!vis(e))continue; const s=getComputedStyle(e);
      if(sat(s.color)>40) inks.push({t:'[svg]'+(e.parentElement?.className||'').toString().slice(0,20),c:s.color}); }
    // TRANSITIONS
    const tr={};let springs=0;
    for(const e of all){const s=getComputedStyle(e);
      const ds=s.transitionDuration.split(',').map(x=>x.trim());
      const tf=s.transitionTimingFunction.split(/,(?![^()]*\))/).map(x=>x.trim());
      const pr=s.transitionProperty.split(',').map(x=>x.trim());
      ds.forEach((d,i)=>{if(d==='0s')return; const key=d+'|'+(pr[i]||'?'); tr[key]=(tr[key]||0)+1; if((tf[i]||'').startsWith('linear('))springs++;});}
    // SF icons
    const svgs=[...document.querySelectorAll('svg')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return {vb:e.getAttribute('viewBox'),w:Math.round(r.width),h:Math.round(r.height),sw:getComputedStyle(e).strokeWidth};});
    const iconSizes={},iconSw={};
    for(const s of svgs){iconSizes[s.w+'x'+s.h]=(iconSizes[s.w+'x'+s.h]||0)+1;iconSw[s.sw]=(iconSw[s.sw]||0)+1;}
    // nav bar
    const bar=document.querySelector('[data-large-title],.navbar,.bar,header');
    const barH=bar?Math.round(bar.getBoundingClientRect().height):null;
    const lt=document.querySelector('[data-large-title]');
    let ltInfo=null;
    if(lt){const big=lt.querySelector('.bar__large,.bar__title--large,[data-title-large]')||lt.querySelector('h1');
      ltInfo={html:lt.className.toString().slice(0,40),h:Math.round(lt.getBoundingClientRect().height)};}
    return {sizes,sp,radii,cs,csCapsule,sharedRadius,btns,glass,tabbar,sel,emoji,fills,inks,tr,springs,iconSizes,iconSw,nSvg:svgs.length,barH,ltInfo,
      pageX:getComputedStyle(document.documentElement).getPropertyValue('--page-x').trim(),
      hasLargeTitle:!!lt, accentVar};
  });
}
fs.writeFileSync('/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/measure.json',JSON.stringify(out,null,1));
await b.close();
// summaries
const agg=(k)=>{const m={};for(const f in out)for(const x in out[f][k])m[x]=(m[x]||0)+out[f][k][x];return m;};
console.log('SIZES',JSON.stringify(agg('sizes')));
console.log('SPACING',JSON.stringify(agg('sp')));
console.log('RADII',JSON.stringify(agg('radii')));
console.log('ICONSIZE',JSON.stringify(agg('iconSizes')));
console.log('ICONSW',JSON.stringify(agg('iconSw')));
console.log('TRANS',JSON.stringify(agg('tr')));
for(const f in out){const o=out[f];
 console.log(f.padEnd(22),'fills:',o.fills.length,'inks:',o.inks.length,'cs:',o.cs,'shared:',o.sharedRadius,'emoji:',o.emoji.length,'sel:',o.sel.length,'glass:',o.glass.length,'springs:',o.springs,'btnsNonCapsule:',o.btns.filter(x=>!x.capsule&&x.h>=30).length,'/',o.btns.length);}
console.log('TABBAR', JSON.stringify(out['home.html'].tabbar));
