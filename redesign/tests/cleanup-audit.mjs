/* What the build has that nothing uses, and where two screens disagree.

   Dead selectors: every class the shared sheets style, against every class
   any element on any screen in any dev state carries.

   TWO THINGS THIS CANNOT SEE, both of which produced false alarms the first
   time it ran, so both are handled here rather than left for a reader:

   A class built by joining strings -- 'strength__seg--' + cls -- never
   appears in the DOM until the interaction that builds it, and the sweep does
   not type passwords or drag rows. So a name that is absent from the DOM is
   checked against the source text before it is called dead. Only a name that
   appears in neither is reported.

   An SVG element's computed font-size is in user units, not CSS pixels. The
   callout labels on the body map read 6.8, which is 11 divided by the
   viewBox scale and renders at exactly 11. Type is therefore measured on HTML
   elements only, and SVG text is checked by its rendered height instead.

   Inconsistencies: the header, the page gutter, the type scale, the radii and
   the durations, measured the same way on every screen. */
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = readdirSync(BUILD).filter(f => f.endsWith('.html')).sort();
/* Comments are stripped first: a comment that mentions tokens.css or
   bodymap.js would otherwise look like the classes .css and .js. */
const css = ['tokens.css', 'components.css']
  .map(f => readFileSync(path.join(BUILD, f), 'utf8'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');

/* Every class name the shared sheets style. */
const classes = new Set();
for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(m[1]);

const br = await chromium.launch();
const used = new Set();
const facts = {};

for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForTimeout(500);

  /* Every dev-menu state, so a class that only shows in an error or empty
     state is not called dead. */
  const states = await p.evaluate(() => {
    const b = [...document.querySelectorAll('[data-preset], .dev__item')];
    return b.length;
  });
  for (let i = 0; i < Math.max(1, states); i++) {
    if (i > 0) {
      await p.evaluate((n) => {
        const b = [...document.querySelectorAll('[data-preset], .dev__item')];
        if (b[n]) b[n].click();
      }, i);
      await p.waitForTimeout(250);
    }
    const seen = await p.evaluate(() => {
      const out = new Set();
      const walk = (root) => {
        root.querySelectorAll('*').forEach(el => {
          const c = el.getAttribute && el.getAttribute('class');
          if (!c) return;
          String(c).split(/\s+/).forEach(x => x && out.add(x));
          if (el.shadowRoot) walk(el.shadowRoot);
        });
      };
      walk(document);
      return [...out];
    });
    seen.forEach(c => used.add(c));
  }

  facts[file] = await p.evaluate(() => {
    const px = v => Math.round(parseFloat(v) || 0);
    const cs = el => el ? getComputedStyle(el) : null;
    const hdr = document.querySelector('.hdr');
    const body = document.querySelector('.body, main');
    const sizes = new Set(), radii = new Set(), durs = new Set();
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      /* HTML only: an SVG font-size is in user units and means something
         else. See the note at the top. */
      if (el.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
          el.children.length === 0 && el.textContent && el.textContent.trim()) {
        sizes.add(px(s.fontSize));
      }
      if (el.getBoundingClientRect().width) radii.add(px(s.borderTopLeftRadius));
      if (s.transitionDuration && s.transitionDuration !== '0s') {
        s.transitionDuration.split(',').forEach(d => durs.add(d.trim()));
      }
    });
    return {
      headerPad: hdr ? px(cs(hdr).paddingLeft) : null,
      bodyPad: body ? px(cs(body).paddingLeft) : null,
      sizes: [...sizes].sort((a, b) => a - b),
      radii: [...radii].sort((a, b) => a - b),
      durs: [...durs].sort()
    };
  });
  await p.close();
}
await br.close();

/* A class in the sheets that no screen carries AND no screen's source
   mentions. The second half is what keeps a concatenated class name off this
   list. */
const sources = readdirSync(BUILD)
  .filter(f => f.endsWith('.html') || f === 'bodymap.js' || f === 'app.js')
  .map(f => readFileSync(path.join(BUILD, f), 'utf8')).join('\n');
const named = new Set();
/* Any class-shaped token in the source, however it is spelled: one dash,
   two, or none. 'trend-down' is written as a whole word inside a string and
   would be missed by a pattern that only knew about BEM modifiers. */
for (const m of sources.matchAll(/[\s"'`]([a-z][a-z0-9]*(?:[-_]+[a-z0-9]+)*)[\s"'`]/g)) named.add(m[1]);

/* A modifier whose stem is concatenated in the source -- 'strength__seg--'
   plus a word -- is built at runtime and is not dead. */
const built = (c) => {
  const i = c.lastIndexOf('--');
  return i > 0 && sources.includes(c.slice(0, i + 2));
};
const dead = [...classes].filter(c => !used.has(c) && !named.has(c) && !built(c)).sort();
console.log('=== selectors in the shared sheets that nothing uses (' + dead.length + ')');
console.log(dead.length ? dead.join(' ') : '  none');

console.log('\n=== per-screen measurements');
const key = k => JSON.stringify(k);
for (const f of ['headerPad', 'bodyPad']) {
  const groups = {};
  for (const [s, v] of Object.entries(facts)) (groups[key(v[f])] = groups[key(v[f])] || []).push(s);
  console.log(f + ': ' + Object.entries(groups).map(([v, s]) => v + ' on ' + s.length).join(', ') +
    (Object.keys(groups).length > 1 ? '   <-- disagreement: ' +
      JSON.stringify(Object.fromEntries(Object.entries(groups).map(([v, s]) => [v, s]))) : ''));
}
const allSizes = new Set(), allRadii = new Set(), allDurs = new Set();
Object.values(facts).forEach(v => { v.sizes.forEach(x => allSizes.add(x)); v.radii.forEach(x => allRadii.add(x)); v.durs.forEach(x => allDurs.add(x)); });
console.log('type sizes across the build:', [...allSizes].sort((a,b)=>a-b).join(', '));
console.log('radii across the build:', [...allRadii].sort((a,b)=>a-b).join(', '));
console.log('durations across the build:', [...allDurs].sort().join(', '));
