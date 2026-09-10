import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html')).sort();
const b=await chromium.launch();
for(const theme of ['dark','light']){
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage(); let tot=0,fail=[];
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f); await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{
    const px=c=>{const m=c.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,1]};
    const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
    const L=c=>0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);
    const bgOf=e=>{let n=e;while(n&&n!==document.documentElement){const c=px(getComputedStyle(n).backgroundColor);if(c.length<4||c[3]>0.9)return c;n=n.parentElement;}return px(getComputedStyle(document.body).backgroundColor);};
    const out=[];
    for(const e of document.querySelectorAll('*')){
      const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
      if(!r.width||!r.height||s.visibility==='hidden'||s.display==='none'||+s.opacity<0.5) continue;
      if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) continue;
      const fg=px(s.color), bg=bgOf(e);
      const a=fg[3]!==undefined&&fg[3]<1?fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3])):fg.slice(0,3);
      const l1=L(a),l2=L(bg), cr=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
      const fs=parseFloat(s.fontSize), bold=parseInt(s.fontWeight)>=700;
      const need=(fs>=24||(fs>=18.66&&bold))?3:4.5;
      out.push({ok:cr>=need,cr:+cr.toFixed(2),need,fs:+fs.toFixed(1),t:e.textContent.trim().slice(0,26),cls:e.className.toString().slice(0,26)});
    }
    return out;});
  tot+=r.length; r.filter(x=>!x.ok).forEach(x=>fail.push(f+' '+JSON.stringify(x)));
}
console.log(theme,'nodes',tot,'fails',fail.length); fail.slice(0,25).forEach(x=>console.log('  ',x));
await ctx.close();}
await b.close();
