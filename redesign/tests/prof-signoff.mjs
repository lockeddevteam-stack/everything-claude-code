import { chromium } from 'playwright';
import path from 'path';
const B = 'file://' + path.resolve('../08-build') + '/';
const out = [];
const log = (...a) => { out.push(a.join(' ')); console.log(...a); };

const br = await chromium.launch();
const ctx = await br.newContext();
const p = await ctx.newPage();
p.on('pageerror', e => log('!! pageerror', e.message));

async function txt(sel){ try { return (await p.textContent(sel))?.replace(/\s+/g,' ').trim(); } catch(e){ return 'MISSING:'+sel; } }

// ---------- PROFILE ----------
await p.goto(B+'profile.html'); await p.waitForFunction('window.__ready');
log('P header', await txt('[data-large-title], .hdr__title'));
log('P identity', await txt('[data-testid=identity]'));
for (const s of ['sessions','records','sets','volume'])
  log('P stat-'+s, await txt(`[data-testid=stat-${s}]`));
log('P totals-testid', await txt('[data-testid=totals]'));
log('P prcount', await txt('.section__head .t-meta'));
for (let i=0;i<6;i++) log('P pr'+i, await txt(`[data-testid=pr-${i}]`));
log('P badges present?', await p.locator('[data-testid^=badge-]').count());

// guest
await p.goto(B+'profile.html?state=guest'); await p.waitForFunction('window.__ready');
log('G banner', await txt('[data-testid=guest-banner]'));
log('G identity', await txt('[data-testid=identity]'));
await p.click('[data-testid=signup]'); await p.waitForLoadState();
log('G signup ->', p.url().split('/').pop());

// settings entry
await p.goto(B+'profile.html'); await p.waitForFunction('window.__ready');
await p.click('[data-testid=open-settings]'); await p.waitForLoadState();
log('P settings ->', p.url().split('/').pop());

// badges via localStorage
await p.goto(B+'profile.html');
await p.evaluate(()=>localStorage.setItem('lk_badges','true'));
await p.goto(B+'profile.html'); await p.waitForFunction('window.__ready');
log('B badges count', await p.locator('[data-testid^=badge-]').count());
log('B badge head', await txt('.section__head'));
const bl = await p.locator('[data-testid^=badge-]').allTextContents();
log('B badges', JSON.stringify(bl.map(s=>s.replace(/\s+/g,' ').trim())));
await p.evaluate(()=>localStorage.removeItem('lk_badges'));

// new state
await p.goto(B+'profile.html?state=new'); await p.waitForFunction('window.__ready');
log('N', await txt('[data-testid=state-new]'), '|', await txt('[data-testid=stat-sessions]'));

// units: lb
await p.goto(B+'profile.html');
await p.evaluate(()=>localStorage.setItem('lk_profile', JSON.stringify(Object.assign({},window.LKFixtures.profile,{useKg:false}))));
await p.goto(B+'profile.html'); await p.waitForFunction('window.__ready');
log('LB volume', await txt('[data-testid=stat-volume]'));
log('LB pr0', await txt('[data-testid=pr-0]'));
await p.evaluate(()=>localStorage.clear());

console.log('=====SETTINGS=====');
await p.goto(B+'settings.html');
await p.waitForSelector('[data-testid=row-identity]');
log('S identity', await txt('[data-testid=row-identity]'));
log('S body', await txt('[data-testid=row-body]'));
log('S sync', await txt('.row--static'));
for (const t of ['row-weight-unit','row-distance-unit','row-week-start','row-appearance','row-rest-length','row-plate-rounding','row-reminder-time','row-checkin','row-export','row-restore','row-reset','row-delete','row-sign-out','row-tutorial'])
  log('S '+t, await txt(`[data-testid=${t}]`));
log('S groups', JSON.stringify(await p.locator('.section__head h2').allTextContents()));
log('S switches', JSON.stringify(await p.locator('[role=switch]').evaluateAll(ns=>ns.map(n=>n.dataset.testid+'='+n.getAttribute('aria-checked')))));
