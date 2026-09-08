// Flow 4 — Home to one lift's progress chart (user-flows.md §Flow 4): Home → Progress → PR Vault → lift row → e1RM polyline.
import { test, expect } from '@playwright/test';
import { boot, tap, runFlow, ls } from '../helpers';

test('flow 04: Home → PR Vault → Barbell Bench Press chart', async ({ page }, testInfo) => {
  await runFlow(testInfo, page, { flow: 4, slug: 'home-to-chart', name: 'Home to lift chart', expectedTaps: 3 }, async () => {
    const booted = await boot(page);
    await tap(page, 'button:has-text("VIEW PROGRESS")');
    await expect(page.locator('h1:has-text("PROGRESS")')).toBeVisible();
    await tap(page, '[aria-label="Progress section"] button:has-text("PR Vault")');
    await expect(page.locator('h1:has-text("PR VAULT")')).toBeVisible();
    await tap(page, '[role=button]:has-text("Barbell Bench Press")');

    const chart = page.locator('svg polyline').first();
    await expect(chart).toBeVisible();
    await expect(page.getByText(/\d+ sessions/).first()).toBeVisible();
    await expect(page.getByText(/EST\. 1RM/i).first()).toBeVisible();
    expect(await ls(page, 'lk_ui_progressTab')).toBe('prs');
    const points = await chart.getAttribute('points');
    expect((points || '').trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
    return { booted, extra: { chartPoints: (points || '').trim().split(/\s+/).length } };
  });
});
