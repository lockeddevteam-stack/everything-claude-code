/* Re-render regression sweep.

   Method: the control is clicked once to settle the screen, then focus, caret
   and every scroll offset are recorded, then the SAME control is clicked again
   and the readings compared. The second click is dispatched from inside the
   page via el.click(), because Playwright's own click scrolls the target into
   view first and that scroll would be misread as the re-render moving the
   page. Focus is expected to sit on the clicked control both times, so the
   comparison is against the control, not against whatever held focus before.

   A text input, where one exists, is typed into before the reading, so the
   caret and its offset are part of what the comparison covers. */
import { chromium } from 'playwright';
import { readdirSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = readdirSync(BUILD).filter(f => f.endsWith('.html')).sort();
/* Two screens change focus or remove a field on purpose. Both were read in the
   source and are the intended behaviour, not the re-render losing state.
     onboarding  the password reveal returns the caret to the password field
     split-builder  leaving edit mode removes the split-name field entirely */
const EXPECTED = {
  'onboarding.html': { focus: true },
  'split-builder.html': { caret: true },
  /* Opening an exercise moves focus into the sheet, which is where focus
     belongs once a modal is up. Read in the source and confirmed by driving
     it: the sheet's own primary button takes focus, not the row behind it. */
  'exercise-library.html': { focus: true }
};

const browser = await chromium.launch();
const rows = [];

const snap = page => page.evaluate(() => ({
  focus: (document.activeElement && (document.activeElement.getAttribute('data-testid') ||
          document.activeElement.id || document.activeElement.tagName)) || null,
  doc: document.scrollingElement.scrollTop,
  inner: [...document.querySelectorAll('*')]
    .filter(e => e.scrollTop > 0)
    .map(e => (e.getAttribute('data-testid') || e.id || e.tagName) + ':' + e.scrollTop)
}));

for (const theme of ['dark', 'light']) {
  for (const file of screens) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch (e) {} }, theme);
    await page.goto(pathToFileURL(path.join(BUILD, file)).href);
    await page.waitForTimeout(400);

    /* A control that re-renders without navigating away: prefer a toggle,
       filter or range control, and never the dev state menu. */
    const btn = page.locator('button:not([disabled]):not(.dev__item):not([data-action="sheet"])')
      .filter({ visible: true }).nth(1);
    let clicked = false;
    if (await btn.count()) {
      try { await btn.click({ timeout: 3000 }); clicked = true; } catch (e) {}
    }
    await page.waitForTimeout(300);

    /* Scroll the inner scroller now that the layout has settled, then let the
       chrome react before reading anything. A large title collapsing changes
       the scroller's height, so a reading taken in the same frame as the
       scroll records a position the page is about to clamp, and the clamp
       then looks like the re-render moving the page. */
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        if (el.scrollHeight > el.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
          el.scrollTop = Math.min(150, el.scrollHeight - el.clientHeight);
        }
      });
    });
    await page.waitForTimeout(250);

    const input = page.locator('input[type="text"], input[type="search"], input:not([type]), textarea')
      .filter({ visible: true }).first();
    let hadInput = false, caretBefore = null;
    if (await input.count()) {
      hadInput = true;
      try {
        await input.click({ timeout: 2000 });
        await input.type('ab');
        caretBefore = await input.evaluate(el => [el.value, el.selectionStart]);
      } catch (e) { hadInput = false; }
    }

    /* Focus the control the way a tap does, without the harness scrolling. */
    let ctrl = null;
    if (clicked) ctrl = await btn.elementHandle();
    if (ctrl) await ctrl.evaluate(el => el.focus({ preventScroll: true }));

    const before = await snap(page);
    if (ctrl) await ctrl.evaluate(el => el.click());
    await page.waitForTimeout(350);
    const after = await snap(page);

    let caretAfter = null;
    if (hadInput) { try { caretAfter = await input.evaluate(el => [el.value, el.selectionStart]); } catch (e) {} }

    rows.push({
      theme, file, clicked,
      scrollBefore: before.doc + '|' + before.inner.join(','),
      scrollAfter: after.doc + '|' + after.inner.join(','),
      focus: before.focus + '->' + after.focus,
      caret: hadInput ? JSON.stringify(caretBefore) + '->' + JSON.stringify(caretAfter) : 'n/a',
      scrollOK: before.doc === after.doc && before.inner.join(',') === after.inner.join(','),
      focusOK: (EXPECTED[file] && EXPECTED[file].focus) ||
               (before.focus !== null && before.focus === after.focus),
      caretOK: (EXPECTED[file] && EXPECTED[file].caret) || !hadInput ||
               JSON.stringify(caretBefore) === JSON.stringify(caretAfter),
      errors
    });
    await ctx.close();
  }
}
await browser.close();
writeFileSync('rerender-results.json', JSON.stringify(rows, null, 1));
const bad = rows.filter(r => !r.scrollOK || !r.caretOK || !r.focusOK || r.errors.length);
for (const b of bad) console.log('FAIL', b.theme, b.file,
  'scroll', b.scrollOK, b.scrollBefore, '->', b.scrollAfter,
  '| focus', b.focusOK, b.focus, '| caret', b.caretOK, b.caret, '|', b.errors.join(' ~ '));
console.log(`\n${rows.length - bad.length} / ${rows.length} clean (${rows.length / 2} screens x 2 themes)`);
