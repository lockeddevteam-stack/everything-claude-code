// Flow 6 — Edit a split, start it (user-flows.md §Flow 6): Train → Edit → rename → SAVE SPLIT → Start → day row → WorkoutLog.
import { test, expect } from '@playwright/test';
import { boot, tap, runFlow, ls, navTab } from '../helpers';

test('flow 06: edit split (rename) → save → start first day', async ({ page }, testInfo) => {
  await runFlow(testInfo, page, { flow: 6, slug: 'edit-split-start', name: 'Edit split and start', expectedTaps: 5 }, async () => {
    const booted = await boot(page, { lk_restEnabled: false });
    const splits = JSON.parse(booted.seed.lk_splits);
    const target = splits[0];
    const day = target.days[0];

    await tap(page, navTab('Train'));
    await expect(page.locator('h1:has-text("TRAIN")')).toBeVisible();
    // first split card footer: Start | Edit | Delete
    await tap(page, 'button:has-text("Edit")');
    await expect(page.locator('h1:has-text("Edit Split")')).toBeVisible();
    await page.fill('input[placeholder="Split name (e.g. Push Pull Legs)"]', 'PPL v2');   // typing = 0 taps
    await tap(page, 'button:has-text("SAVE SPLIT")');
    await expect(page.locator('h1:has-text("TRAIN")')).toBeVisible();
    await expect(page.getByText('PPL v2').first()).toBeVisible();

    await tap(page, 'button:text-is("Start")');
    await expect(page.getByText('Choose a day to start')).toBeVisible();
    await tap(page, `[role=button]:has-text("${day.name}")`);

    await expect(page.locator(`h2:has-text("PPL v2 - ${day.name}")`)).toBeVisible();
    const saved = (await ls(page, 'lk_splits')).find((s: { id: string }) => s.id === target.id);
    expect(saved.name).toBe('PPL v2');
    expect(saved.days[0]).toMatchObject({ name: day.name, exIds: day.exIds });
    const active = await ls(page, 'lk_activeWorkout');
    expect(active.name).toBe(`PPL v2 - ${day.name}`);
    expect(active.exIds).toEqual(day.exIds);
    expect(await page.locator('button[aria-label="Set 1 weight"]').count()).toBeGreaterThanOrEqual(day.exIds.length);
    return { booted, extra: { split: target.id, day: day.name } };
  });
});
