import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/profile.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
const T=t=>'[data-testid="'+t+'"]';
const snap=()=>p.evaluate(()=>({h:document.getElementById('screen').innerHTML,u:location.href}));
async function tryIt(state,tid,label){ await p.goto(U+'?state='+state); await p.waitForTimeout(350);
  const b=await snap(); const el=await p.$(T(tid)); if(!el){console.log(label.padEnd(40),'ABSENT');return;}
  await el.click(); await p.waitForTimeout(400); const a=await snap();
  console.log(label.padEnd(40), (b.h===a.h&&b.u===a.u)?'NO CHANGE (dead)':'changed'); }
await tryIt('populated','open-settings','populated: Settings row');
await tryIt('guest','signup','guest: Create an account');
await tryIt('new','start-first','new: Start a session');
await tryIt('error','retry','error: Try again');
await tryIt('error','open-settings','error: Open settings');
// tab bar
await p.goto(U); await p.waitForTimeout(350);
for(const t of ['tab-home','tab-train','tab-fuel','tab-coach']){ const b=await snap(); await p.click(T(t)); await p.waitForTimeout(350); const a=await snap();
  console.log(('tabbar '+t).padEnd(40), (b.h===a.h&&b.u===a.u)?'NO CHANGE (dead)':'changed'); await p.goto(U); await p.waitForTimeout(250); }
await br.close();
