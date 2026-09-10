import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html'));
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();
const out={};
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f);
  await p.waitForTimeout(500);
  out[f]=await p.evaluate(()=>{
    const vis=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
    const all=[...document.querySelectorAll('.screen *')].filter(vis);
    // TYPE
    const SCALE=[[34,41],[28,34],[22,28],[20,25],[17,22],[16,21],[15,20],[13,18],[12,16],[11,13],[36,43],[28,34]];
    const sizes={}, offscale=[];
    for(const el of all){
      const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(!hasText) continue;
      const cs=getComputedStyle(el);
      const fs=parseFloat(cs.fontSize), lh=parseFloat(cs.lineHeight);
      const k=`${fs}/${lh}/${cs.fontWeight}`;
      sizes[k]=(sizes[k]||0)+1;
      if(!SCALE.some(([s])=>Math.abs(s-fs)<0.6)) offscale.push({t:el.textContent.trim().slice(0,30),fs,cls:el.className});
    }
    // RADII
    const radii={}, nonConcentric=[];
    for(const el of all){
      const cs=getComputedStyle(el);
      const r=parseFloat(cs.borderTopLeftRadius);
      if(r>0){ radii[Math.round(r)]=(radii[Math.round(r)]||0)+1;
        const par=el.parentElement; if(par){const pcs=getComputedStyle(par); const pr=parseFloat(pcs.borderTopLeftRadius);
          if(pr>0 && Math.abs(pr-r)<0.5 && r<500) nonConcentric.push({el:el.className,par:par.className,r});}
      }
    }
    const cornerShape=[...all].filter(el=>getComputedStyle(el).cornerShape&&getComputedStyle(el).cornerShape!=='round').length;
    // SPACING
    const offgrid=[];const spacings={};
    for(const el of all){const cs=getComputedStyle(el);
      for(const prop of ['paddingTop','paddingBottom','paddingLeft','paddingRight','marginTop','marginBottom','rowGap','columnGap']){
        const v=parseFloat(cs[prop]); if(!v||isNaN(v)) continue;
        spacings[v]=(spacings[v]||0)+1;
        if(v%4!==0) offgrid.push({cls:String(el.className).slice(0,40),prop,v});
      }}
    // ACCENT
    const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const norm=s=>s.replace(/\s/g,'');
    const accentFills=all.filter(el=>{const cs=getComputedStyle(el);
      const bg=cs.backgroundColor; const r=el.getBoundingClientRect();
      if(r.width*r.height<300) return false;
      return bg!=='rgba(0, 0, 0, 0)' && isAccent(bg);});
    function isAccent(c){const m=c.match(/\d+/g); if(!m)return false;const [r,g,bl,a]=m.map(Number);
      if(a!==undefined&&a<200&&m.length===4)return false;
      // accent hue: strongly non-gray
      const mx=Math.max(r,g,bl),mn=Math.min(r,g,bl); return (mx-mn)>40 && mx>60;}
    // GLASS
    const glass=all.filter(el=>{const bf=getComputedStyle(el).backdropFilter||getComputedStyle(el).webkitBackdropFilter; return bf&&bf!=='none';})
      .map(el=>({cls:String(el.className).slice(0,50),bf:getComputedStyle(el).backdropFilter}));
    // TAP TARGETS
    const inter=[...document.querySelectorAll('.screen button,.screen a,.screen [role=button],.screen input,.screen select')].filter(vis);
    const small=inter.map(el=>{const r=el.getBoundingClientRect();return {cls:String(el.className).slice(0,40),w:Math.round(r.width),h:Math.round(r.height)};})
      .filter(x=>x.h<44||x.w<44);
    // MOTION
    const anims=[];
    for(const el of all){const cs=getComputedStyle(el);
      if(cs.transitionDuration!=='0s') anims.push({d:cs.transitionDuration,f:cs.transitionTimingFunction});
      if(cs.animationName!=='none') anims.push({a:cs.animationName,d:cs.animationDuration,f:cs.animationTimingFunction});}
    // ICONS
    const svgs=[...document.querySelectorAll('.screen svg')].filter(vis).map(s=>{
      const cs=getComputedStyle(s); const r=s.getBoundingClientRect();
      const kids=[...s.querySelectorAll('*')];
      const sw=[...new Set(kids.map(k=>getComputedStyle(k).strokeWidth).concat([cs.strokeWidth]))];
      const filled=kids.some(k=>{const f=getComputedStyle(k).fill;return f&&f!=='none'&&f!=='rgb(0, 0, 0)';});
      return {vb:s.getAttribute('viewBox'),w:Math.round(r.width),h:Math.round(r.height),sw:sw.join(','),filled};});
    // scroll height
    const sc=document.querySelector('.screen');
    return {sizes,offscale:offscale.slice(0,20),radii,nonConcentric:nonConcentric.slice(0,15),cornerShape,
      spacings,offgrid:offgrid.slice(0,20),accent,accentFills:accentFills.map(el=>({cls:String(el.className).slice(0,45),bg:getComputedStyle(el).backgroundColor,w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)})),
      glass,small,animCount:anims.length,anims:anims.slice(0,25),svgCount:svgs.length,svgs:svgs.slice(0,40),
      docH:document.documentElement.scrollHeight, imgs:[...document.querySelectorAll('.screen img')].length};
  });
}
fs.writeFileSync('/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/measure.json',JSON.stringify(out,null,1));
await b.close();
console.log('ok');
