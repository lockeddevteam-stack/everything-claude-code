/* DATA THAT SHOULD NOT EXIST, AND ONE DAY WILL.

   A key arrives in the wrong shape eventually: a sync that half-landed, a
   backup edited by hand, an older build's idea of the same field, a row
   imported from somewhere else. The app cannot fix those, but it must not
   die of them -- and it did. lk_history as a string took Train, Progress
   and Recap down together ("raw.forEach is not a function"), and each one
   stayed down for the life of that storage because Try again re-threw the
   same error. A set carrying a weight and no reps printed "NaN kg" as
   somebody's estimated one-rep max.

   The shape guard is in LKStore.get rather than in twenty readers: a key
   every reader iterates comes back iterable, or comes back as the
   caller's own fallback, which every caller already handles. That covers
   the readers not written yet.

   WHAT IS DELIBERATELY NOT GUARDED: any key a migration converts.
   lk_prs arrives as a map from the shipped app and migration 1 turns it
   into the flat array everything reads -- guarding it hid the map from
   the migration that exists to fix it, and the records were dropped
   rather than converted. The suite caught that within a minute. Same for
   lk_profile, lk_fuelLog, lk_customEx and lk_coachMemory, which are
   guarded at their readers instead.

   Each case opens every tab and fails on a thrown error, on the screen's
   own "could not start" card, or on undefined/NaN reaching the page. */
import path from 'node:path'; import http from 'node:http';
import { readFile } from 'node:fs/promises';
const ROOT='/home/user/everything-claude-code/redesign';
const { chromium } = await import(path.join(ROOT,'tests/node_modules/playwright/index.mjs'));
const F=path.join(ROOT,'10-final/locked-app.html');
const srv=http.createServer(async(q,r)=>{const p=new URL(q.url,'http://x').pathname;
 if(p==='/sw.js'){r.writeHead(404);r.end('');return;}
 r.writeHead(200,{'content-type':'text/html'});r.end(await readFile(F))});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const CASES=[
 ['history as a string', {lk_history:'"not an array"'}],
 ['profile as null',     {lk_profile:'null'}],
 ['splits as an object', {lk_splits:'{"oops":true}'}],
 ['history row with no exercises',
   {lk_history:JSON.stringify([{id:'x',name:'PPL - Push',date:'2026-09-07',kind:'lift',kg:100,min:10,sets:2}])}],
 ['a set with kg but no reps',
   {lk_history:JSON.stringify([{id:'x',name:'PPL - Push',date:'2026-09-07',kind:'lift',kg:100,min:10,sets:1,
     exercises:[{id:104,name:'Incline Machine Press',muscle:'Upper Chest',sets:[{kg:60,done:true}]}]}])}],
 ['prs as a string',     {lk_prs:'"broken"'}],
];
let bad=0;
for (const [label, extra] of CASES) {
  const br=await chromium.launch();
  const ctx=await br.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const seed=Object.assign({lk_onboarded:'true',lk_tutorialSeen:'true',
    lk_profile:JSON.stringify({username:'c',displayName:'c',useKg:true,weightKg:82,heightCm:180,age:31,sex:'male',goal:'maintain'})},extra);
  await ctx.addInitScript((d)=>{if(localStorage.getItem('lk_s'))return;localStorage.setItem('lk_s','1');
   Object.keys(d).forEach(k=>localStorage.setItem(k,d[k]))},seed);
  const page=await ctx.newPage(); const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.goto('http://127.0.0.1:'+srv.address().port+'/');
  try{await page.waitForFunction(()=>window.DEMO&&Object.keys(window.DEMO.screens).length>0,null,{timeout:9000});}catch(e){}
  await page.waitForTimeout(800);
  const holes=[];
  for (const r of ['home','train','fuel','progress','coach','profile']) {
    await page.evaluate(n=>window.DEMO.go(n),r);await page.waitForTimeout(400);
    const t=await page.evaluate(k=>{const x=window.DEMO.screens[k];const root=x&&(x.root||(x.host&&x.host.shadowRoot));
      return root?(root.textContent||'').replace(/\s+/g,' '):''},r);
    if (/could not start|Try again/i.test(t)) holes.push(r+':dead');
    if (/undefined|NaN|\[object Object\]/.test(t)) holes.push(r+':hole');
  }
  const ok = !errs.length && !holes.length;
  if(!ok) bad++;
  console.log((ok?'PASS ':'FAIL ')+label+(errs.length?' | throws: '+errs[0].slice(0,60):'')+(holes.length?' | '+holes.join(','):''));
  await br.close();
}
srv.close();
console.log('\n'+CASES.length+' cases, '+bad+' failed');
process.exit(bad?1:0);
