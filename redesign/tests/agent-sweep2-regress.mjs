import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const L=console.log;const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
L('1. split-builder split-name typing');
await p.goto(D+'split-builder.html');await p.waitForTimeout(700);
const sn=await p.locator('[data-testid="split-name"]');
if(await sn.count()){await sn.click({force:true}).catch(()=>{});await p.keyboard.type('Upper Lower');await p.waitForTimeout(400);
 L('  value =',JSON.stringify(await p.locator('[data-testid="split-name"]').inputValue().catch(()=>'not input')));}
else L('  split-name absent in default state');

L('2. coach tab bar reachable in auto-scrolled chat');
for(const pr of [0,2,4]){await p.goto(D+'coach.html');await p.waitForTimeout(700);
 await p.evaluate(i=>{document.getElementById('dev-menu').hidden=false;document.querySelector(`[data-testid="dev-preset-${i}"]`)?.click();},pr);
 await p.waitForTimeout(700);
 L('  preset',pr,await p.evaluate(()=>{const tb=document.querySelector('.tabbar');const r=tb.getBoundingClientRect();
  return {t:Math.round(r.top),b:Math.round(r.bottom),min:tb.getAttribute('data-minimized'),vh:innerHeight};}));}

L('3. settings back');
await p.goto(D+'settings.html');await p.waitForTimeout(600);
L('  attrs:',await p.evaluate(()=>{const e=document.querySelector('[data-testid="back"]');return e?e.outerHTML.slice(0,140):'absent';}));

L('4. review discard dialog buttons visible');
await p.goto(D+'review.html');await p.waitForTimeout(600);
await p.locator('[data-testid="action-discard"]').click({force:true}).catch(()=>L('  no action-discard'));
await p.waitForTimeout(600);
L('  dialog:',await p.evaluate(()=>{const d=document.querySelector('.dialog,.sheet');if(!d)return 'none';
 const r=d.getBoundingClientRect();const bs=[...d.querySelectorAll('button')].map(x=>{const q=x.getBoundingClientRect();
  const hit=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);
  return {t:x.dataset.testid||x.textContent.trim().slice(0,20),b:Math.round(q.bottom),covered:hit&&!x.contains(hit)&&hit!==x?(hit.dataset?.testid||hit.className):null};});
 return {t:Math.round(r.top),b:Math.round(r.bottom),buttons:bs};}));
L('  esc closes?',await (async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(400);return !(await p.evaluate(()=>!!document.querySelector('.dialog,.sheet')));})());

L('5. exercise-library group search placeholder');
await p.goto(D+'exercise-library.html');await p.waitForTimeout(700);
await p.evaluate(()=>{document.getElementById('dev-menu').hidden=false;document.querySelector('[data-testid="dev-preset-4"]').click();});
await p.waitForTimeout(700);
L('  ',await p.evaluate(()=>{const i=document.querySelector('.findbar input,[data-testid="search-input"]');
 if(!i)return 'absent';const cs=getComputedStyle(i);const c=document.createElement('canvas').getContext('2d');
 c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
 return {ph:i.placeholder,w:Math.round(c.measureText(i.placeholder).width),avail:Math.round(i.getBoundingClientRect().width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight))};}));

L('6. workout-log session title');
await p.goto(D+'workout-log.html');await p.waitForTimeout(700);
L('  ',await p.evaluate(()=>{const h=document.querySelector('[data-testid="session-name"]');const r=h.getBoundingClientRect();
 return {txt:h.textContent,w:Math.round(r.width),sw:h.scrollWidth,lines:Math.round(r.height/parseFloat(getComputedStyle(h).lineHeight))};}));

L('7. shopping cancel keeps scroll');
L('8. exercise-library undo wording');
await p.goto(D+'exercise-library.html');await p.waitForTimeout(600);
L('ERRS',JSON.stringify(errs));
await b.close();
