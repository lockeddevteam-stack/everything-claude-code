/* PROBE: the real client against the repo's OWN Worker source.

   redesign/15-server/coach-worker.js is loaded and served verbatim. The
   only thing faked is api.anthropic.com, which is stubbed to answer with
   a perfectly good tool_use block. Everything between the composer and
   that stub is the shipped code.

   The deployed Worker at lockedapi.cescocugliari.workers.dev is not
   reachable from here, so this tests the source in the repo, not the
   deployment. Throwaway investigation script — not registered in gate.sh. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const worker = (await import(pathToFileURL(path.join(ROOT, '15-server', 'coach-worker.js')).href)).default;

/* What the Worker forwarded to the model, and what it sent back. */
const upstreamSaw = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('api.anthropic.com')) {
    const sent = JSON.parse(init.body);
    upstreamSaw.push(sent);
    return new Response(JSON.stringify({
      content: [{ type: 'tool_use', name: 'reply_with_actions',
        input: { reply: 'Two more sets on the last one.', actions: [] } }],
      usage: { input_tokens: 10, output_tokens: 10 }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return realFetch(url, init);
};

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const r = new Request('http://w' + req.url, {
    method: req.method,
    headers: Object.entries(req.headers).filter(([, v]) => typeof v === 'string'),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)
  });
  const out = await worker.fetch(r, { ANTHROPIC_API_KEY: 'test-key' });
  const h = {}; out.headers.forEach((v, k) => { h[k] = v; });
  h['access-control-allow-headers'] = 'content-type, authorization, apikey';
  res.writeHead(out.status, h);
  res.end(Buffer.from(await out.arrayBuffer()));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.evaluate(() => {
  const F = window.LKFixtures;
  localStorage.clear();
  localStorage.setItem('lk_onboarded', 'true'); localStorage.setItem('lk_tutorialSeen', 'true');
  const put = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  put('lk_history', F.history); put('lk_profile', F.profile); put('lk_goals', F.goals);
  put('lk_fuelTargets', F.nutrition.targets); put('lk_fuelLog', F.nutrition.days);
  put('lk_weightLog', F.weightLog); put('lk_feedback', F.feedback);
});

async function run(label, cfg) {
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate((c) => { window.LK_CLOUD = c; localStorage.removeItem('lk_coachLastMsgs'); }, cfg);
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate((c) => { window.LK_CLOUD = c; }, cfg);
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(500);
  console.log('\n===== ' + label);
  console.log('  endpoint the client will POST to: ' +
    await page.evaluate(() => (window.LK_CLOUD.coachUrl || String(window.LK_CLOUD.apiUrl || '').replace(/\/$/, '') + '/')));
  for (const q of ['how do I fix my bench', 'and my squat?']) {
    await page.evaluate((t) => {
      const r = document.getElementById('demo-screen-coach').shadowRoot;
      const b = r.querySelector('[data-testid="composer-input"]');
      b.value = t; b.dispatchEvent(new Event('input', { bubbles: true }));
      r.querySelector('[data-testid="composer-send"]').click();
    }, q);
    await page.waitForTimeout(1600);
    const s = await page.evaluate(() => {
      const r = document.getElementById('demo-screen-coach').shadowRoot;
      const m = [...r.querySelectorAll('.msg')].pop();
      return (m.querySelector('.msg__bubble')?.innerText || '').replace(/\n+/g, ' ').trim();
    });
    console.log('  asked ' + JSON.stringify(q));
    console.log('  SCREEN SAYS: ' + JSON.stringify(s));
  }
}

await run('A. apiUrl at the root, which is what cloud-config.js ships', { supabaseUrl: BASE, supabaseKey: 'k', apiUrl: BASE });
await run('B. coachUrl pointed straight at the Worker\'s own /coach route', { supabaseUrl: BASE, supabaseKey: 'k', apiUrl: BASE, coachUrl: BASE + '/coach' });

console.log('\n===== WHAT THE WORKER FORWARDED TO THE MODEL =====');
upstreamSaw.forEach((s, i) => {
  console.log('\n request ' + (i + 1));
  console.log('  messages: ' + JSON.stringify(s.messages));
  console.log('  system prompt the MODEL got (' + s.system.length + ' chars):');
  console.log('  ' + JSON.stringify(s.system));
});

await browser.close(); server.close();
