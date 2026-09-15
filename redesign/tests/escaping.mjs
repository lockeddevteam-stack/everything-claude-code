/* THE ESCAPE THAT HAS TO BE REMEMBERED EVERY TIME.

   hostile-text.mjs proves the app is safe in the states it can reach.
   It cannot reach every state: a name only shown inside a sheet that
   opens three taps deep, or in a picker that appears once a second
   split exists, is not visited by any seed somebody thought to write.
   Two of the five unescaped sites in this build were found that way and
   three were not -- they were found by reading, afterwards.

   So this reads. It is a static check over the screen sources for a
   person's own text concatenated into HTML without esc() around it, and
   it exists because the failure it catches is silent: nothing throws, a
   screen renders, and the app runs somebody else's script as the reader.

   It is deliberately narrow. Only fields a person types are listed, and
   only when the same line is building markup -- a name going into say()
   or a toast is text, and escaping it there would print &amp; at the
   reader. A false alarm here is a real cost, because a guard that cries
   wolf gets switched off. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, '08-build');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* The fields a person can put anything into. Not `label`, `title` or
   `id`: in this build those are the app's own words nearly everywhere,
   and listing them buries the real finding in noise. */
const TYPED = ['name', 'itemName', 'displayName', 'username', 'note', 'notes', 'text'];

/* `<thing>.field` added to a string, with no esc( anywhere before it on
   the line. */
const RISK = new RegExp(
  "\\+\\s*[A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z0-9_]+)*\\.(?:" + TYPED.join('|') + ")\\s*\\+",
  'g');

const files = (await readdir(BUILD)).filter((f) => f.endsWith('.html') && !f.startsWith('mockup-'));
const hits = [];

for (const f of files) {
  const src = await readFile(path.join(BUILD, f), 'utf8');
  src.split('\n').forEach((line, i) => {
    RISK.lastIndex = 0;
    let m;
    while ((m = RISK.exec(line)) !== null) {
      /* Building markup, not speaking. A line with no angle bracket and
         no class attribute on it is a sentence, not an element. */
      if (!/[<]|class=|aria-|data-testid/.test(line)) continue;
      /* ICO.note is an icon: raw SVG the app wrote, which MUST NOT be
         escaped or the reader gets angle brackets instead of a glyph.
         The field name collides with a typed one; the object it hangs
         off does not. */
      if (/^\+\s*ICO\./.test(m[0])) continue;
      /* Already escaped: esc(...) wrapping this very expression. */
      const expr = m[0].replace(/^\+\s*|\s*\+$/g, '');
      if (new RegExp('esc\\(\\s*' + expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(line)) continue;
      if (line.indexOf('esc(' + expr) > -1) continue;
      hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 110)}`);
    }
  });
}

console.log('=== a person\'s own text, concatenated into markup ===\n');
if (hits.length) hits.forEach((h) => console.log('   ' + h));
ok(files.length > 10, 'every screen source was read', files.length + ' files');
ok(hits.length === 0,
   'and none of it reaches innerHTML without esc() around it',
   hits.length + ' site' + (hits.length === 1 ? '' : 's'));

console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
