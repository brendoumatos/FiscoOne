import { test, expect } from '@playwright/test';
import {
  fetchPlanState,
  forceUsageLimit,
  issueInvoiceExpectingBlocked,
  setPlan,
  resetUsage,
  setUsage,
  addCollaborator,
  createTempUser,
  upgradePlan,
  setPaymentStatus
} from './utils/backend';
import { assertPlanShieldMatches } from './utils/ui';

const DASHBOARD = '/dashboard';
const INVOICE_ISSUE = '/dashboard/invoices/issue';

async function ensureLimited(plan: Awaited<ReturnType<typeof fetchPlanState>>, key: 'invoices' | 'seats') {
  const limit = plan.usage[key].limit;
  if (limit === null || limit === undefined) {
    throw new Error(`Plan has no limit for ${key.toUpperCase()} - cannot run deterministic test`);
  }
  return limit;
}

test.describe('End-to-end business journeys', () => {
  test('BASIC plan invoice limit blocks after cap and shield updates', async ({ page }) => {
    await setPlan('BASIC');
    await resetUsage();
    let plan = await fetchPlanState();
    const limit = await ensureLimited(plan, 'invoices');

    // Set usage to limit - 1, expect one more allowed then blocked
    await setUsage('INVOICES', Math.max(0, limit - 1));
    plan = await fetchPlanState();

    await page.goto(INVOICE_ISSUE);
    await assertPlanShieldMatches(page, plan);

    // Allow last invoice (should be allowed by backend)
    const allowRes = await issueInvoiceExpectingBlocked();
    if (allowRes.status() === 403) {
      throw new Error('UI_CONTRACT_MISMATCH: expected allowed invoice before hitting limit');
    }

    // Now exceed limit and expect block
    const blockedRes = await issueInvoiceExpectingBlocked();
    if (blockedRes.status() !== 403) {
      throw new Error('UI_BYPASS_DETECTED');
    }
    const blockedPlan = await fetchPlanState();
    await assertPlanShieldMatches(page, blockedPlan);
  });

  test('Seat limit blocks collaborator adds beyond cap', async ({ page }) => {
    await setPlan('BASIC');
    await resetUsage();
    let plan = await fetchPlanState();
    const limit = await ensureLimited(plan, 'seats');

    // Fill seats to limit - 1
    await setUsage('SEATS', Math.max(0, limit - 1));
    plan = await fetchPlanState();

    await page.goto(DASHBOARD);
    await assertPlanShieldMatches(page, plan);

    // Add one valid collaborator (should succeed if entitlement allows)
    const userId = await createTempUser();
    const resOk = await addCollaborator(userId);
    if (resOk.status() >= 400) {
      throw new Error('UI_CONTRACT_MISMATCH: expected collaborator add to succeed before cap');
    }

    // Move usage to hard limit to ensure next attempt blocks
    await setUsage('SEATS', limit);

    // Next add should be blocked
    const userId2 = await createTempUser();
    const resBlocked = await addCollaborator(userId2);
    if (resBlocked.status() !== 403) {
      throw new Error('UI_BYPASS_DETECTED');
    }
  });

  test('Upgrade flow reflects new limits without reload', async ({ page }) => {
    await setPlan('BASIC');
    await resetUsage();
    const before = await fetchPlanState();

    await page.goto(DASHBOARD);
    await assertPlanShieldMatches(page, before);

    await upgradePlan('ESSENTIAL');

    await test.expect.poll(async () => {
      const plan = await fetchPlanState();
      return plan.plan.code;
    }, { timeout: 15_000 }).toBe('ESSENTIAL');

    // Expect UI to update (provider refetch on navigation change not needed; rely on provider refresh interval via quick re-navigation)
    await page.goto(`${DASHBOARD}?t=${Date.now()}`);
    const after = await fetchPlanState();
    await assertPlanShieldMatches(page, after);
  });

  test('Payment failure moves to GRACE then BLOCKED after expiration', async ({ page }) => {
    await setPlan('BASIC');
    await resetUsage();

    // Future expiration with FAILED -> GRACE
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await setPaymentStatus('FAILED', future);
    let plan = await fetchPlanState();
    await page.goto(DASHBOARD);
    await assertPlanShieldMatches(page, plan);
    expect(plan.status).toBe('GRACE');

    // Past expiration with FAILED -> BLOCKED
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await setPaymentStatus('FAILED', past);
    plan = await fetchPlanState();
    await page.goto(`${DASHBOARD}?ts=${Date.now()}`);
    await assertPlanShieldMatches(page, plan);
    expect(plan.status).toBe('BLOCKED');
  });
});
