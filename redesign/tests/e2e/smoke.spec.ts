// Smoke: app boots offline with the seed, lands on Home with seeded data, zero console errors,
// zero page errors, zero unrouted external requests.
import { test, expect } from '@playwright/test';
import { seedStorage, routeNetwork, collectConsoleErrors, gotoApp, HOME_READY } from '../fixtures/index.mjs';

// Errors inherent to the current app (not the harness). Each entry needs a reason. Keep empty if possible.
const ALLOWED_CONSOLE_ERRORS: (string | RegExp)[] = [];

test.describe('smoke', () => {
  test('boots to Home with seeded data and no errors', async ({ page }) => {
    const errors = collectConsoleErrors(page, { allow: ALLOWED_CONSOLE_ERRORS });
    const net = await routeNetwork(page);
    const seed = await seedStorage(page);
    await gotoApp(page);

    // Home is the active tab
    const active = page.locator(HOME_READY);
    await expect(active).toHaveAttribute('aria-label', /^Home/);

    // Seeded profile name and data are visible
    await expect(page.getByText('Cesco', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Recent Workouts')).toBeVisible();
    const history = JSON.parse(seed.lk_history);
    await expect(page.getByText(history[0].name, { exact: true }).first()).toBeVisible(); // "PPL - Legs" (yesterday)
    // the next split day card comes from splits[0].days[0] (page-map 2.1 P, source L18057)
    await expect(page.getByText(/Push/).first()).toBeVisible();

    // No auth overlay, onboarding, tutorial or resume dialog
    await expect(page.locator('#locked-auth-overlay')).toHaveCount(0);
    await expect(page.getByText('GET STARTED')).toHaveCount(0);
    await expect(page.getByText('Skip tutorial')).toHaveCount(0);
    await expect(page.getByText('Resume Workout?')).toHaveCount(0);

    // Storage untouched by migrations in ways that change the seed
    const stored = await page.evaluate(() => ({
      guest: localStorage.getItem('lk_guestMode'),
      profile: JSON.parse(localStorage.getItem('lk_profile') || 'null'),
      unit: localStorage.getItem('lk_weightStorageUnit'),
      histLen: JSON.parse(localStorage.getItem('lk_history') || '[]').length,
      prKeys: Object.keys(JSON.parse(localStorage.getItem('lk_prs') || '{}')).length,
    }));
    expect(stored.guest).toBe('1');
    expect(stored.profile.displayName).toBe('Cesco');
    expect(stored.unit).toBe('"kg"');
    expect(stored.histLen).toBe(history.length);
    expect(stored.prKeys).toBe(Object.keys(JSON.parse(seed.lk_prs)).length);

    // let late effects (deploy check, migrations, feed) run
    await page.waitForTimeout(1500);

    // Network: every external request was routed; nothing unexpected
    const kinds = net.calls.map(c => c.kind);
    expect(kinds).toContain('app-version');
    expect(net.unexpected, 'unexpected external requests: ' + JSON.stringify(net.unexpected)).toEqual([]);

    // Zero console errors and zero page errors
    expect(errors, 'console/page errors: ' + JSON.stringify(errors, null, 2)).toEqual([]);
  });

  test('coach chat round-trips through the routed worker', async ({ page }) => {
    const { COACH } = await import('../fixtures/index.mjs');
    const errors = collectConsoleErrors(page, { allow: ALLOWED_CONSOLE_ERRORS });
    const net = await routeNetwork(page);
    await seedStorage(page, { lk_coachLastMsgs: [], lk_coachLastHist: [] });
    await gotoApp(page);
    await page.click('nav[aria-label="Main navigation"] button[aria-label^="Coach"]');
    await page.fill('[aria-label="Ask your coach"]', 'How should I progress bench?');
    await page.click('button[aria-label="Send message to coach"]');
    const expected = COACH.replies[COACH.mapping.keywords.bench].content[0].text;
    await expect(page.getByText(expected)).toBeVisible();
    const msgs = await page.evaluate(() => JSON.parse(localStorage.getItem('lk_coachLastMsgs') || '[]'));
    expect(msgs.at(-1)).toMatchObject({ role: 'assistant', text: expected });
    expect(net.calls.filter(c => c.kind === 'coach')).toHaveLength(1);
    expect(net.unexpected).toEqual([]);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  test('empty state boots to Home without errors', async ({ page }) => {
    const { states } = await import('../fixtures/index.mjs');
    const errors = collectConsoleErrors(page, { allow: ALLOWED_CONSOLE_ERRORS });
    const net = await routeNetwork(page);
    await seedStorage(page, states.empty());
    await gotoApp(page);
    await expect(page.getByText(/first split/i).first()).toBeVisible();
    await page.waitForTimeout(800);
    expect(net.unexpected).toEqual([]);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });
});
