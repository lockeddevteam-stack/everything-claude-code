import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto(pathToFileURL('/home/user/everything-claude-code/redesign/09-review/lab/bodymap-lab.html').href);
await p.waitForTimeout(500);
const view=process.argv[2]||'front', gid=process.argv[3]||'chest';
if(view==='back'){await p.click('#tab-back');await p.waitForTimeout(600);}
const r=await p.evaluate(g=>{const e=document.querySelector('.view:not([data-hidden="true"]) .mg--'+g+' .mg__gnd');const b=e.getBoundingClientRect();return[b.x+b.width/2,b.y+b.height/2];},gid);
await p.mouse.click(r[0],r[1]); await p.waitForTimeout(500);
await p.click('[data-action="open"]'); await p.waitForTimeout(800);
await p.screenshot({path:'/tmp/body-zoom-'+view+'.png'});
await br.close();
