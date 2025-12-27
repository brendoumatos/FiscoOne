import { test, expect } from '@playwright/test';
import { fetchPlanState, forceUsageLimit, issueInvoiceExpectingBlocked } from './utils/backend';
import { assertPlanShieldMatches } from './utils/ui';

const PATH = '/dashboard/settings';

test.describe('Settings screen', () => {
  test('PlanShield matches backend and blocked action returns 403', async ({ page }) => {
    await forceUsageLimit('INVOICES');
    const plan = await fetchPlanState();

    await page.goto(PATH);
    await assertPlanShieldMatches(page, plan);

    const res = await issueInvoiceExpectingBlocked();
    if (res.status() !== 403) {
      throw new Error('UI_BYPASS_DETECTED');
    }
    const body = await res.json();
    expect(body.error).toBe('PLAN_BLOCKED');
  });
});
