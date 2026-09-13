import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1500);
const S=async()=>T(await p.locator('[data-testid="settings-scroll"]').innerText());
console.log('SETTINGS:',(await S()).slice(0,2500));
console.log('ERRS',errs);
await b.close();
