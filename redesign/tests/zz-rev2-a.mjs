import { chromium } from 'playwright';
const DEMO='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERR',m.text());});
await p.goto(DEMO+'#/home/progress');await p.waitForTimeout(900);
console.log('url now:', p.url());
// switch progress to its empty state via its dev menu, inside the shadow root
const r = await p.evaluate(()=>{
  const host=[...document.querySelectorAll('*')].find(e=>e.shadowRoot&&e.shadowRoot.querySelector('[data-testid="empty-action"], .dev__item'));
  return !!host;
});
console.log('found host with dev items:', r);
const info = await p.evaluate(()=>{
  const hosts=[...document.querySelectorAll('*')].filter(e=>e.shadowRoot);
  return hosts.map(h=>({id:h.id||h.className, items:[...h.shadowRoot.querySelectorAll('.dev__item')].map(b=>b.dataset.state||b.textContent.trim())}));
});
console.log(JSON.stringify(info).slice(0,1200));
await b.close();
