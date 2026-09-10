import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('console',m=>{if(m.type()==='error')console.log('ERR',m.text())});
p.on('pageerror',e=>console.log('PAGEERROR',e.message,'\n ',(e.stack||'').split('\n')[1]));
await p.goto(pathToFileURL(process.argv[2]).href);
await p.waitForTimeout(800); await br.close();
