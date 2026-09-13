import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const init=()=>{try{localStorage.setItem('lk_cycle','true');if(sessionStorage.getItem('zzseed'))return;sessionStorage.setItem('zzseed','1');localStorage.setItem('lk_mcProfile',JSON.stringify({setup:false,goal:null,lastStart:null,cycleLen:28,periodLen:5,irregular:false,birthControl:'none',discreet:false,createdAt:'2026-09-09'}));localStorage.setItem('lk_mcDays','{}');}catch(e){}};
const {b,p,errs}=await open(DEMO+'#/home/cycle',init);
await p.waitForTimeout(1500);
const S=async()=>T(await p.locator('[data-testid="cycle-scroll"]').innerText());
const L=async(t)=>{console.log('\n### '+t); console.log((await S()).slice(0,700)); console.log('ids:',(await IDS(p)).filter(x=>/^su-/.test(x)).join(','));};
await p.click('[data-testid="su-next"]'); await p.waitForTimeout(400);
await p.click('[data-testid="su-goal-train"]'); await p.click('[data-testid="su-next"]'); await p.waitForTimeout(400);
// future date first (validation)
await p.fill('[data-testid="su-start"]','2026-10-01'); await p.click('[data-testid="su-next"]'); await p.waitForTimeout(400);
await L('future date');
await p.fill('[data-testid="su-start"]','2026-08-29'); await p.click('[data-testid="su-next"]'); await p.waitForTimeout(500);
await L('after date');
for(let i=0;i<5;i++){
  const idl=(await IDS(p)).filter(x=>/^su-/.test(x));
  if(!idl.includes('su-next'))break;
  await p.click('[data-testid="su-next"]'); await p.waitForTimeout(500);
  await L('step '+i);
}
console.log('\nprofile:',await p.evaluate(()=>localStorage.getItem('lk_mcProfile')));
await p.reload(); await p.waitForTimeout(1600);
console.log('AFTER RELOAD:',(await S()).slice(0,400));
console.log('ERRS',errs);
await b.close();
