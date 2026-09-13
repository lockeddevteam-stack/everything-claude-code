import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
import fs from 'node:fs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1500);
let file=null;
p.on('download',async d=>{file='/tmp/claude-0/'+d.suggestedFilename();await d.saveAs(file);console.log('DOWNLOAD',d.suggestedFilename());});
// make a change first so restore is observable
await p.click('[data-testid="row-body"]'); await p.waitForTimeout(500);
await p.fill('[data-testid="field-weight"]','80'); await p.click('[data-testid="save-body"]'); await p.waitForTimeout(600);
await p.click('[data-testid="row-export"]'); await p.waitForTimeout(2500);
console.log('toast:',await p.locator('[data-testid="toast"]').count()?T(await p.locator('[data-testid="toast"]').innerText()):'(none)');
console.log('file',file, file&&fs.statSync(file).size);
if(file)console.log('head:',fs.readFileSync(file,'utf8').slice(0,400));
// change again
await p.click('[data-testid="row-body"]'); await p.waitForTimeout(500);
await p.fill('[data-testid="field-weight"]','55'); await p.click('[data-testid="save-body"]'); await p.waitForTimeout(600);
console.log('body now:',T(await p.locator('[data-testid="row-body"]').innerText()));
// restore
await p.click('[data-testid="row-restore"]'); await p.waitForTimeout(900);
console.log('restore ids:',(await IDS(p)).filter(x=>/restore|sheet|dialog|file/.test(x)).join(','));
const dl=p.locator('[data-testid$="dialog"],[data-testid$="sheet"]').first();
if(await dl.count())console.log('dialog:',T(await dl.innerText()).slice(0,500));
console.log('file inputs:',await p.$$eval('input[type=file]',ns=>ns.length));
console.log('ERRS',errs);
await b.close();
