/* PROBE: the older sentinel-marker protocol, per marker, on the screen,
   plus what the shopping card does when its approve button is pressed.
   Throwaway investigation script — not registered in gate.sh. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let answer = '';
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type,authorization,apikey',
            'access-control-allow-methods': 'GET,POST,OPTIONS' };
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  await body(req);
  res.writeHead(200, H); res.end(JSON.stringify({ content: [{ type: 'text', text: answer }] }));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true })).newPage();
await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.evaluate(() => {
  const F = window.LKFixtures;
  localStorage.clear();
  localStorage.setItem('lk_onboarded', 'true'); localStorage.setItem('lk_tutorialSeen', 'true');
  localStorage.setItem('lk_history', JSON.stringify(F.history));
  localStorage.setItem('lk_profile', JSON.stringify(F.profile));
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(500);
const realId = await page.evaluate(() => window.LKExercises.all()[0].id);

async function say(text, reply) {
  answer = reply;
  await page.evaluate(() => { localStorage.removeItem('lk_coachLastMsgs'); location.hash = '#/home'; });
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(400);
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const b = r.querySelector('[data-testid="composer-input"]');
    b.value = t; b.dispatchEvent(new Event('input', { bubbles: true }));
    r.querySelector('[data-testid="composer-send"]').click();
  }, text);
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const m = [...r.querySelectorAll('.msg')].pop();
    return { bubble: (m.querySelector('.msg__bubble')?.innerText || '').replace(/\n+/g, ' ').trim().slice(0, 200),
             cards: [...m.querySelectorAll('.card[data-kind]')].map((c) => c.dataset.kind + '/' + c.dataset.ok) };
  });
}

const CASES = [
  ['REMEMBER', 'Noted.\n###REMEMBER###\nYou train five days a week.\n###/REMEMBER###'],
  ['SHOPPING_ADD', 'Added.\n###SHOPPING_ADD###\nChicken, Rice, Oats\n###/SHOPPING_ADD###'],
  ['INSTRUCTIONS', 'Done.\n###INSTRUCTIONS_START###\nMetric only.\n###INSTRUCTIONS_END###'],
  ['PROGRAM', 'Here it is.\n###PROGRAM_START###\n{"name":"PPL","days":[{"name":"Push","exercises":[{"id":' + realId + ',"sets":4}]}]}\n###PROGRAM_END###'],
  ['REMEMBER + PROGRAM together', 'Both.\n###REMEMBER###\nI train five days.\n###/REMEMBER###\n###PROGRAM_START###\n{"name":"PPL","days":[{"name":"Push","exercises":[{"id":' + realId + ',"sets":4}]}]}\n###PROGRAM_END###']
];
for (const [name, reply] of CASES) {
  const s = await say('do it', reply);
  console.log('\n--- sentinel ' + name);
  console.log('  cards: ' + JSON.stringify(s.cards));
  console.log('  SCREEN SAYS: ' + JSON.stringify(s.bubble));
}

/* And the shopping card's approve button. */
const s = await say('shopping please', JSON.stringify({ reply: 'List.', actions: [
  { kind: 'shopping', items: [{ name: 'Rice', qty: 3, unit: 'kg' }, { name: 'Oats', quantity: 2, unit: 'kg' }] } ] }));
console.log('\n--- shopping card as drawn');
console.log('  ' + JSON.stringify(s));
const before = await page.evaluate(() => (JSON.parse(localStorage.getItem('lk_shoppingList') || '[]')).length);
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const b = [...r.querySelectorAll('[data-act="act-review"]')].pop();
  b && b.click();
});
await page.waitForTimeout(900);
console.log('  after pressing "Review and add": list length ' + before + ' -> ' +
  await page.evaluate(() => (JSON.parse(localStorage.getItem('lk_shoppingList') || '[]')).length));
console.log('  where the screen went: ' + await page.evaluate(() => location.hash));
console.log('  a sheet or review pane on the coach screen: ' + await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  return [...r.querySelectorAll('[data-testid]')].map((e) => e.dataset.testid).filter((t) => /sheet|review/i.test(t)).join(',') || '(none)';
}));
await browser.close(); server.close();
