// Flow 2 — Log one set: weight, reps, RIR (user-flows.md §Flow 2). Entry via seeded lk_activeWorkout → Resume (+1 tap).
import { test, expect } from '@playwright/test';
import { boot, tap, runFlow, numpadType, numpadDone, numpadClear, numpadValue, ls, SHEET_ROOT } from '../helpers';

test('flow 02: log one set (weight, reps, RIR, done)', async ({ page }, testInfo) => {
  await runFlow(testInfo, page, { flow: 2, slug: 'log-set', name: 'Log one set', expectedTaps: 10, notes: '9 + Resume per user-flows; RIR is a native <select> (0 Playwright taps). Extra taps = NumPad del presses needed to clear the pre-filled recommendation.' }, async () => {
    // fresh rows: mkRow pre-fills from history (rec:true) so cells show recommendations, not --
    const booted = await boot(page, { lk_activeWorkout: { name: 'Push A', exIds: [111], blocks: [] }, lk_restEnabled: false }, { waitFor: 'text=Resume Workout?' });
    await tap(page, 'button:has-text("Resume"):not(:has-text("Resume Workout?"))');
    await expect(page.locator('button[aria-label="Workout tools"]')).toBeVisible();

    await tap(page, '[data-exrow] button[aria-label="Set 1 weight"]');
    await expect(page.locator(`${SHEET_ROOT} [role=group][aria-label="Weight entry"]`)).toBeVisible();
    // the pad opens pre-filled with the recommendation from the last session; digits append, so clear first
    const prefilledW = await numpadValue(page);
    const clearW = await numpadClear(page);
    await numpadType(page, '100');
    await numpadDone(page);
    await tap(page, '[data-exrow] button[aria-label="Set 1 reps"]');
    await expect(page.locator(`${SHEET_ROOT} [role=group][aria-label="Reps entry"]`)).toBeVisible();
    const prefilledR = await numpadValue(page);
    const clearR = await numpadClear(page);
    await numpadType(page, '8');
    await numpadDone(page);
    await page.selectOption('[data-exrow] select[aria-label="Set 1 reps in reserve"]', '1');   // 0 taps in Playwright
    await tap(page, '[data-exrow] button[aria-label="Mark set 1 done"]');

    await expect(page.locator('button[aria-label="Undo set 1 done"]').first()).toBeVisible();
    const rows = await ls(page, 'lk_activeWorkoutRows');
    // setType is inherited from the last session's set 1 (a warm-up in the seed), so it is recorded, not asserted
    expect(rows[0].sets[0]).toMatchObject({ w: '100', r: '8', rir: '1', done: true, rec: false, partials: '', rL: '', rR: '' });
    // header totalSets (L11945) counts done working sets; a done warm-up (inherited setType) reads "0 sets"
    const header = page.getByText(/^\d+ sets?$/).first();
    await expect(header).toBeVisible();
    const headerSets = (await header.innerText()).trim();
    if (rows[0].sets[0].setType === 'normal') expect(headerSets).toBe('1 set');
    return { booted, extra: { prefilled: { w: prefilledW, r: prefilledR }, clearTaps: clearW + clearR, setType: rows[0].sets[0].setType, headerSets } };
  });
});
