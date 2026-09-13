import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
// D1 plan delete survives reload
{const {b,p,errs}=await open(DEMO+'#/coach');await p.waitForTimeout(900);
await p.click('[data-testid="seg-plan"]');await p.waitForTimeout(400);
await p.click('[data-testid="plan-delete"]');await p.waitForTimeout(400);
await p.click('[data-testid="delete-confirm"]');await p.waitForTimeout(700);
await p.reload();await p.waitForTimeout(1400);await p.click('[data-testid="seg-plan"]');await p.waitForTimeout(500);
console.log('D1 after delete+reload:',T(await p.locator('[data-testid="view-plan"]').innerText()).slice(0,180));
console.log('D1 errs',errs);await b.close();}
// D3 toast open in train
{const {b,p,errs}=await open(DEMO+'#/coach');await p.waitForTimeout(900);
await p.click('[data-testid="seg-plan"]');await p.waitForTimeout(400);
await p.click('[data-testid="plan-bind-open"]');await p.waitForTimeout(400);
await p.click('[data-testid="bind-split-0"]');await p.waitForTimeout(600);
const t=await p.locator('[data-testid="toast"]').count()?T(await p.locator('[data-testid="toast"]').innerText()):'(none)';
if(await p.locator('[data-testid="toast-action"]').count()){await p.click('[data-testid="toast-action"]');await p.waitForTimeout(1800);}
console.log('D3 toast:',t,'| url:',p.url());await b.close();}
// D5 toast markup
{const {b,p,errs}=await open(DEMO+'#/coach');await p.waitForTimeout(900);
await p.click('[data-testid="msg-edit-2"]');await p.waitForTimeout(500);
console.log('D5 toast:',await p.locator('[data-testid="toast"]').innerText());await b.close();}
// D2 cycle gate
{const {b,p,errs}=await open(DEMO+'#/profile/settings');await p.waitForTimeout(1400);
await p.click('[data-testid="switch-cycle"]');await p.waitForTimeout(500);
await p.locator('[data-testid="back"]').first().click();await p.waitForTimeout(900);
const r=p.locator('[data-testid="row-cycle"]');
if(await r.count()){await r.first().scrollIntoViewIfNeeded();await r.first().click({force:true});await p.waitForTimeout(1200);}
console.log('D2 cycle screen:',T(await p.locator('[data-testid="screen-cycle"]').first().innerText()).slice(0,120));await b.close();}
// D4 export keys
{const {b,p,errs}=await open(DEMO+'#/profile/settings');await p.waitForTimeout(1400);
let got=null;p.on('download',async d=>{const s=await d.createReadStream();let t='';for await(const c of s)t+=c;got=JSON.parse(t)});
await p.click('[data-testid="row-body"]');await p.waitForTimeout(400);await p.fill('[data-testid="field-weight"]','70');await p.click('[data-testid="save-body"]');await p.waitForTimeout(500);
await p.click('[data-testid="row-export"]');await p.waitForTimeout(2500);
console.log('D4 backup keys:',got&&Object.keys(got.data));await b.close();}
// D6 age 999
{const {b,p,errs}=await open(DEMO+'#/profile/settings');await p.waitForTimeout(1400);
await p.click('[data-testid="row-body"]');await p.waitForTimeout(400);
await p.fill('[data-testid="field-age"]','999');await p.fill('[data-testid="field-weight"]','0');
await p.click('[data-testid="save-body"]');await p.waitForTimeout(700);
console.log('D6 body row:',T(await p.locator('[data-testid="row-body"]').innerText()));await b.close();}
// D9 perms off then ask
{const {b,p,errs}=await open(DEMO+'#/coach');await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]');await p.waitForTimeout(400);
await p.click('[data-testid="setup-perms-off"]');await p.click('[data-testid="setup-save"]');await p.waitForTimeout(600);
await p.click('[data-testid="seg-chat"]');await p.waitForTimeout(400);
await p.click('[data-testid="action-new-chat"]');await p.waitForTimeout(600);
console.log('D9 intro:',T(await p.locator('[data-testid="chat-intro"]').innerText()).slice(-120));
await p.fill('[data-testid="composer-input"]','How is my bench going?');await p.click('[data-testid="composer-send"]');await p.waitForTimeout(2500);
console.log('D9 reply:',T(await p.locator('[data-testid="chat-thread"]').innerText()).slice(-200));await b.close();}
// D7/D8 profile
{const {b,p,errs}=await open(DEMO+'#/profile');await p.waitForTimeout(1300);
console.log('D7/8 profile:',T(await p.locator('[data-testid="screen-profile"]').first().innerText()).slice(0,300));await b.close();}
