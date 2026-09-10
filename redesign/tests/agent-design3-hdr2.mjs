import {chromium} from 'playwright';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/train.html');await p.waitForTimeout(600);
await p.evaluate(()=>{const t=[...document.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+40&&/auto|scroll/.test(getComputedStyle(e).overflowY));t.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true}));t.scrollTop=300;t.dispatchEvent(new Event('scroll',{bubbles:true}));});
await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const h=document.querySelector('.hdr--large');const s=getComputedStyle(h);return JSON.stringify({inline:h.getAttribute('style'),height:s.height,minHeight:s.minHeight,rect:h.getBoundingClientRect().height,collapsed:h.dataset.collapsed,pt:s.paddingTop,pb:s.paddingBottom});}));
await b.close();
