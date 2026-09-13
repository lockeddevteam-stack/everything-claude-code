import {open,DEMO,T,ids as IDS,CYCLEON} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/home/cycle',CYCLEON);
await p.waitForTimeout(1400);
p.on('download',async d=>{console.log('DOWNLOAD:',d.suggestedFilename()); const s=await d.createReadStream(); let t=''; for await(const c of s)t+=c; console.log('CONTENT:',t.slice(0,600));});
await p.click('[data-testid="cycle-settings"]'); await p.waitForTimeout(500);
await p.click('[data-testid="cs-export"]'); await p.waitForTimeout(2500);
console.log('after export toast/ids:',(await IDS(p)).filter(x=>/toast|cs-|sheet/.test(x)).join(','));
const t=p.locator('[data-testid="toast"]'); if(await t.count())console.log('toast:',T(await t.innerText()));
console.log('ERRS',errs);
// delete everything
await p.click('[data-testid="cs-delete"]'); await p.waitForTimeout(700);
console.log('\nIDS:',(await IDS(p)).filter(x=>/del|confirm|dialog/.test(x)).join(','));
const dlg=p.locator('[role=alertdialog],[data-testid$="-dialog"]').first();
if(await dlg.count())console.log('dialog:',T(await dlg.innerText()).slice(0,400));
console.log('ERRS',errs);
await b.close();
