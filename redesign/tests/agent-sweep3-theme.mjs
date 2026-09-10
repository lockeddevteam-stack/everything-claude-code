import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const L=console.log;
for(const pref of ['light','dark','system']){
 for(const devScheme of ['light','dark']){
  if(pref!=='system'&&devScheme==='dark')continue;
  const c=await b.newContext({viewport:{width:393,height:852},colorScheme:devScheme});
  await c.addInitScript(v=>{try{localStorage.setItem('lk_theme',v);}catch(e){}},pref);
  const p=await c.newPage();p.__errs=[];
  p.on('pageerror',e=>p.__errs.push('PE '+e.message));
  p.on('console',m=>{if(m.type()==='error')p.__errs.push('C '+m.text().slice(0,150));});
  L('=== pref',pref,'device',devScheme);
  let bad=0;
  for(const s of SCREENS){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
    const t=await p.evaluate(()=>({attr:document.documentElement.getAttribute('data-theme'),
      bg:getComputedStyle(document.body).backgroundColor,
      tab:document.querySelector('.tabbar')?getComputedStyle(document.querySelector('.tabbar')).backgroundColor:null,
      hdr:document.querySelector('.hdr')?getComputedStyle(document.querySelector('.hdr')).backgroundColor:null,
      txt:getComputedStyle(document.body).color}));
    L(' ',s,JSON.stringify(t));
    const st=await states(p);const list=st.length?st.map(x=>x.id):[null];
    for(const sid of list){p.__errs.length=0;if(sid)await setState(p,sid);await p.waitForTimeout(220);
      if(p.__errs.length){bad++;L('   ERR',sid,p.__errs.slice(0));}}
  }
  L('  errors:',bad);
  await c.close();
 }
}
L('=== settings theme row writes and repaints');
const p2=await page(b);
await p2.goto(DIR+'settings.html');await p2.waitForTimeout(600);
const row=await p2.evaluate(()=>{const e=[...document.querySelectorAll('[data-testid]')].find(x=>/theme|appearance/i.test(x.innerText||''));
  return e?e.dataset.testid+' | '+e.innerText.replace(/\s+/g,' '):'NONE';});
L('theme row:',row);
if(row!=='NONE'){
  const id=row.split(' | ')[0];
  await p2.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').click(),id);await p2.waitForTimeout(500);
  const opts=await p2.evaluate(()=>[...document.querySelectorAll('.sheet button,[role=dialog] button')].map(e=>e.dataset.testid+':'+e.textContent.trim()));
  L('options:',opts);
  const light=opts.find(o=>/Light/.test(o));
  if(light){await p2.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').click(),light.split(':')[0]);await p2.waitForTimeout(600);
    L('after choosing Light:',await p2.evaluate(()=>({attr:document.documentElement.getAttribute('data-theme'),
      ls:(()=>{try{return localStorage.getItem('lk_theme')}catch(e){return 'ERR'}})(),
      bg:getComputedStyle(document.body).backgroundColor,
      row:document.querySelector('[data-testid="'+arguments+'"]')?1:0})));
    await p2.reload();await p2.waitForTimeout(600);
    L('after reload:',await p2.evaluate(()=>({attr:document.documentElement.getAttribute('data-theme'),bg:getComputedStyle(document.body).backgroundColor})));
    L('does another screen follow?');
    await p2.goto(DIR+'train.html');await p2.waitForTimeout(500);
    L('  train:',await p2.evaluate(()=>({attr:document.documentElement.getAttribute('data-theme'),bg:getComputedStyle(document.body).backgroundColor,tab:getComputedStyle(document.querySelector('.tabbar')).backgroundColor})));
  }
}
L('ERRS',p2.__errs);
await b.close();
