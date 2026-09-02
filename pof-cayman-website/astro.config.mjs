import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

// Canonical domain. Both retired domains 301 here (see public/_redirects).
const SITE = 'https://protectourfuturecayman.org';

// Past events stay reachable (and noindexed) but leave the sitemap on their own.
function pastEventIds() {
  const dir = path.resolve('./src/content/events');
  const today = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
  const ids = new Set();
  if (!fs.existsSync(dir)) return ids;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md') || f.startsWith('_')) continue;
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const end = src.match(/^endDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
    const start = src.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
    if ((end ?? start ?? '9999') < today) ids.add(f.replace(/\.md$/, ''));
  }
  return ids;
}
const past = pastEventIds();

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      filter: (page) => {
        const p = new URL(page).pathname;
        if (p === '/404' || p === '/events/archive') return false;
        const id = p.match(/^\/events\/(.+)$/)?.[1];
        return !(id && past.has(id));
      },
    }),
  ],
  prefetch: false,
});
