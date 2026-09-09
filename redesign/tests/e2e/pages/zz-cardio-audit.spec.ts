import { test } from '@playwright/test';
import { boot, tap, tapCount, resetTaps, navTab, SHELL } from '../helpers';

test('cardio fav path', async ({ page }) => {
  await boot(page, {});
  const t0 = Date.now();
  await tap(page, navTab('Train'));
  await tap(page, 'button:has-text("Cardio")');
  await page.waitForSelector('h1:has-text("CARDIO")');
  resetTaps(page);
  await tap(page, '[aria-label="Log Treadmill run"]');
  await page.waitForTimeout(400);
  const afterFav = (await page.locator(SHELL).innerText()).slice(0,120);
  await tap(page, 'button:has-text("30")');
  await tap(page, 'button:has-text("Save session")');
  await page.waitForTimeout(500);
  const summary = (await page.locator(SHELL).innerText()).slice(0,400);
  const tapsToSave = tapCount(page);
  await tap(page, 'button:has-text("Done")');
  await page.waitForTimeout(500);
  const afterDone = (await page.locator(SHELL).innerText()).slice(0,300);
  console.log('AUDIT_B ' + JSON.stringify({ afterFav, summary, tapsToSave, tapsTotal: tapCount(page), ms: Date.now()-t0, afterDone }));
  await page.screenshot({ path: '/tmp/claude-0/scratch-res/cardio-after-done.png' });
});

test('cardio browse path', async ({ page }) => {
  await boot(page, {});
  await tap(page, navTab('Train'));
  await tap(page, 'button:has-text("Cardio")');
  await page.waitForSelector('h1:has-text("CARDIO")');
  resetTaps(page);
  await tap(page, 'button:has-text("Log")');
  await tap(page, 'button:has-text("Treadmill run")');
  await page.waitForTimeout(300);
  await tap(page, 'button:has-text("Skip")');
  await page.waitForTimeout(300);
  await tap(page, 'button:has-text("30")');
  await tap(page, 'button:has-text("Save session")');
  await page.waitForTimeout(400);
  const n = tapCount(page);
  await tap(page, 'button:has-text("Done")');
  await page.waitForTimeout(400);
  console.log('AUDIT_C ' + JSON.stringify({ tapsToSave: n, total: tapCount(page), after: (await page.locator(SHELL).innerText()).slice(0,200) }));
});

test('save with no duration', async ({ page }) => {
  await boot(page, {});
  await tap(page, navTab('Train'));
  await tap(page, 'button:has-text("Cardio")');
  await tap(page, '[aria-label="Log Treadmill run"]');
  await page.waitForTimeout(400);
  const btn = page.locator(`${SHELL} button:has-text("Save session")`).first();
  console.log('AUDIT_D ' + JSON.stringify({ disabled: await btn.isDisabled(), opacity: await btn.evaluate(e=>getComputedStyle(e).opacity) }));
});
