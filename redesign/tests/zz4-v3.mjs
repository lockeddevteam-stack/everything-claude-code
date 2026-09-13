import {open,DEMO,T} from './zz4-lib.mjs';
// D4 export keys
{const {b,p}=await open(DEMO+'#/profile/settings');await p.waitForTimeout(1400);
let got=null;p.on('download',async d=>{const s=await d.createReadStream();let t='';for await(const c of s)t+=c;got=JSON.parse(t)});
await p.click('[data-testid="row-body"]');await p.waitForTimeout(400);await p.fill('[data-testid="field-weight"]','70');await p.click('[data-testid="save-body"]');await p.waitForTimeout(500);
await p.click('[data-testid="row-export"]');await p.waitForTimeout(2500);
console.log('D4 toast:',T(await p.locator('[data-testid="toast"]').innerText()));
console.log('D4 backup keys:',got&&Object.keys(got.data));await b.close();}
// D6
{const {b,p}=await open(DEMO+'#/profile/settings');await p.waitForTimeout(1400);
await p.click('[data-testid="row-body"]');await p.waitForTimeout(400);
await p.fill('[data-testid="field-age"]','999');await p.fill('[data-testid="field-weight"]','0');
await p.click('[data-testid="save-body"]');await p.waitForTimeout(700);
console.log('D6 body row:',T(await p.locator('[data-testid="row-body"]').innerText()));
console.log('D6 stored age:',await p.evaluate(()=>JSON.parse(localStorage.getItem('lk_profile')).age));await b.close();}
// D9
{const {b,p}=await open(DEMO+'#/coach');await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]');await p.waitForTimeout(400);
await p.click('[data-testid="setup-perms-off"]');await p.click('[data-testid="setup-save"]');await p.waitForTimeout(600);
await p.click('[data-testid="seg-chat"]');await p.waitForTimeout(400);
await p.click('[data-testid="action-new-chat"]');await p.waitForTimeout(700);
console.log('D9 intro:',T(await p.locator('[data-testid="chat-intro"]').innerText()).slice(-130));
await p.fill('[data-testid="composer-input"]','How is my bench going?');await p.click('[data-testid="composer-send"]');await p.waitForTimeout(2500);
console.log('D9 reply:',T(await p.locator('[data-testid="chat-thread"]').innerText()).slice(-200));await b.close();}
// D7/D8
{const {b,p}=await open(DEMO+'#/profile');await p.waitForTimeout(1300);
console.log('D7/8:',T(await p.locator('[data-testid="screen-profile"]').first().innerText()).slice(0,320));await b.close();}
// D5b memory clear-all
{const {b,p}=await open(DEMO+'#/coach');await p.waitForTimeout(900);
await p.click('[data-testid="seg-setup"]');await p.waitForTimeout(400);
await p.click('[data-testid="setup-add-memory"]');await p.waitForTimeout(400);
await p.fill('[data-testid="setup-memory-text"]','Trains at 6am');await p.click('[data-testid="setup-memory-save"]');await p.waitForTimeout(4500);
await p.click('[data-testid="setup-clear-memory"]');await p.waitForTimeout(700);
await p.click('[data-testid="setup-clear-memory"]');await p.waitForTimeout(700);
console.log('D5b toast:',await p.locator('[data-testid="toast"]').innerText());await b.close();}
