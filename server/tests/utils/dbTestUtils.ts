import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../../src/config/db";

const REQUIRED_PLANS = ["START", "ESSENTIAL", "PROFESSIONAL", "ENTERPRISE"] as const;

export type RequiredPlanCode = typeof REQUIRED_PLANS[number];

export function ensureJwtSecret() {
    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = "test-secret";
    }
    if (!process.env.REFRESH_SECRET) {
        process.env.REFRESH_SECRET = "test-refresh-secret";
    }
    if (!process.env.MOCK_DB) {
        process.env.MOCK_DB = "true";
    }
}

export function makeToken(userId: string, companyId?: string) {
    ensureJwtSecret();
    const payload: any = { id: userId };
    if (companyId) payload.companyId = companyId;
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

export async function createTestUser(role: string = "CLIENT") {
    const id = randomUUID();
    const email = `test_${id}@example.com`;
    await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, email, "hash", `Test User ${id.slice(0, 8)}`, role]
    );
    return { id, email };
}

export async function createTestCompany(ownerId: string) {
    const id = randomUUID();
    const cnpj = Math.floor(Math.random() * 1_000_000_000_00000).toString().padStart(14, "0");
    await pool.query(
        `INSERT INTO companies (id, owner_id, cnpj, legal_name, trade_name, tax_regime, bank_info_json)
         VALUES ($1, $2, $3, $4, $5, 'SIMPLES', '{}')`,
        [id, ownerId, cnpj, `Test Company ${id.slice(0, 6)}`, `TC ${id.slice(0, 4)}`]
    );
    return { id };
}

export async function addCompanyMember(companyId: string, userId: string, role: string = "OWNER") {
    await pool.query(
        `MERGE company_members AS target
         USING (SELECT $1 AS company_id, $2 AS user_id, $3 AS role) AS src
         ON (target.company_id = src.company_id AND target.user_id = src.user_id)
         WHEN MATCHED THEN
             UPDATE SET role = src.role, status = 'ACTIVE'
         WHEN NOT MATCHED THEN
             INSERT (company_id, user_id, role, status)
             VALUES (src.company_id, src.user_id, src.role, 'ACTIVE');`,
        [companyId, userId, role]
    );
}

export async function findPlanWithInvoiceLimit(minLimit: number = 2): Promise<{ code: string; id: string; limit: number }> {
    const entRes = await pool.query(
        `SELECT plan_code, limit_value FROM plan_entitlements
         WHERE entitlement_key = 'INVOICES' AND limit_value >= $1
         ORDER BY limit_value ASC
         OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY`,
        [minLimit]
    );
    if (entRes.rowCount === 0) {
        throw new Error("PLAN_DEFINITION_MISMATCH: PLAN INVOICES_LIMIT");
    }
    const { plan_code, limit_value } = entRes.rows[0];
    const planRes = await pool.query(`SELECT id FROM plans WHERE code = $1`, [plan_code]);
    if (planRes.rowCount === 0) {
        throw new Error(`PLAN_DEFINITION_MISMATCH: ${plan_code} MISSING`);
    }
    return { code: plan_code, id: planRes.rows[0].id, limit: Number(limit_value) };
}

export async function upsertSubscription(companyId: string, planId: string, paymentStatus: string = "PAID", expiresAt?: Date) {
    const future = expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
        `MERGE subscriptions AS target
         USING (SELECT $1 AS company_id, $2 AS plan_id, $3 AS payment_status, $4 AS expires_at) AS src
         ON target.company_id = src.company_id
         WHEN MATCHED THEN
             UPDATE SET plan_id = src.plan_id, status = 'ACTIVE', payment_status = src.payment_status, expires_at = src.expires_at, started_at = SYSUTCDATETIME()
         WHEN NOT MATCHED THEN
             INSERT (company_id, plan_id, status, payment_status, started_at, expires_at)
             VALUES (src.company_id, src.plan_id, 'ACTIVE', src.payment_status, SYSUTCDATETIME(), src.expires_at);`,
        [companyId, planId, paymentStatus, future]
    );
}

export async function setUsage(companyId: string, entitlementKey: string, used: number) {
    await pool.query(
        `MERGE usage_counters AS target
         USING (SELECT $1 AS company_id, $2 AS entitlement_key, $3 AS used_value) AS src
         ON target.company_id = src.company_id AND target.entitlement_key = src.entitlement_key
         WHEN MATCHED THEN
             UPDATE SET used_value = src.used_value
         WHEN NOT MATCHED THEN
             INSERT (company_id, entitlement_key, used_value)
             VALUES (src.company_id, src.entitlement_key, src.used_value);`,
        [companyId, entitlementKey, used]
    );
}

export async function clearCompanyData(companyId: string, userIds: string[]) {
    await pool.query(`DELETE FROM audit_logs WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM usage_counters WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM subscriptions WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM invoices WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM company_members WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM companies WHERE id = $1`, [companyId]);
    for (const uid of userIds) {
        await pool.query(`DELETE FROM users WHERE id = $1`, [uid]);
    }
}

export async function getAuditLogs(companyId: string, action: string) {
    const res = await pool.query(
        `SELECT * FROM audit_logs WHERE company_id = $1 AND action = $2 ORDER BY created_at DESC`,
        [companyId, action]
    );
    return res.rows;
}

export async function countMembers(companyId: string, userId: string) {
    const res = await pool.query(
        `SELECT COUNT(*) AS cnt FROM company_members WHERE company_id = $1 AND user_id = $2`,
        [companyId, userId]
    );
    return Number(res.rows[0]?.cnt || 0);
}

export async function resetUsage(companyId: string) {
    await pool.query(`DELETE FROM usage_counters WHERE company_id = $1`, [companyId]);
}

export { pool, REQUIRED_PLANS };
