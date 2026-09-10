import { chromium } from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
p.on('console',m=>{if(['error','warning'].includes(m.type()))console.log('CONSOLE',m.type(),m.text());});
await p.goto(U);await p.waitForTimeout(500);
const toggle=p.locator('[data-action="browse"]');
console.log('browse toggle count',await toggle.count());
await toggle.first().click();await p.waitForTimeout(600);
console.log('libmap hidden?',await p.evaluate(()=>document.getElementById('libmap').hidden));
const st=()=>p.evaluate(()=>({f:document.getElementById('tab-front').getAttribute('aria-selected'),
  b:document.getElementById('tab-back').getAttribute('aria-selected'),
  view:document.querySelector('#map svg')?.getAttribute('data-view')||null,
  regions:document.querySelectorAll('#map [data-gid],#map [data-group]').length,
  mapHTML:(document.getElementById('map').innerHTML.length)}));
console.log('map state',JSON.stringify(await st()));
await p.locator('#tab-back').click();await p.waitForTimeout(500);
console.log('after Back',JSON.stringify(await st()));
await p.locator('#tab-front').click();await p.waitForTimeout(500);
console.log('after Front',JSON.stringify(await st()));
// click a muscle
const regions=await p.$$eval('#map [data-gid],#map [data-group],#map [role=button]',e=>e.slice(0,5).map(x=>x.getAttribute('data-gid')||x.getAttribute('data-group')||x.getAttribute('aria-label')));
console.log('regions sample',regions);
await b.close();
