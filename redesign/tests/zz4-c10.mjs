import {open,DEMO,T,ids as IDS,vtext} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(800);

await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(400);
await p.click('[data-testid="setup-interview-open"]'); await p.waitForTimeout(600);
console.log('IDS',(await IDS(p)).join(','));
const body=async()=>vtext(p);
console.log('\nQ1:',(await body()).slice(0,1500));
console.log('ERRS',errs);
await b.close();
