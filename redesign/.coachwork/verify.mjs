import { chromium } from '/home/user/everything-claude-code/redesign/tests/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const axe = fs.readFileSync('/home/user/everything-claude-code/redesign/tests/node_modules/axe-core/axe.min.js','utf8');
const URLB='http://127.0.0.1:4173/08-build/coach.html';
const N = Number(process.argv[2]||17);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const page = await ctx.newPage();
const errs=[];
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e=>errs.push('pageerror: '+e.message));
for(let i=0;i<N;i++){
  await page.goto(URLB+'?preset='+i, {waitUntil:'load'});
  await page.waitForTimeout(250);
  const name = await page.evaluate(i=>document.querySelector(`[data-testid="dev-preset-${i}"]`).textContent, i);
  await page.addScriptTag({content: axe});
  const v = await page.evaluate(async ()=>{
    const r = await window.axe.run(document, {resultTypes:['violations']});
    return r.violations.map(x=>x.id+':'+x.nodes.map(nn=>nn.target.join('')).join('|'));
  });
  const m = await page.evaluate(()=>{
    const small=[];
    document.querySelectorAll('button,a,input,textarea,select,[role="button"],[role="tab"],[role="checkbox"],[role="radio"]').forEach(el=>{
      if(el.closest('.dev')) return;
      const r=el.getBoundingClientRect();
      if(r.width===0&&r.height===0) return;
      if(r.width<44||r.height<44) small.push((el.getAttribute('data-testid')||el.className)+' '+Math.round(r.width)+'x'+Math.round(r.height));
    });
    const acc=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#','');
    const rgb=`rgb(${parseInt(acc.slice(0,2),16)}, ${parseInt(acc.slice(2,4),16)}, ${parseInt(acc.slice(4,6),16)})`;
    const fills=[];
    document.querySelectorAll('.phone *').forEach(el=>{
      if(getComputedStyle(el).backgroundColor===rgb){const r=el.getBoundingClientRect(); if(r.width>2&&r.height>2) fills.push(el.getAttribute('data-testid')||el.className);}
    });
    const hdr=document.querySelector('header').getBoundingClientRect().height;
    const body=document.querySelector('.body');
    const sc=document.scrollingElement;
    const wide=[...document.querySelectorAll('.phone *')].filter(el=>el.getBoundingClientRect().right>393.5).map(el=>el.getAttribute('data-testid')||el.className).slice(0,5);
    return {small,fills,hdr,hDoc:sc.scrollWidth>sc.clientWidth,hBody:body?body.scrollWidth>body.clientWidth+1:false,wide};
  });
  console.log(String(i).padStart(2), name.padEnd(22), 'axe=['+v.join(',')+']', 'small='+JSON.stringify(m.small), 'accent='+JSON.stringify(m.fills), 'hdr='+m.hdr, 'hoverflow='+(m.hDoc||m.hBody), m.wide.length?'WIDE='+m.wide:'');
}
console.log('CONSOLE ERRORS:', JSON.stringify(errs));
await b.close();
