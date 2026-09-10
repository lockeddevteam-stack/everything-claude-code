import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html'));
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f); await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const sc=document.querySelector('.body,#body,.screen__body,.screen');
    const kids=[...sc.children].filter(e=>e.getBoundingClientRect().height>0);
    const gaps=[]; for(let i=1;i<kids.length;i++){
      const a=kids[i-1].getBoundingClientRect(),c=kids[i].getBoundingClientRect();
      gaps.push({g:Math.round(c.top-a.bottom),cls:String(kids[i].className).slice(0,28)});}
    // icons
    const svgs=[...document.querySelectorAll('.screen svg')].filter(s=>s.getBoundingClientRect().width>0);
    const sizes={},strokes={},vbs={};
    for(const s of svgs){const rc=s.getBoundingClientRect();
      sizes[`${Math.round(rc.width)}x${Math.round(rc.height)}`]=(sizes[`${Math.round(rc.width)}x${Math.round(rc.height)}`]||0)+1;
      vbs[s.getAttribute('viewBox')]=(vbs[s.getAttribute('viewBox')]||0)+1;
      const kids=[...s.querySelectorAll('path,circle,rect,line,polyline')];
      for(const k of kids){const cs=getComputedStyle(k);
        const key=cs.stroke!=='none'?('stroke '+cs.strokeWidth+' cap '+cs.strokeLinecap):'filled';
        strokes[key]=(strokes[key]||0)+1;}}
    // emoji in text
    const emoji=[...document.querySelectorAll('.screen *')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(n.textContent))).map(e=>e.textContent.trim().slice(0,20));
    // dashed borders
    const dashed=[...document.querySelectorAll('.screen *')].filter(e=>getComputedStyle(e).borderTopStyle==='dashed'||getComputedStyle(e).borderStyle==='dashed').length;
    return {gaps,sizes,vbs,strokes,emoji:[...new Set(emoji)].slice(0,8),dashed};
  });
  console.log('==',f);
  console.log('  gaps:',JSON.stringify(r.gaps));
  console.log('  iconSizes:',JSON.stringify(r.sizes),' viewBoxes:',JSON.stringify(r.vbs));
  console.log('  strokes:',JSON.stringify(r.strokes));
  console.log('  emoji:',JSON.stringify(r.emoji),' dashed:',r.dashed);
}
await b.close();
