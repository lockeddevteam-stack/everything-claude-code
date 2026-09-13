import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const init=()=>{try{localStorage.setItem('lk_cycle','true');localStorage.setItem('lk_mcProfile',JSON.stringify({setup:false,goal:null,lastStart:null,cycleLen:28,periodLen:5,irregular:false,birthControl:'none',discreet:false,createdAt:'2026-09-09'}));localStorage.setItem('lk_mcDays','{}');}catch(e){}};
const {b,p,errs}=await open(DEMO+'#/home/cycle',init);
await p.waitForTimeout(1500);
const CS=async()=>T(await p.locator('[data-testid="cycle-scroll"]').innerText());
for(let i=0;i<8;i++){
  console.log('\n--- step '+i+' ids:',(await IDS(p)).filter(x=>/^su-/.test(x)).join(','));
  console.log(T(await p.locator('[data-testid="cycle-scroll"]').innerText()).slice(0,700));
  const nxt=p.locator('[data-testid="su-next"]');
  if(!await nxt.count())break;
  // pick first option if any
  const opts=(await IDS(p)).filter(x=>/^su-(goal|len|bc|opt)/.test(x));
  if(opts.length){await p.click('[data-testid="'+opts[0]+'"]');await p.waitForTimeout(250);}
  await nxt.click(); await p.waitForTimeout(600);
}
console.log('\nFINAL:',(await CS()).slice(0,600));
console.log('ERRS',errs);
await b.close();
