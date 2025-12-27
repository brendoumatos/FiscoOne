import { Page, expect } from '@playwright/test';
import { PlanStateResponse } from './backend';

export async function assertPlanShieldMatches(page: Page, plan: PlanStateResponse) {
  const shield = page.getByTestId('plan-shield');
  await expect(shield).toBeVisible();

  const statusLabel = await page.getByTestId('plan-shield-status').innerText();
  const planName = await page.getByTestId('plan-shield-plan').innerText();
  const invoicesText = await page.getByTestId('plan-shield-invoices').innerText();
  const seatsText = await page.getByTestId('plan-shield-seats').innerText();

  const expectedStatusLabel = {
    ACTIVE: 'Plano ativo',
    WARNING: 'Aproximando do limite',
    GRACE: 'Pagamento pendente',
    BLOCKED: 'Ação bloqueada',
    EXPIRED: 'Ação bloqueada'
  }[plan.status];

  expect(statusLabel.trim()).toBe(expectedStatusLabel);
  expect(planName.trim()).toBe(plan.plan.name);

  const expectedInvoices = plan.usage.invoices.limit === null
    ? 'Notas: ∞'
    : `Notas: ${plan.usage.invoices.used}/${plan.usage.invoices.limit}`;
  const expectedSeats = plan.usage.seats.limit === null
    ? 'Seats: ∞'
    : `Seats: ${plan.usage.seats.used}/${plan.usage.seats.limit}`;

  expect(invoicesText.trim()).toBe(expectedInvoices);
  expect(seatsText.trim()).toBe(expectedSeats);

  if (plan.cta) {
    await expect(shield.getByRole('button')).toHaveText(/upgrade|créditos|suporte/i);
  }
}
