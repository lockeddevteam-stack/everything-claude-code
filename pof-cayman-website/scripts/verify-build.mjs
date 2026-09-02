/*
  Checks every built page for the things that quietly break trust:
  one h1, headings in order, canonical + unique title/description/OG,
  no #000/#FFF, no broken internal links, forms have honeypots, and
  no events older than today survive the build.
  Run after `npm run build`: `npm run verify`.
*/
import fs from 'node:fs';
import path from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(DIST);

const problems = [];
const titles = new Map(), descs = new Map();
const attr = (html, re) => (html.match(re) || [])[1];

for (const file of files) {
  const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) problems.push(`${rel}: ${h1s} <h1> elements`);

  // heading order: never skip a level going down
  let last = 1;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(m[1]);
    if (lvl > last + 1) problems.push(`${rel}: heading jumps from h${last} to h${lvl}`);
    last = lvl;
  }

  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  if (!title) problems.push(`${rel}: missing <title>`);
  if (!desc) problems.push(`${rel}: missing meta description`);
  if (!canonical) problems.push(`${rel}: missing canonical`);
  if (!/property="og:image"/.test(html)) problems.push(`${rel}: missing og:image`);
  if (!/name="twitter:card"/.test(html)) problems.push(`${rel}: missing twitter card`);
  if (title) { if (titles.has(title)) problems.push(`${rel}: duplicate title with ${titles.get(title)}`); titles.set(title, rel); }
  if (desc) { if (descs.has(desc)) problems.push(`${rel}: duplicate description with ${descs.get(desc)}`); descs.set(desc, rel); }
  if (title && title.length > 70) problems.push(`${rel}: title over 70 chars (${title.length})`);
  if (desc && desc.length > 165) problems.push(`${rel}: description over 165 chars (${desc.length})`);

  if (/#000\b|#fff\b|#000000|#ffffff/i.test(html)) problems.push(`${rel}: pure black or white in inline CSS`);
  if (/<img(?![^>]*\balt=)/i.test(html)) problems.push(`${rel}: <img> without alt`);

  for (const m of html.matchAll(/<form[^>]*>/g)) {
    const formEnd = html.indexOf('</form>', m.index);
    const form = html.slice(m.index, formEnd);
    if (!/_gotcha|b_honeypot/.test(form)) problems.push(`${rel}: form without honeypot`);
    if (/action="mailto:/.test(form) && !/data-mode="mailto"/.test(form)) problems.push(`${rel}: mailto form not marked as fallback`);
  }

  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1];
    if (href.startsWith('/fonts/') || href.startsWith('/press/') || href.startsWith('/og/') || href === '/sitemap-index.xml' || href === '/') continue;
    const candidates = [href, href + '.html', href + '/index.html'].map((h) => path.join(DIST, h));
    if (!candidates.some((c) => fs.existsSync(c))) problems.push(`${rel}: broken internal link ${href}`);
  }

  const today = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
  for (const m of html.matchAll(/data-event-date="([^"]+)"/g)) {
    if (m[1] < today && !rel.includes('archive')) problems.push(`${rel}: past event ${m[1]} still rendered as upcoming`);
  }
}

for (const f of ['_redirects', '_headers', 'robots.txt', 'sitemap-index.xml', 'favicon.svg', 'og/default.png', 'fonts/BricolageGrotesque.woff2', 'press/pof-wordmark-ocean.svg']) {
  if (!fs.existsSync(path.join(DIST, f))) problems.push(`dist/${f} missing`);
}
const redirects = fs.readFileSync(path.join(DIST, '_redirects'), 'utf8');
for (const d of ['pofcaribbean.org', 'protectourfuture-eco.com']) if (!redirects.includes(d)) problems.push(`_redirects lacks 301 for ${d}`);

// CSS checks on the built stylesheet(s)
const cssFiles = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.css') && cssFiles.push(p); } })(DIST);
const css = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n') + files.map((f) => (fs.readFileSync(f, 'utf8').match(/<style>[\s\S]*?<\/style>/g) || []).join('\n')).join('\n');
if (/font-family:[^;]*\bInter\b/i.test(css)) problems.push('CSS uses Inter');
if (/fonts\.googleapis\.com/.test(css) || files.some((f) => /fonts\.googleapis\.com/.test(fs.readFileSync(f, 'utf8')))) problems.push('Google Fonts API referenced at runtime');

console.log(`${files.length} pages checked`);
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
console.log('All checks passed.');
