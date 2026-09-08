// Flow 3 — Finish workout, Review, save (user-flows.md §Flow 3). Prereq: active workout with ≥1 done set (states.activeWorkout).
import { test, expect } from '@playwright/test';
import { boot, tap, runFlow, ls, states, NAV } from '../helpers';

test('flow 03: Finish → Review → Save without reflection', async ({ page }, testInfo) => {
  await runFlow(testInfo, page, { flow: 3, slug: 'finish-review-save', name: 'Finish, Review, save', expectedTaps: 3, notes: '2 + Resume (boot via seeded active workout)' }, async () => {
    const booted = await boot(page, { ...states.activeWorkout(), lk_restEnabled: false }, { waitFor: 'text=Resume Workout?' });
    const before = (await ls(page, 'lk_history')).length;
    await tap(page, 'button:has-text("Resume"):not(:has-text("Resume Workout?"))');
    await expect(page.locator('button[aria-label="Workout tools"]')).toBeVisible();

    await tap(page, 'button:has-text("Finish")');
    await expect(page.getByText('WORKOUT COMPLETE')).toBeVisible();
    await tap(page, 'button:has-text("Save without reflection")');

    await expect(page.getByText('Saved').first()).toBeVisible();
    await expect(page.locator(`${NAV} button[aria-label^="Home"][aria-current="page"]`)).toBeVisible();
    const hist = await ls(page, 'lk_history');
    expect(hist.length).toBe(before + 1);
    expect(hist[0]).toMatchObject({ name: 'PPL - Push', sets: 2 });
    expect(hist[0].vol).toMatch(/^\d[\d.,]* kg$/);
    expect(hist[0].dur).toMatch(/min/);
    expect(hist[0].dateISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(hist[0].exercises[0].sets[0]).toMatchObject({ w: '72.5', r: '8', done: true });
    expect(await ls(page, 'lk_activeWorkout')).toBeNull();
    expect(await ls(page, 'lk_activeWorkoutRows')).toBeNull();
    return { booted };
  });
});
