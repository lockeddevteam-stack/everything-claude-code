import {chromium} from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,160));});
await p.goto(U);await p.waitForTimeout(1500);
console.log('tab testids per screen:');
console.log(await p.evaluate(()=>[...document.querySelectorAll('[data-screen]')].map(h=>{
  const sr=h.shadowRoot;if(!sr)return h.dataset.screen+': NO SHADOW';
  const t=[...sr.querySelectorAll('.tabbar [data-testid]')].map(e=>e.dataset.testid);
  return h.dataset.screen+': '+(t.join(',')||'(no tabbar)');}).join('\n')));
console.log('\nnav to #/progress:');
await p.goto(U+'#/progress');await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{const h=document.querySelector('[data-screen="progress"]');
  const cs=getComputedStyle(h);const r=h.getBoundingClientRect();
  return {hash:location.hash,display:cs.display,vis:cs.visibility,rect:{w:r.width,h:r.height},
    booted:!!h.shadowRoot, inner:h.shadowRoot?h.shadowRoot.innerHTML.length:0,
    visibleHosts:[...document.querySelectorAll('[data-screen]')].filter(x=>x.getBoundingClientRect().height>0).map(x=>x.dataset.screen)};}));
console.log('\ndemo index entries:');
console.log(await p.evaluate(()=>{const b=document.getElementById('demo-index-open')||document.querySelector('[data-testid="demo-index"]');return b?b.outerHTML.slice(0,200):'none';}));
const idx=await p.evaluate(()=>[...document.querySelectorAll('.demo-btn')].map(e=>e.id+'/'+e.textContent.trim()));
console.log(idx.join(' | '));
console.log('\nbody map search across all shadow roots:');
console.log(await p.evaluate(()=>[...document.querySelectorAll('[data-screen]')].map(h=>{
  const sr=h.shadowRoot;if(!sr)return null;
  const svg=sr.querySelectorAll('svg.bodymap, [data-testid*="body"], [class*="bodymap"], [class*="body-map"]');
  const bigsvg=[...sr.querySelectorAll('svg')].filter(s=>s.querySelectorAll('path').length>4);
  if(!svg.length&&!bigsvg.length)return null;
  return h.dataset.screen+' :: matched='+svg.length+' bigsvg='+bigsvg.length+' ids='+[...svg].map(x=>x.dataset.testid||x.className.baseVal||x.className).join(',');
}).filter(Boolean).join('\n')));
console.log('ERR',JSON.stringify(errs.slice(0,10)));
await b.close();
