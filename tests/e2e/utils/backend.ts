import { request } from '@playwright/test';
import { Pool } from 'pg';
import { E2E_API_URL, E2E_COMPANY_ID, E2E_USER_TOKEN, PG_CONFIG } from './env';

export interface PlanStateResponse {
  plan: { code: string; name: string };
  status: 'ACTIVE' | 'WARNING' | 'BLOCKED' | 'GRACE' | 'EXPIRED';
  usage: {
    invoices: { used: number; limit: number | null };
    seats: { used: number; limit: number | null };
    accountants: { used: number; limit: number | null };
  };
  cta: string | null;
}

export async function fetchPlanState(): Promise<PlanStateResponse> {
  const api = await request.newContext();
  const res = await api.get(`${E2E_API_URL()}/companies/${E2E_COMPANY_ID()}/plan-state`, {
    headers: { Authorization: `Bearer ${E2E_USER_TOKEN()}` }
  });
  if (!res.ok()) {
    throw new Error(`Failed to fetch plan-state: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<PlanStateResponse>;
}

export async function forceUsageLimit(entitlementKey: 'INVOICES' | 'SEATS' | 'ACCOUNTANTS') {
  const plan = await fetchPlanState();
  const limit = plan.usage[entitlementKey.toLowerCase() as 'invoices' | 'seats' | 'accountants'].limit;
  if (limit === null) {
    throw new Error(`Cannot force block: ${entitlementKey} is unlimited`);
  }
  const pool = new Pool(PG_CONFIG());
  try {
    await pool.query(
      `INSERT INTO usage_counters (company_id, entitlement_key, used_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_id, entitlement_key) DO UPDATE SET used_value = EXCLUDED.used_value`,
      [E2E_COMPANY_ID(), entitlementKey, limit]
    );
  } finally {
    await pool.end();
  }
}

export async function setPaymentFailed() {
  const pool = new Pool(PG_CONFIG());
  try {
    await pool.query(
      `UPDATE subscriptions SET payment_status = 'FAILED' WHERE company_id = $1`,
      [E2E_COMPANY_ID()]
    );
  } finally {
    await pool.end();
  }
}

export async function setPlan(planCode: string) {
  const pool = new Pool(PG_CONFIG());
  try {
    const planRes = await pool.query(`SELECT id FROM plans WHERE code = $1`, [planCode]);
    if (planRes.rowCount === 0) throw new Error(`Plan not found ${planCode}`);
    const planId = planRes.rows[0].id;
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `UPDATE subscriptions SET plan_id = $1, status = 'ACTIVE', payment_status = 'PAID', expires_at = $2 WHERE company_id = $3`,
      [planId, future, E2E_COMPANY_ID()]
    );
    await resetUsage();
  } finally {
    await pool.end();
  }
}

export async function resetUsage() {
  const pool = new Pool(PG_CONFIG());
  try {
    await pool.query(`DELETE FROM usage_counters WHERE company_id = $1`, [E2E_COMPANY_ID()]);
  } finally {
    await pool.end();
  }
}

export async function setUsage(entitlementKey: 'INVOICES' | 'SEATS' | 'ACCOUNTANTS', value: number) {
  const pool = new Pool(PG_CONFIG());
  try {
    await pool.query(
      `INSERT INTO usage_counters (company_id, entitlement_key, used_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_id, entitlement_key) DO UPDATE SET used_value = EXCLUDED.used_value`,
      [E2E_COMPANY_ID(), entitlementKey, value]
    );
  } finally {
    await pool.end();
  }
}

export async function setPaymentStatus(status: 'PAID' | 'FAILED', expiresAt: Date) {
  const pool = new Pool(PG_CONFIG());
  try {
    await pool.query(
      `UPDATE subscriptions SET payment_status = $1, expires_at = $2 WHERE company_id = $3`,
      [status, expiresAt, E2E_COMPANY_ID()]
    );
  } finally {
    await pool.end();
  }
}

export async function upgradePlan(planCode: string) {
  const api = await request.newContext({ baseURL: E2E_API_URL() });
  const res = await api.post(`/subscriptions/${E2E_COMPANY_ID()}/upgrade`, {
    headers: { Authorization: `Bearer ${E2E_USER_TOKEN()}` },
    data: { planCode, cycle: 'MONTHLY' }
  });
  if (!res.ok()) {
    throw new Error(`Upgrade failed ${res.status()} ${await res.text()}`);
  }
}

export async function createTempUser(): Promise<string> {
  const pool = new Pool(PG_CONFIG());
  const { randomUUID } = await import('crypto');
  const id = randomUUID();
  try {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES ($1, $2, 'hash', 'Temp User', 'CLIENT')`,
      [id, `temp_${id.slice(0,6)}@example.com`]
    );
  } finally {
    await pool.end();
  }
  return id;
}

export async function addCollaborator(userId: string) {
  const api = await request.newContext({ baseURL: E2E_API_URL() });
  const res = await api.post(`/companies/${E2E_COMPANY_ID()}/users`, {
    headers: { Authorization: `Bearer ${E2E_USER_TOKEN()}` },
    data: { userId }
  });
  return res;
}

export async function issueInvoiceExpectingBlocked() {
  const api = await request.newContext({ baseURL: E2E_API_URL() });
  const res = await api.post(`/invoices/${E2E_COMPANY_ID()}`, {
    headers: { Authorization: `Bearer ${E2E_USER_TOKEN()}` },
    data: { borrower: { document: '123', name: 'Test' }, items: [], amount: 100 }
  });
  return res;
}

export async function addCollaboratorExpectingBlocked(collaboratorId: string) {
  const api = await request.newContext({ baseURL: E2E_API_URL() });
  const res = await api.post(`/companies/${E2E_COMPANY_ID()}/users`, {
    headers: { Authorization: `Bearer ${E2E_USER_TOKEN()}` },
    data: { userId: collaboratorId }
  });
  return res;
}
