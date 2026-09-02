/*
  Regenerates the Open Graph share images in public/og from scripts/og-template.html.
  Optional: the PNGs are committed, so only run this when a title changes.
  Needs `npm install --no-save playwright-core` and a local Chrome or Chromium.
  Run: node scripts/generate-og.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tpl = `file://${root}/scripts/og-template.html`;
const images = [
  ['default', 'Keep Cayman for our grandchildren', 'The largest youth-led environmental advocacy group in the Cayman Islands. Founded by students in 2018.'],
  ['cruise-berthing-legacy', 'Cruise berthing: 63.66% said no', 'Referendum, 30 April 2025. POF campaigned on it since 2018.'],
  ['mangroves-and-wetlands', 'Mangroves secure our future', 'POF argues for mangrove protection every time the law is reopened.'],
  ['single-use-plastics', 'Our future is not single-use', 'Two tons of plastic removed in one day. POF wants less of it arriving.'],
  ['reef-safe-sunscreen', 'Reef-safe sunscreen', 'Choose sunscreen that does not harm coral. Ask your school chapter to take it on.'],
  ['heritage-homes', 'Protecting our future is protecting our past', "Cayman's traditional homes belong in the same conversation as its reefs."],
  ['managed-retreat-seven-mile-beach', 'Managed retreat for Seven Mile Beach', 'Plan where the beach moves now, instead of paying for it later.'],
  ['youth-climate-march', 'Youth Climate March', 'Once a year, students from across Grand Cayman march for the climate.'],
];

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.error('Run: npm install --no-save playwright-core'); process.exit(1); }

const candidates = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const executablePath = candidates.find((p) => fs.existsSync(p));
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
fs.mkdirSync(`${root}/public/og`, { recursive: true });
for (const [name, title, sub] of images) {
  await page.goto(tpl);
  await page.evaluate(({ title, sub }) => {
    document.getElementById('title').textContent = title;
    document.getElementById('sub').textContent = sub;
    document.getElementById('sheet').classList.toggle('long', title.length > 30);
  }, { title, sub });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${root}/public/og/${name}.png` });
  console.log(`public/og/${name}.png`);
}
await browser.close();
