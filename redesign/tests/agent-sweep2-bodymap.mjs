import {chromium} from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const S='file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,200));});
const L=console.log;
const probe=root=>({
  hidden:root.getElementById?root.getElementById('libmap')?.hidden:root.querySelector('#libmap')?.hidden,
});
L('=== standalone');
await p.goto(S);await p.waitForTimeout(900);
await p.locator('[data-action="browse"]').click();await p.waitForTimeout(1000);
L(await p.evaluate(()=>{const m=document.getElementById('map');const lm=document.getElementById('libmap');
 const svg=m.querySelector('svg');const r=m.getBoundingClientRect();
 return {libmapHidden:lm.hidden,mapW:Math.round(r.width),mapH:Math.round(r.height),
   svg:!!svg,paths:m.querySelectorAll('path').length,groups:m.querySelectorAll('.mg[data-g]').length,
   count:document.getElementById('libmap-count')?.textContent,
   svgBox:svg?svg.getBoundingClientRect().height:0};}));
// click a muscle group
const g=await p.evaluate(()=>{const el=document.querySelector('#map .mg[data-g]');if(!el)return 'none';
 const r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
 el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
 return el.getAttribute('data-g')+' @'+Math.round(r.width)+'x'+Math.round(r.height);});
await p.waitForTimeout(700);
L('clicked group:',g,'-> header now:',await p.evaluate(()=>document.querySelector('.hdr__title')?.textContent.trim().slice(0,60)));
L('front/back toggle:',await p.evaluate(()=>{const b=document.getElementById('tab-back');if(!b)return 'no tab-back';b.click();return 'clicked';}));
await p.waitForTimeout(600);
L('after back:',await p.evaluate(()=>({sel:document.getElementById('tab-back')?.getAttribute('aria-selected'),paths:document.querySelectorAll('#map path').length})));

L('\n=== in demo');
await p.goto(U+'#/train/exercise-library');await p.waitForTimeout(1600);
L(await p.evaluate(()=>{const sr=document.querySelector('[data-screen="exercise-library"]').shadowRoot;
 const br=sr.querySelector('[data-action="browse"]');if(!br)return 'no browse control';br.click();return 'clicked browse';}));
await p.waitForTimeout(1200);
L(await p.evaluate(()=>{const sr=document.querySelector('[data-screen="exercise-library"]').shadowRoot;
 const m=sr.getElementById?sr.getElementById('map'):sr.querySelector('#map');
 const lm=sr.querySelector('#libmap');const r=m?m.getBoundingClientRect():null;
 return {libmapHidden:lm?lm.hidden:'no-libmap',mapW:r?Math.round(r.width):0,mapH:r?Math.round(r.height):0,
  svg:m?!!m.querySelector('svg'):false,paths:m?m.querySelectorAll('path').length:0,
  groups:m?m.querySelectorAll('.mg[data-g]').length:0,
  count:sr.querySelector('#libmap-count')?.textContent};}));
L('demo group click:',await p.evaluate(()=>{const sr=document.querySelector('[data-screen="exercise-library"]').shadowRoot;
 const el=sr.querySelector('#map .mg[data-g]');if(!el)return 'none';
 el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
 el.dispatchEvent(new MouseEvent('click',{bubbles:true}));return el.getAttribute('data-g');}));
await p.waitForTimeout(800);
L('demo header:',await p.evaluate(()=>document.querySelector('[data-screen="exercise-library"]').shadowRoot.querySelector('.hdr__title')?.textContent.trim().slice(0,60)));
L('ERR',JSON.stringify(errs.slice(0,8)));
await b.close();
