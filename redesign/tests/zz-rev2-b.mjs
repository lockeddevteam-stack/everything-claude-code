import { chromium } from 'playwright';
const DEMO='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto(DEMO+'#/home/progress');await p.waitForTimeout(900);
const before=p.url();
const res = await p.evaluate(()=>{
  const h=document.getElementById('demo-screen-progress');
  const items=[...h.shadowRoot.querySelectorAll('.dev__item')].map(b=>b.dataset.state);
  const t=h.shadowRoot.querySelector('[data-testid="dev-toggle"]');
  if(t) t.click();
  const empty=[...h.shadowRoot.querySelectorAll('.dev__item')].find(b=>b.dataset.state==='empty');
  if(empty) empty.click();
  const btn=h.shadowRoot.querySelector('[data-testid="empty-action"]');
  return {items, hasBtn: !!btn, label: btn&&btn.textContent.trim()};
});
console.log('progress dev states:',res.items,'empty-action present:',res.hasBtn,JSON.stringify(res.label));
if(res.hasBtn){
  await p.evaluate(()=>document.getElementById('demo-screen-progress').shadowRoot.querySelector('[data-testid="empty-action"]').click());
  await p.waitForTimeout(800);
  console.log('URL before:',before);
  console.log('URL after :',p.url());
  console.log('demo still alive?', await p.evaluate(()=>!!document.getElementById('demo-screens')));
}
await b.close();
