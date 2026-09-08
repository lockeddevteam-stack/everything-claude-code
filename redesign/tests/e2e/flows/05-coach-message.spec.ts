// Flow 5 — Send one coach message, receive reply (user-flows.md §Flow 5). Worker POST is routed to fixtures/coach-replies.json.
import { test, expect } from '@playwright/test';
import { boot, tap, runFlow, ls, navTab } from '../helpers';
import { COACH } from '../../fixtures/index.mjs';

test('flow 05: Coach → send message → routed reply', async ({ page }, testInfo) => {
  await runFlow(testInfo, page, { flow: 5, slug: 'coach-message', name: 'Coach message and reply', expectedTaps: 2 }, async () => {
    const booted = await boot(page, { lk_coachLastMsgs: [], lk_coachLastHist: [] });
    await tap(page, navTab('Coach'));
    await page.fill('[aria-label="Ask your coach"]', 'How should I progress bench?');   // typing = 0 taps
    await tap(page, 'button[aria-label="Send message to coach"]');

    const expected = COACH.replies[COACH.mapping.keywords.bench].content[0].text;
    await expect(page.getByText(expected)).toBeVisible();
    const msgs = await ls(page, 'lk_coachLastMsgs');
    expect(msgs.at(-2)).toMatchObject({ role: 'user', text: 'How should I progress bench?' });
    expect(msgs.at(-1)).toMatchObject({ role: 'assistant', text: expected });
    await expect(page.locator('button[aria-label="Send message to coach"]')).toBeVisible();
    await expect(page.locator('[aria-label="Ask your coach"]')).toHaveValue('');
    expect(booted.net.calls.filter(c => c.kind === 'coach')).toHaveLength(1);
    return { booted };
  });
});
