/* A WORKOUT YOU ALREADY DID: CORRECTING IT, AND DOING IT AGAIN.

   Both buttons on the session detail screen were claimed by the router in
   the capture phase, so neither screen handler ever ran. "Edit the sets"
   navigated away from the very editor it opens -- ed-name, ed-kg-*,
   ed-delset-*, ed-save, all built, all unreachable -- and landed on an
   empty new session, so there was no way for anybody to correct a logged
   workout at all. "Do this session again" opened an empty Quick Workout
   because the key carrying the lifts is written by a handler that never
   ran.

   The third bug is underneath both: beginning a session ends the old
   record, which fires the listener that marks the screen finished, so a
   repeated workout was marked over the instant it began and was never put
   on the record -- no resume shelf, and a reload lost it. */
import path from 'node:path'; import http from 'node:http';
import { readFile } from 'node:fs/promises';
const ROOT='/home/user/everything-claude-code/redesign';
const { chromium } = await import(path.join(ROOT,'tests/node_modules/playwright/index.mjs'));
const F=path.join(ROOT,'10-final/locked-app.html');
const srv=http.createServer(async(q,r)=>{const p=new URL(q.url,'http://x').pathname;
 if(p==='/sw.js'){r.writeHead(404);r.end('');return;}
 r.writeHead(200,{'content-type':'text/html'});r.end(await readFile(F))});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const SEED={lk_onboarded:'true',lk_tutorialSeen:'true',
 lk_profile:{username:'c',displayName:'c',useKg:true,weightKg:82,heightCm:180,age:31,sex:'male',goal:'maintain'},
 lk_splits:[{id:'s1',name:'PPL',created:'9/1/2026',days:[{name:'Push',blocks:[],exercises:[
   {id:104,name:'Incline Machine Press',group:'Chest',muscle:'Upper Chest'}]}]}],
 lk_history:[{id:'w1',name:'PPL - Push',date:'2026-09-07',kind:'lift',kg:1464,min:40,sets:3,
   exercises:[{id:104,name:'Incline Machine Press',muscle:'Upper Chest',
     sets:[{kg:59,reps:8,done:true},{kg:61.5,reps:8,done:true},{kg:64,reps:6,done:true}]}]}],
 lk_prs:[]};
const mk=async()=>{const br=await chromium.launch();
 const ctx=await br.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 await ctx.addInitScript((d)=>{if(localStorage.getItem('lk_s'))return;localStorage.setItem('lk_s','1');
  Object.keys(d).forEach(k=>localStorage.setItem(k,typeof d[k]==='string'?d[k]:JSON.stringify(d[k])))},SEED);
 const page=await ctx.newPage(); const errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 await page.goto('http://127.0.0.1:'+srv.address().port+'/');
 await page.waitForFunction(()=>window.DEMO&&Object.keys(window.DEMO.screens).length>0);
 await page.waitForTimeout(900); return {br,page,errs};};
const mkT=(page)=>({
 tap: async(t)=>{const l=page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if(!(await l.count()))return 'missing:'+t; try{await l.click({timeout:2500})}catch(e){return 'unclick'} return 'ok'},
 shown:()=>page.evaluate(()=>{const s=window.DEMO.screens;return Object.keys(s).find(k=>{const h=s[k]&&s[k].host;
  if(!h||!h.getBoundingClientRect)return false;const b=h.getBoundingClientRect();
  return getComputedStyle(h).display!=='none'&&b.width>0&&b.height>0})||'none'}),
 raw:(k)=>page.evaluate(x=>{try{return JSON.parse(localStorage.getItem(x)||'null')}catch(e){return null}},k)});
const open=async(page,t)=>{await page.evaluate(()=>window.DEMO.go('train'));await page.waitForTimeout(600);
 await t.tap('open-history');await page.waitForTimeout(700);await t.tap('history-w1');await page.waitForTimeout(800);};

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

console.log('=== correcting a past session ===\n');
let {br,page,errs}=await mk(); let t=mkT(page);
await open(page,t);
ok((await t.shown()) === 'workout-detail', 'a past session opens', await t.shown());
ok((await t.tap('detail-edit')) === 'ok', 'Edit the sets is offered');
await page.waitForTimeout(900);
ok((await t.shown()) === 'workout-detail',
   'and stays here rather than opening a new workout', await t.shown());
ok(await page.evaluate(()=>{const r=window.DEMO.screens['workout-detail'];
 const root=r.root||r.host.shadowRoot;
 return !!root.querySelector('[data-testid="ed-save"],[data-testid="ed-name"]')}),
   'with the editor actually open');
ok(!errs.length, 'nothing throws editing a past session', errs[0] || '');
await br.close();

console.log('\n=== doing it again ===\n');
({br,page,errs}=await mk()); t=mkT(page);
await open(page,t);
ok((await t.tap('detail-repeat')) === 'ok', 'Do this session again is offered');
await page.waitForTimeout(1500);
ok((await t.shown()) === 'workout-log', 'it opens a workout', await t.shown());
const carried = (((await t.raw('lk_liveSessionRows')) || {}).exercises || []).map(e => e.name);
ok(carried.indexOf('Incline Machine Press') >= 0,
   'carrying the lifts of the session it repeats', JSON.stringify(carried));
const live = await t.raw('lk_liveSession');
ok(!!live && !!live.startedAt,
   'and it is on the record, so it can be resumed', JSON.stringify(live));
const logText = await page.evaluate(()=>{const r=window.DEMO.screens['workout-log'];
 const root=r.root||r.host.shadowRoot;return (root.textContent||'').replace(/\s+/g,' ').trim()});
ok(/59/.test(logText), "with last time's numbers beside them to beat");
ok(!errs.length, 'nothing throws repeating a session', errs[0] || '');
await br.close(); srv.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
