import { chromium } from '@playwright/test';
const B='file:///home/user/everything-claude-code/redesign/08-build/';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:390,height:844}});
let opened=0; p.on('popup',()=>opened++);
const T=t=>'[data-testid="'+t+'"]';
// does picking a shop open anything?
await p.goto(B+'shopping.html'); await p.waitForTimeout(400);
await p.click(T('shop-at')); await p.waitForTimeout(350);
const rows=await p.$$('[data-testid^="sa-"]:not([data-testid="sa-close"])');
console.log('shop-at rows:', rows.length);
await rows[0].click(); await p.waitForTimeout(900);
console.log('popups opened after picking a shop:', opened, '| sheet still open:', await p.evaluate(()=>!!document.querySelector('[data-testid="sheet-shop-at"]')));
// item sheet store row
opened=0; await p.goto(B+'shopping.html'); await p.waitForTimeout(400);
await p.click('.item__main'); await p.waitForTimeout(350);
const f=await p.$$('[data-testid^="find-"]'); console.log('item-sheet store rows:', f.length);
if(f.length){ await f[0].click(); await p.waitForTimeout(900); console.log('popups opened:', opened); }
// clipboard/share on export
opened=0; await p.goto(B+'shopping.html'); await p.waitForTimeout(400);
await p.evaluate(()=>{window.__share=0;window.__clip=0;navigator.share=()=>{window.__share++;return Promise.resolve();};
  try{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>{window.__clip++;return Promise.resolve();}},configurable:true});}catch(e){}});
await p.click(T('export')); await p.waitForTimeout(600);
console.log('export -> share calls', await p.evaluate(()=>window.__share), 'clipboard calls', await p.evaluate(()=>window.__clip));
await br.close();
