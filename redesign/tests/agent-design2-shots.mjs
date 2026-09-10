import { chromium } from 'playwright';
import fs from 'fs';
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/s2';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html')).sort();
fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();
for(const theme of ['dark','light']){
  const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
  const p=await ctx.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  for(const f of screens){
    await p.goto('file://'+DIR+'/'+f);
    await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
    await p.waitForTimeout(800);
    await p.screenshot({path:`${OUT}/${f.replace('.html','')}-${theme}.png`});
  }
  if(errs.length) console.log(theme,'PAGE ERRORS:',errs.slice(0,10));
  await ctx.close();
}
await b.close();
console.log('done',screens.length,screens.join(','));
