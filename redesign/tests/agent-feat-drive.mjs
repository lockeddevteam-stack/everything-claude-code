/* Stable-selector action drive. Elements are addressed by
   [data-action="X"][data-testid="Y"] plus an occurrence index, which survives
   a reload, so every click is verified from a fresh, known state. */
import { chromium } from '@playwright/test';
import fs from 'fs';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2);

function snapFn() {
  const ls={}; try{ for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); ls[k]=localStorage.getItem(k);} }catch(e){}
  const h=document.documentElement.innerHTML; let x=0;
  for(let i=0;i<h.length;i++){x=((x<<5)-x+h.charCodeAt(i))|0;}
  return {len:h.length,hash:x,url:location.href,ls:JSON.stringify(ls)};
}
function listFn(){
  const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled&&e.getAttribute('aria-disabled')!=='true';};
  const seen={}, out=[];
  Array.from(document.querySelectorAll('[data-action],[data-act]')).filter(vis).forEach(e=>{
    const act=e.getAttribute('data-action')||e.getAttribute('data-act');
    const tid=e.getAttribute('data-testid');
    const attr=e.hasAttribute('data-action')?'data-action':'data-act';
    const sel='['+attr+'="'+act+'"]'+(tid?'[data-testid="'+CSS.escape(tid).replace(/\\/g,'')+'"]':'');
    seen[sel]=(seen[sel]||0); out.push({act,tid:tid||'',sel,n:seen[sel],tag:e.tagName});
    seen[sel]++;
  });
  return out;
}
function clickSel(o){
  const els=Array.from(document.querySelectorAll(o.sel)).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled&&e.getAttribute('aria-disabled')!=='true';});
  if(!els[o.n]) return false; els[o.n].click(); return true;
}
function statesFn(){return Array.from(document.querySelectorAll('.dev__item')).map(b=>b.dataset.state);}

const browser=await chromium.launch();
const out={};
for(const s of screens){
  const src=fs.readFileSync(BUILD+'/'+s,'utf8');
  const declared=[...new Set([...src.matchAll(/data-act(?:ion)?="([^"]+)"/g)].map(m=>m[1]))].filter(a=>!a.includes('+')&&!a.includes("'"));
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  const base='file://'+BUILD+'/'+s;
  await page.goto(base); await page.waitForTimeout(300);
  const states=await page.evaluate(statesFn);
  const panels=/VIEWS *= *\{[\s\S]{0,80}list: *panelList/.test(src)?['list','pantry','stores','budget']:[];
  const entries=[];
  for(const st of (states.length?states:[''])) for(const pn of (panels.length?panels:[''])){
    entries.push(base+((st||pn)?'?':'')+[st?'state='+st:'',pn?'panel='+pn:''].filter(Boolean).join('&'));
  }
  const res={};
  const note=(act,tid,tag,changed)=>{res[act]=res[act]||{ok:[],dead:[]};const k=(tid||'('+tag.toLowerCase()+')');
    const b=changed?res[act].ok:res[act].dead; if(!b.includes(k)) b.push(k);};

  for(const url of entries){
    await page.goto(url); await page.waitForTimeout(280);
    const top=await page.evaluate(listFn);
    for(const it of top){
      await page.goto(url); await page.waitForTimeout(260);
      const b=await page.evaluate(snapFn);
      if(!await page.evaluate(clickSel,it)) continue;
      await page.waitForTimeout(330);
      const a=await page.evaluate(snapFn);
      const ch=b.hash!==a.hash||b.url!==a.url||b.ls!==a.ls;
      note(it.act,it.tid,it.tag,ch);
      if(ch){
        const inner=await page.evaluate(listFn);
        const fresh=inner.filter(x=>!top.some(t=>t.sel===x.sel&&t.n===x.n));
        for(const jt of fresh){
          await page.goto(url); await page.waitForTimeout(250);
          await page.evaluate(clickSel,it); await page.waitForTimeout(300);
          const b2=await page.evaluate(snapFn);
          if(!await page.evaluate(clickSel,jt)) continue;
          await page.waitForTimeout(330);
          const a2=await page.evaluate(snapFn);
          note(jt.act,jt.tid,jt.tag,b2.hash!==a2.hash||b2.url!==a2.url||b2.ls!==a2.ls);
        }
      }
    }
  }
  out[s]={res,declared,errs:[...new Set(errs)],entries:entries.length};
  let txt='== '+s+'  ('+entries.length+' entry urls)\n';
  for(const a of declared){
    const r=res[a];
    if(!r){txt+='  NEVER-REACHED  '+a+'\n';continue;}
    if(!r.ok.length) txt+='  DEAD           '+a+'   '+r.dead.join(', ')+'\n';
    else if(r.dead.length) txt+='  PARTIAL        '+a+'   inert: '+r.dead.join(', ')+'\n';
  }
  if(errs.length) txt+='  pageerrors: '+JSON.stringify([...new Set(errs)].slice(0,3))+'\n';
  console.log(txt);
  await page.close();
}
fs.writeFileSync('/tmp/drive2-'+screens.join('_').replace(/[^a-z]/g,'')+'.json',JSON.stringify(out,null,1));
await browser.close();
