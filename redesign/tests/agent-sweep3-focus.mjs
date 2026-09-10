/* Focus after a control removes or disables itself. */
import {browser,page,DIR,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const ae=()=>p.evaluate(()=>{const a=document.activeElement;
  if(!a)return 'null';
  return a.tagName+'#'+(a.dataset?.testid||a.id||'')+(a===document.body?' (BODY)':'')+
    ' vis='+(a.getBoundingClientRect().height>0);});
const run=async(file,state,id,note)=>{
  await p.goto(DIR+file);await p.waitForTimeout(550);
  if(state){const st=await states(p);const m=st.find(x=>x.label.indexOf(state)===0)||st.find(x=>x.id===state);
    if(m)await setState(p,m.id);else return L('  ?? no state',state,'on',file);}
  await p.waitForTimeout(400);
  const has=await p.evaluate(x=>!!document.querySelector('[data-testid="'+x+'"]'),id);
  if(!has)return L('  --',file,state,id,'not present');
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').focus(),id);
  const before=await ae();
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').click(),id);
  await p.waitForTimeout(500);
  const gone=!(await p.evaluate(x=>!!document.querySelector('[data-testid="'+x+'"]'),id));
  const after=await ae();
  L('  ',file,'/',state||'-','/',id,'removed='+gone,'focus',before,'->',after, note||'');
};
L('=== controls that remove themselves');
await run('split-builder.html','Manual · populated','ex-remove-x17');
await run('split-builder.html','Manual · populated','ex-remove-x18');
await run('split-builder.html','Manual · edit mode','ex-remove-x17');
await run('split-builder.html','Manual · edit mode','day-remove-d16');
await run('shopping.html','Populated','clear-done');
await run('fuel.html','Populated','meal-0');
L('=== fuel: delete from inside the sheet (the control and its sheet both go)');
await p.goto(DIR+'fuel.html');await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelector('[data-testid="meal-0"]').click());await p.waitForTimeout(500);
await p.evaluate(()=>document.querySelector('[data-testid="meal-delete"]').focus());
L('  before',await ae());
await p.evaluate(()=>document.querySelector('[data-testid="meal-delete"]').click());await p.waitForTimeout(600);
L('  after delete',await ae());
await p.evaluate(()=>document.querySelector('[data-testid="undo"]').focus());
await p.evaluate(()=>document.querySelector('[data-testid="undo"]').click());await p.waitForTimeout(600);
L('  after undo',await ae());
L('=== progress: writes that close their sheet');
for(const [id,pre] of [['weight-log','row-body-weight'],['rec-save','log-record']]){
  await p.goto(DIR+'progress.html');await p.waitForTimeout(600);
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').click(),pre);await p.waitForTimeout(500);
  if(id==='rec-save')await p.fill('#rec-kg','120');
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').focus(),id);
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').click(),id);await p.waitForTimeout(600);
  L('  progress',id,'-> focus',await ae());
}
L('=== toast dismiss / Done buttons');
await p.goto(DIR+'progress.html');await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelector('[data-testid="row-body-weight"]').click());await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('[data-testid="weight-log"]').click());await p.waitForTimeout(600);
const tb=await p.evaluate(()=>{const t=document.querySelector('.toast');return t?[...t.querySelectorAll('button')].map(e=>e.dataset.testid+':'+e.textContent.trim()):null;});
L('  toast buttons',tb);
if(tb&&tb.length){await p.evaluate(()=>{const t=document.querySelector('.toast button');t.focus();t.click();});await p.waitForTimeout(500);
  L('  after toast dismiss focus',await ae());}
L('=== settings switches (disable themselves?)');
await p.goto(DIR+'settings.html');await p.waitForTimeout(600);
for(const id of ['switch-partial-reps','sync-now','retry-account']){
  const ok=await p.evaluate(x=>{const e=document.querySelector('[data-testid="'+x+'"]');if(!e)return false;e.focus();e.click();return true;},id);
  await p.waitForTimeout(500);
  if(ok)L('  settings',id,'-> focus',await ae());
}
L('ERRS',p.__errs);
await b.close();
