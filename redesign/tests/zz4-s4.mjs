import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1500);
await p.click('[data-testid="row-weight-unit"]'); await p.waitForTimeout(500);
await p.click('[data-testid="opt-unit-lb"]'); await p.waitForTimeout(800);
console.log('units row:',T(await p.locator('[data-testid="row-weight-unit"]').innerText()));
console.log('body row:',T(await p.locator('[data-testid="row-body"]').innerText()));
console.log('profile stored:',await p.evaluate(()=>localStorage.getItem('lk_profile')));
await p.locator('[data-testid="back"]').first().click(); await p.waitForTimeout(900);
console.log('\nPROFILE:',T(await p.locator('[data-testid="screen-profile"]').first().innerText()).slice(0,700));
// check train/progress weights
await p.goto(DEMO+"#/train"); await p.waitForTimeout(1400);
console.log('\nTRAIN:',T(await p.locator('body').innerText()).replace(/SCREENS.*?\|/,'').slice(0,600));
await p.reload(); await p.waitForTimeout(1600);
await p.goto(DEMO+'#/profile'); await p.waitForTimeout(1200);
console.log('\nAFTER RELOAD PROFILE:',T(await p.locator('[data-testid="screen-profile"]').first().innerText()).slice(0,400));
console.log('ERRS',errs);
await b.close();
