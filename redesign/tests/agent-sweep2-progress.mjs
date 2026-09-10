import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,160));});
const L=console.log;
await p.goto(D+'progress.html');await p.waitForTimeout(700);
const ranges=await p.evaluate(()=>[...document.querySelectorAll('[data-action="range"]')].map(e=>e.dataset.testid+'/'+e.dataset.range+'/'+e.getAttribute('aria-pressed')));
L('ranges:',ranges.join(', '));
for(const r of ranges){const t=r.split('/')[0];
  await p.evaluate(x=>document.querySelector(`[data-testid="${x}"]`)?.click(),t);await p.waitForTimeout(450);
  const s=await p.evaluate(()=>{const c=document.querySelector('[data-testid="card-trend"]');
    const txt=document.body.innerText;
    const bad=txt.match(/NaN|Infinity|undefined|null/g);
    const poly=document.querySelector('.chart__line');
    return {trend:c?c.textContent.replace(/\s+/g,' ').trim().slice(0,120):'no card',
      bad:bad?[...new Set(bad)]:null, points:poly?(poly.getAttribute('points')||'').slice(0,60):'no chart',
      pointCount:poly?(poly.getAttribute('points')||'').trim().split(/\s+/).filter(Boolean).length:0};});
  L(' ',t,JSON.stringify(s));}
L('\nlifts:');
await p.evaluate(()=>document.querySelector('[data-testid="choose-lift"]').click());await p.waitForTimeout(600);
const lifts=await p.evaluate(()=>[...document.querySelectorAll('[data-action="pick-lift"]')].map(e=>e.dataset.testid+'|'+e.textContent.replace(/\s+/g,' ').trim().slice(0,50)));
L(lifts.join('\n'));
// pick each lift then cycle ranges looking for empty-range breakage
for(const l of lifts.slice(0,20)){
  const t=l.split('|')[0];
  await p.evaluate(()=>{const c=document.querySelector('[data-testid="choose-lift"]');if(c&&!document.querySelector('.sheet'))c.click();});
  await p.waitForTimeout(400);
  await p.evaluate(x=>document.querySelector(`[data-testid="${x}"]`)?.click(),t);await p.waitForTimeout(450);
  for(const r of ranges){const rt=r.split('/')[0];
    await p.evaluate(x=>document.querySelector(`[data-testid="${x}"]`)?.click(),rt);await p.waitForTimeout(280);
    const s=await p.evaluate(()=>{const txt=document.body.innerText;
      const bad=txt.match(/NaN|Infinity|\bundefined\b|\bnull\b/g);
      const poly=document.querySelector('.chart__line');
      const pts=poly?(poly.getAttribute('points')||''):'';
      return {bad:bad?[...new Set(bad)]:null,pts:pts.length<3?JSON.stringify(pts):null,
        badpt:/NaN|Infinity/.test(pts)?pts.slice(0,60):null,
        trend:document.querySelector('[data-testid="card-trend"]')?.textContent.replace(/\s+/g,' ').trim().slice(0,90)};});
    if(s.bad||s.pts!==null||s.badpt)L('  !!',t,rt,JSON.stringify(s));}
}
L('\nthree sheets:');
for(const [op,cl] of [['choose-lift','sheet-close'],['row-body-weight','weight-close'],['open-goals','goals-close'],['log-record','record-close']]){
  await p.goto(D+'progress.html');await p.waitForTimeout(600);
  const has=await p.evaluate(t=>!!document.querySelector(`[data-testid="${t}"]`),op);
  if(!has){L(' ',op,'ABSENT');continue;}
  await p.evaluate(t=>document.querySelector(`[data-testid="${t}"]`).click(),op);await p.waitForTimeout(600);
  const info=await p.evaluate(()=>{const s=document.querySelector('.sheet');if(!s)return null;
    const foot=s.querySelector('.sheet__foot .btn');const fr=foot&&foot.getBoundingClientRect();
    return {tid:s.dataset.testid,h:s.style.height,foot:foot?{tid:foot.dataset.testid,txt:foot.textContent.trim(),
      inView:fr.bottom<=innerHeight}:null};});
  L(' ',op,'->',JSON.stringify(info));
  if(info&&info.foot){const before=await p.evaluate(()=>document.body.innerHTML.length);
    await p.evaluate(t=>document.querySelector(`[data-testid="${t}"]`).click(),info.foot.tid);await p.waitForTimeout(500);
    const after=await p.evaluate(()=>({len:document.body.innerHTML.length,sheet:!!document.querySelector('.sheet'),
      toast:document.querySelector('[role="status"],.toast')?.textContent||null}));
    L('    primary "'+info.foot.txt+'" -> sheet closed:',!after.sheet,'toast:',after.toast,'docDelta:',after.len-before);}
  // escape
  await p.evaluate(t=>document.querySelector(`[data-testid="${t}"]`)?.click(),op);await p.waitForTimeout(500);
  await p.keyboard.press('Escape');await p.waitForTimeout(400);
  L('    esc closes:',!(await p.evaluate(()=>!!document.querySelector('.sheet'))),
    'focus:',await p.evaluate(()=>document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||'')));
}
L('ERRS',JSON.stringify(errs));
await b.close();
