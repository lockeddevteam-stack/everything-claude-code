// Flow 7 — Add a shopping item, open Budget (user-flows.md §Flow 7): Fuel → shop icon → type → ADD TO LIST → Budget tab.
import { test, expect } from '@playwright/test';
import { boot, tap, runFlow, ls, navTab } from '../helpers';

test('flow 07: Fuel → Shop → add item → Budget', async ({ page }, testInfo) => {
  await runFlow(testInfo, page, { flow: 7, slug: 'shopping-budget', name: 'Add shopping item, open Budget', expectedTaps: 4, notes: 'lk_myStores emptied so typing stays offline (README quirk)' }, async () => {
    const booted = await boot(page, { lk_myStores: [] });
    const before = (await ls(page, 'lk_shoppingList')).length;
    await tap(page, navTab('Fuel'));
    await tap(page, 'button[aria-label="Shopping and budget"]');
    await expect(page.getByText('SHOP & BUDGET')).toBeVisible();
    await page.fill('input[placeholder="e.g. Chicken Breast"]', 'Chicken Breast');   // typing = 0 taps
    await tap(page, 'button:has-text("ADD TO LIST")');
    await expect(page.getByText('Chicken Breast', { exact: false }).first()).toBeVisible();
    const list = await ls(page, 'lk_shoppingList');
    expect(list.length).toBe(before + 1);
    const added = list[list.length - 1];
    expect(added.itemName).toBe('Chicken Breast');
    expect(added.checked).toBe(false);

    await tap(page, '[aria-label="Shopping section"] button:has-text("Budget")');
    await expect(page.getByText('WEEKLY BUDGET')).toBeVisible();
    expect(await ls(page, 'lk_ui_shopTab')).toBe('budget');
    return { booted };
  });
});
