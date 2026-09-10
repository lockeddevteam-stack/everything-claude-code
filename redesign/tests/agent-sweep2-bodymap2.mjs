import {chromium} from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const S='file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html';
const b=await chromium.launch();
const L=console.log;
async function run(where){
  const ctx=await b.newContext({viewport:{width:393,height:852}});
  const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,200));});
  const inDemo=where==='demo';
  await p.goto(inDemo?U+'#/train/exercise-library':S);await p.waitForTimeout(inDemo?1600:900);
  const R=fn=>p.evaluate(([f,d])=>{const root=d?document.querySelector('[data-screen="exercise-library"]').shadowRoot:document;
    return eval('('+f+')')(root);},[fn.toString(),inDemo]);
  // force map view
  await R(root=>{const br=root.querySelector('[data-action="browse"]');
    if(br&&br.getAttribute('data-browse')!=='map')br.click();else if(br&&br.getAttribute('data-browse')==='list'){}
  });
  await p.waitForTimeout(800);
  let s=await R(root=>{const lm=root.querySelector('#libmap');const m=root.querySelector('#map');
    const r=m?m.getBoundingClientRect():null;const svg=m&&m.querySelector('svg');
    return {browseAttr:root.querySelector('[data-action="browse"]')?.getAttribute('data-browse'),
      libmapHidden:lm?lm.hidden:'none',w:r?Math.round(r.width):0,h:r?Math.round(r.height):0,
      svgH:svg?Math.round(svg.getBoundingClientRect().height):0,groups:m?m.querySelectorAll('.mg[data-g]').length:0,
      count:root.querySelector('#libmap-count')?.textContent,
      frontSel:root.querySelector('#tab-front')?.getAttribute('aria-selected'),
      backSel:root.querySelector('#tab-back')?.getAttribute('aria-selected')};});
  L(where,'map state:',JSON.stringify(s));
  if(s.libmapHidden===true){await R(root=>{root.querySelector('[data-action="browse"]').click();});await p.waitForTimeout(800);
    s=await R(root=>{const lm=root.querySelector('#libmap');const m=root.querySelector('#map');const r=m.getBoundingClientRect();
      return {libmapHidden:lm.hidden,w:Math.round(r.width),h:Math.round(r.height),groups:m.querySelectorAll('.mg[data-g]').length,
        frontSel:root.querySelector('#tab-front')?.getAttribute('aria-selected'),backSel:root.querySelector('#tab-back')?.getAttribute('aria-selected')};});
    L(where,'after 2nd toggle:',JSON.stringify(s));}
  // Back view toggle
  await R(root=>{root.querySelector('#tab-back')?.click();});await p.waitForTimeout(700);
  L(where,'after tab-back:',JSON.stringify(await R(root=>({front:root.querySelector('#tab-front')?.getAttribute('aria-selected'),
    back:root.querySelector('#tab-back')?.getAttribute('aria-selected'),
    visibleFig:[...root.querySelectorAll('#map svg')].map(s=>s.getAttribute('data-view')||s.style.display||'').join(','),
    libmapHidden:root.querySelector('#libmap').hidden}))));
  await R(root=>{root.querySelector('#tab-front')?.click();});await p.waitForTimeout(600);
  L(where,'after tab-front:',JSON.stringify(await R(root=>({front:root.querySelector('#tab-front')?.getAttribute('aria-selected'),back:root.querySelector('#tab-back')?.getAttribute('aria-selected')}))));
  // group click
  L(where,'group click ->',await R(root=>{const el=root.querySelector('#map .mg[data-g]');if(!el)return 'none';
    el.dispatchEvent(new MouseEvent('click',{bubbles:true}));return el.getAttribute('data-g');}));
  await p.waitForTimeout(800);
  L(where,'header:',await R(root=>root.querySelector('.hdr__title')?.textContent.trim().slice(0,60)));
  L(where,'ERR',JSON.stringify(errs.slice(0,6)));
  await ctx.close();
}
await run('standalone');
await run('demo');
await b.close();
