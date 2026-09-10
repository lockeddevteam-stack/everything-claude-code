/* A corner, magnified, before and after. The difference between a circular
   arc and a superellipse is a few pixels at the tangent, which is exactly why
   it needs looking at rather than asserting. */
import { chromium } from 'playwright';
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 520, height: 260 }, deviceScaleFactor: 4 });
await p.setContent(`
  <style>
    body { margin:0; background:#0A0A0B; display:flex; gap:40px; padding:40px;
           font:600 13px -apple-system,system-ui; color:#EDEDEF; }
    .w { text-align:center; }
    .b { width:140px; height:140px; background:#1C1C20; border:1px solid #6A6A74;
         border-radius:20px; margin-bottom:10px; }
    .sq { corner-shape: superellipse(1.8); }
  </style>
  <div class="w"><div class="b"></div>circular (before)</div>
  <div class="w"><div class="b sq"></div>superellipse (after)</div>`);
await p.waitForTimeout(200);
await p.screenshot({ path: '/tmp/corner-zoom.png', clip: { x: 30, y: 30, width: 460, height: 180 } });
console.log('written');
await br.close();
