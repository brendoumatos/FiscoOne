import { test, expect } from '@playwright/test';
import { fetchPlanState, forceUsageLimit, addCollaboratorExpectingBlocked } from './utils/backend';
import { assertPlanShieldMatches } from './utils/ui';

const PATH = '/dashboard/settings';

// Collaborator add uses seat entitlement
const FAKE_COLLABORATOR_ID = '00000000-0000-0000-0000-000000000001';

test.describe('Collaborators screen', () => {
  test('PlanShield matches backend and collaborator add blocks with 403', async ({ page }) => {
    await forceUsageLimit('SEATS');
    const plan = await fetchPlanState();

    await page.goto(PATH);
    await assertPlanShieldMatches(page, plan);

    const res = await addCollaboratorExpectingBlocked(FAKE_COLLABORATOR_ID);
    if (res.status() !== 403) {
      throw new Error('UI_BYPASS_DETECTED');
    }
    const body = await res.json();
    expect(body.error || body.code).toBeDefined();
  });
});
