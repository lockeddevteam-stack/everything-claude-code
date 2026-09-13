import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle');
await p.waitForTimeout(1200);
console.log('URL',p.url());
const v=await p.$$eval('[data-testid^="view-"], [id]',ns=>ns.filter(n=>n.offsetParent!==null&&n.innerText).map(n=>(n.dataset.testid||n.id)+'::'+n.innerText.slice(0,50)));
console.log('IDS:',(await IDS(p)).join(','));
console.log('TEXT:',T(await p.locator('body').innerText()).slice(0,2000));
console.log('ERRS',errs);
await b.close();
