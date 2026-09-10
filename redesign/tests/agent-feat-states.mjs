import { chromium } from '@playwright/test';
const B='file:///home/user/everything-claude-code/redesign/08-build/';
const jobs=[['fuel.html',['populated','first-weeks','hidden','live','empty','loading','error']],
            ['profile.html',['populated','badges','guest','new','loading','error']],
            ['shopping.html',['populated','empty','loading','error']]];
const br=await chromium.launch();
for (const [f,sts] of jobs){
  const p=await br.newPage({viewport:{width:390,height:844}});
  const seen={};
  console.log('==== '+f);
  for(const st of sts){
    await p.goto(B+f+'?state='+st); await p.waitForTimeout(400);
    const d=await p.evaluate(()=>({state:document.getElementById('screen').getAttribute('data-state'),
      tids:Array.from(document.querySelectorAll('#screen [data-testid]')).map(e=>e.dataset.testid),
      txt:document.getElementById('screen').innerText.replace(/\s+/g,' ').slice(0,110),
      len:document.getElementById('screen').innerHTML.length}));
    seen[st]=d; console.log(' '+st.padEnd(12), 'attr='+d.state, 'len='+d.len, '|', d.txt);
  }
  // switch via dev menu, check no leak
  console.log(' -- dev-menu switching --');
  await p.goto(B+f); await p.waitForTimeout(300);
  await p.click('#dev-toggle');
  for(const st of sts){
    await p.click('[data-testid="dev-state-'+st+'"]'); await p.waitForTimeout(400);
    const d=await p.evaluate(()=>({state:document.getElementById('screen').getAttribute('data-state'),
      tids:Array.from(document.querySelectorAll('#screen [data-testid]')).map(e=>e.dataset.testid),
      len:document.getElementById('screen').innerHTML.length}));
    const exp=seen[st];
    const extra=d.tids.filter(t=>!exp.tids.includes(t));
    const miss=exp.tids.filter(t=>!d.tids.includes(t));
    console.log(' '+st.padEnd(12), d.len===exp.len?'identical':'DIFF len '+d.len+' vs '+exp.len,
      extra.length?'LEAKED:'+extra.join(','):'', miss.length?'MISSING:'+miss.join(','):'');
  }
  await p.close();
}
await br.close();
