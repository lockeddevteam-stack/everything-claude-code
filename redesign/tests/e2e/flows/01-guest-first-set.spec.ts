// Flow 1 — Guest start to first logged set (user-flows.md §Flow 1).
// 1A: true cold start through the DOM auth overlay + guest modal + tutorial (16 taps expected, +1 tutorial skip).
// 1B: seeded guest (Global preconditions) → 14 taps expected.
import { test, expect } from '@playwright/test';
import { boot, tap, tapCount, runFlow, numpadType, numpadDone, states, ls, HOME_READY, SHEET_ROOT } from '../helpers';

async function quickStartToFirstSet(page: import('@playwright/test').Page) {
  // 3. START WORKOUT (Home start block)
  await tap(page, 'button:has-text("START WORKOUT")');
  await expect(page.locator('h1:has-text("TRAIN")')).toBeVisible();
  // 4. Quick Start
  await tap(page, 'button:has-text("Quick Start")');
  await expect(page.getByText('No exercises yet')).toBeVisible();
  // 5. Add Exercise → ExLib picker
  await tap(page, 'button:has-text("Add Exercise")');
  await page.fill('input[placeholder="Search all exercises..."]', 'Bench');            // typing = 0 taps
  // 6. exercise row → detail sheet
  await tap(page, 'button:has-text("Barbell Bench Press")');
  // 7. ADD TO WORKOUT
  await tap(page, 'button:has-text("ADD TO WORKOUT")');
  await expect(page.locator('button[aria-label="Set 1 weight"]')).toBeVisible();
  // 8-12. weight 100 via NumPad
  await tap(page, 'button[aria-label="Set 1 weight"]');
  await expect(page.locator(`${SHEET_ROOT} [role=group][aria-label="Weight entry"]`)).toBeVisible();
  await numpadType(page, '100');
  await numpadDone(page);
  // 13-15. reps 8
  await tap(page, 'button[aria-label="Set 1 reps"]');
  await numpadType(page, '8');
  await numpadDone(page);
  // 16. mark done
  await tap(page, 'button[aria-label="Mark set 1 done"]');
  await expect(page.locator('button[aria-label="Undo set 1 done"]')).toBeVisible();
}

async function assertFirstSet(page: import('@playwright/test').Page) {
  await expect(page.locator('button[aria-label="Set 1 weight"]')).toHaveText('100');
  await expect(page.locator('button[aria-label="Set 1 reps"]')).toHaveText('8');
  const rows = await ls(page, 'lk_activeWorkoutRows');
  expect(rows[0].sets[0]).toMatchObject({ w: '100', r: '8', done: true });
  const active = await ls(page, 'lk_activeWorkout');
  expect(active).toMatchObject({ name: 'Quick Workout' });
  const prs = await ls(page, 'lk_prs');
  const pr = prs[String(rows[0].id)] || prs[rows[0].id];
  expect(pr, 'PR written for the exercise (L10770)').toBeTruthy();
  expect(pr[pr.length - 1]).toMatchObject({ r: 8, w: 100 });
  // unit column header must follow the profile unit (useKg:true → KG) — row.kg is null for app-created rows (L10109)
  await expect.soft(page.locator('[data-exrow]').first().getByText('KG', { exact: true }).first(), 'set table unit header').toBeVisible();
}

test.describe('flow 01 guest → first logged set', () => {
  test('1A cold start: auth overlay → guest → tutorial → Quick Start → first set', async ({ page }, testInfo) => {
    await runFlow(testInfo, page, { flow: 1, slug: 'guest-first-set', name: '1A cold start (overlay + tutorial)', expectedTaps: 17, notes: '16 per user-flows +1 Skip tutorial (2b); the guest seed has no lk_tutorialSeen' }, async () => {
      const booted = await boot(page, { ...states.coldStart(), lk_restEnabled: false }, { raw: true });
      // 1. Continue without account (pure-DOM overlay, appears once supabase getSession resolves)
      await tap(page, '#locked-auth-overlay button:has-text("Continue without account")', { timeout: 15000 });
      // 2. CONTINUE AS GUEST → enterGuestMode → reload
      await tap(page, '#locked-guest-modal button:has-text("CONTINUE AS GUEST")');
      await page.waitForSelector(HOME_READY, { state: 'visible', timeout: 20000 });
      // 2b. tutorial appears for a fresh guest (L57219)
      const skip = page.locator('button:has-text("Skip tutorial")');
      const tutorialShown = await skip.isVisible({ timeout: 4000 }).catch(() => false);
      if (tutorialShown) await tap(page, skip);
      await expect(page.getByText('TOTAL WORKOUTS')).toBeVisible();
      const tapsBeforeWorkout = tapCount(page);
      await quickStartToFirstSet(page);
      await assertFirstSet(page);
      const prof = await ls(page, 'lk_profile');
      expect(prof.displayName).toBe('Athlete'); // guest seed (L172)
      return { booted, extra: { tutorialShown, onboardingTaps: tapsBeforeWorkout, tapsWithoutOnboarding: tapCount(page) - tapsBeforeWorkout } };
    });
  });

  test('1B seeded guest: Home → Quick Start → first set', async ({ page }, testInfo) => {
    await runFlow(testInfo, page, { flow: 1, slug: 'guest-first-set', name: '1B seeded guest (no overlay/tutorial)', expectedTaps: 14 }, async () => {
      const booted = await boot(page, { ...states.emptyTraining(), lk_restEnabled: false });
      await quickStartToFirstSet(page);
      await assertFirstSet(page);
      return { booted };
    });
  });
});
