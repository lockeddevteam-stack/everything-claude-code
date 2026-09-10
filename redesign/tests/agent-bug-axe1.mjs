import { chromium } from 'playwright';
import fs from 'fs';
const axe = fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
for (const s of ['home','workout-log','settings','coach']) {
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/'+s+'.html');await p.waitForTimeout(400);
await p.addScriptTag({content:axe});
const r=await p.evaluate(async()=>{const res=await axe.run(document.body,{resultTypes:['violations']});
  return res.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,3).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').split('\n').slice(1,3).join(' / '))}));});
console.log('###',s,'violations:',r.length);
r.forEach(v=>console.log(' ',v.impact,v.id,'x'+v.n,'\n   ',v.ex.join('\n    ')));
}
await b.close();
