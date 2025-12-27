import sql from 'mssql';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const useMock = process.env.MOCK_DB === 'true' || process.env.NODE_ENV === 'test';

type Row = Record<string, any>;

class MockDb {
    private plans: Row[] = [
        { id: 'plan-start', code: 'START', name: 'Start', description_pt_br: 'Plano inicial', price_monthly: 49, price_yearly: 499 },
        { id: 'plan-essential', code: 'ESSENTIAL', name: 'Essencial', description_pt_br: 'Plano essencial', price_monthly: 99, price_yearly: 999 },
        { id: 'plan-professional', code: 'PROFESSIONAL', name: 'Profissional', description_pt_br: 'Plano profissional', price_monthly: 199, price_yearly: 1999 },
        { id: 'plan-enterprise', code: 'ENTERPRISE', name: 'Enterprise', description_pt_br: 'Plano enterprise', price_monthly: 499, price_yearly: 4999 }
    ];

    private planEntitlements: Row[] = [
        { plan_code: 'START', entitlement_key: 'INVOICES', limit_value: 5 },
        { plan_code: 'START', entitlement_key: 'SEATS', limit_value: 1 },
        { plan_code: 'START', entitlement_key: 'ACCOUNTANTS', limit_value: 0 },
        { plan_code: 'ESSENTIAL', entitlement_key: 'INVOICES', limit_value: 20 },
        { plan_code: 'ESSENTIAL', entitlement_key: 'SEATS', limit_value: 3 },
        { plan_code: 'ESSENTIAL', entitlement_key: 'ACCOUNTANTS', limit_value: 1 },
        { plan_code: 'PROFESSIONAL', entitlement_key: 'INVOICES', limit_value: 100 },
        { plan_code: 'PROFESSIONAL', entitlement_key: 'SEATS', limit_value: 10 },
        { plan_code: 'PROFESSIONAL', entitlement_key: 'ACCOUNTANTS', limit_value: 1 },
        { plan_code: 'ENTERPRISE', entitlement_key: 'INVOICES', limit_value: -1 },
        { plan_code: 'ENTERPRISE', entitlement_key: 'SEATS', limit_value: -1 },
        { plan_code: 'ENTERPRISE', entitlement_key: 'ACCOUNTANTS', limit_value: -1 },
        { plan_code: 'START', entitlement_key: 'GRACE_DAYS', limit_value: 7 },
        { plan_code: 'ESSENTIAL', entitlement_key: 'GRACE_DAYS', limit_value: 7 },
        { plan_code: 'PROFESSIONAL', entitlement_key: 'GRACE_DAYS', limit_value: 7 },
        { plan_code: 'ENTERPRISE', entitlement_key: 'GRACE_DAYS', limit_value: 7 }
    ];

    private planFeatures: Row[] = [];
    private users: Row[] = [];
    private companies: Row[] = [];
    private companyMembers: Row[] = [];
    private subscriptions: Row[] = [];
    private usageCounters: Row[] = [];
    private auditLogs: Row[] = [];
    private invoices: Row[] = [];
    private marketplaceInstalls: Row[] = [];

    async query(text: string, params: any[] = []): Promise<{ rows: Row[] }> {
        const sql = text.trim().toUpperCase();
        const wrap = (rows: Row[] = []) => ({ rows, rowCount: rows.length } as any);

        // Plans and entitlements
        if (sql.startsWith('SELECT CODE, NAME, DESCRIPTION_PT_BR')) {
            return wrap([...this.plans]);
        }
        if (sql.startsWith('SELECT CODE, PRICE_MONTHLY, PRICE_YEARLY FROM PLANS')) {
            return wrap(this.plans.map(({ code, price_monthly, price_yearly }) => ({ code, price_monthly, price_yearly })));
        }
        if (sql.includes('FROM PLAN_ENTITLEMENTS')) {
            let rows = [...this.planEntitlements];
            if (sql.includes("ENTITLEMENT_KEY = 'INVOICES'")) {
                rows = rows.filter(r => r.entitlement_key.toUpperCase() === 'INVOICES');
                if (sql.includes('LIMIT_VALUE >=')) {
                    const min = Number(params[0] ?? 0);
                    rows = rows.filter(r => Number(r.limit_value) >= min);
                }
            } else if (sql.includes('WHERE ENTITLEMENT_KEY =')) {
                const key = (params[0] || '').toString().toUpperCase();
                rows = rows.filter(r => r.entitlement_key.toUpperCase() === key);
                if (sql.includes('LIMIT_VALUE >=')) {
                    const min = Number(params[1] ?? params[0] ?? 0);
                    rows = rows.filter(r => Number(r.limit_value) >= min);
                }
                if (sql.includes('PLAN_CODE =')) {
                    const code = (params[1] || params[0] || '').toString().toUpperCase();
                    rows = rows.filter(r => r.plan_code.toUpperCase() === code);
                }
            }
            if (sql.includes('WHERE PLAN_CODE =')) {
                const code = (params[0] || '').toString().toUpperCase();
                rows = rows.filter(r => r.plan_code.toUpperCase() === code);
            }
            if (sql.includes('IN (${PLACEHOLDERS})') || sql.includes('IN ($')) {
                const keys = params.map((p) => (p as string).toUpperCase());
                rows = rows.filter(r => keys.includes(r.entitlement_key.toUpperCase()));
            }
            if (sql.includes('ORDER BY LIMIT_VALUE ASC')) {
                rows = rows.sort((a, b) => Number(a.limit_value) - Number(b.limit_value)).slice(0, 1);
            }
            return wrap(rows);
        }
        if (sql.startsWith('SELECT ID FROM PLANS WHERE CODE =')) {
            const code = (params[0] || '').toString().toUpperCase();
            return wrap(this.plans.filter(p => p.code.toUpperCase() === code).map(p => ({ id: p.id })));
        }

        // Users
        if (sql.startsWith('INSERT INTO USERS')) {
            const row = { id: params[0], email: params[1], password_hash: params[2], full_name: params[3], role: params[4] };
            this.users.push(row);
            return wrap([row]);
        }

        // Companies
        if (sql.startsWith('INSERT INTO COMPANIES')) {
            const row = { id: params[0] ?? randomUUID(), owner_id: params[1], cnpj: params[2], legal_name: params[3], trade_name: params[4], tax_regime: params[5] ?? 'SIMPLES', bank_info_json: params[6] ?? '{}', address_zip: params[6], address_street: params[7], address_number: params[8], address_neighborhood: params[9], address_city: params[10], address_state: params[11], active: 1 };
            this.companies.push(row);
            return wrap([row]);
        }
        if (sql.startsWith('SELECT TOP 1 1 FROM COMPANIES WHERE ID =')) {
            const companyId = params[0];
            const exists = this.companies.some(c => c.id === companyId);
            return wrap(exists ? [{ exists: 1 }] : []);
        }

        // Company members MERGE
        if (sql.includes('MERGE COMPANY_MEMBERS')) {
            const companyId = params[0];
            const userId = params[1];
            const role = params[2] ?? 'COLLABORATOR';
            const existing = this.companyMembers.find(m => m.company_id === companyId && m.user_id === userId);
            if (existing) {
                existing.role = role;
                existing.status = 'ACTIVE';
            } else {
                this.companyMembers.push({ company_id: companyId, user_id: userId, role, status: 'ACTIVE', invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() });
            }
            return wrap([]);
        }
        if (sql.startsWith('DELETE FROM COMPANY_MEMBERS')) {
            const companyId = params[0];
            const userId = params[1];
            const before = this.companyMembers.length;
            this.companyMembers = this.companyMembers.filter(m => !(m.company_id === companyId && m.user_id === userId));
            return { rows: [], rowCount: before - this.companyMembers.length } as any;
        }
        if (sql.startsWith('SELECT COUNT(*) AS CNT FROM COMPANY_MEMBERS')) {
            const companyId = params[0];
            const userId = params[1];
            const roleFilter = sql.includes("ROLE = 'COLLABORATOR'");
            const cnt = this.companyMembers.filter(m =>
                m.company_id === companyId &&
                (userId ? m.user_id === userId : true) &&
                (!roleFilter || m.role === 'COLLABORATOR')
            ).length;
            return { rows: [{ cnt }], rowCount: 1 } as any;
        }
        if (sql.startsWith('SELECT TOP 1 ROLE, STATUS FROM COMPANY_MEMBERS')) {
            const userId = params[0];
            const companyId = params[1];
            const statusFilter = sql.includes("STATUS = 'ACTIVE'");
            const rows = this.companyMembers.filter(
                m => m.company_id === companyId && m.user_id === userId && (!statusFilter || m.status === 'ACTIVE')
            );
            return wrap(rows.slice(0, 1));
        }
        if (sql.includes('FROM COMPANY_MEMBERS WHERE COMPANY_ID =')) {
            const companyId = params[0];
            const statusFilter = sql.includes("STATUS = 'ACTIVE'");
            const rows = this.companyMembers.filter(m => m.company_id === companyId && (!statusFilter || m.status === 'ACTIVE'));
            return wrap(rows);
        }

        // Accountant delegation
        if (sql.includes('FROM ACCOUNTING_FIRM_MEMBERS') && sql.includes('JOIN COMPANY_ACCOUNTING_ASSIGNMENT')) {
            return wrap([]);
        }

        // Subscriptions MERGE/UPDATE/SELECT
        if (sql.includes('MERGE SUBSCRIPTIONS')) {
            const companyId = params[0];
            const planId = params[1];
            const paymentStatus = params[2];
            const expires = params[3];
            const existing = this.subscriptions.find(s => s.company_id === companyId);
            if (existing) {
                existing.plan_id = planId;
                existing.status = 'ACTIVE';
                existing.payment_status = paymentStatus;
                existing.expires_at = expires;
                existing.started_at = new Date().toISOString();
            } else {
                this.subscriptions.push({ id: randomUUID(), company_id: companyId, plan_id: planId, status: 'ACTIVE', payment_status: paymentStatus, expires_at: expires, started_at: new Date().toISOString() });
            }
            return wrap([]);
        }
        if (sql.startsWith('UPDATE SUBSCRIPTIONS')) {
            const planId = params[0];
            const renewalCycle = params[1];
            const companyId = params[2];
            const sub = this.subscriptions.find(s => s.company_id === companyId);
            if (sub) {
                sub.plan_id = planId;
                sub.renewal_cycle = renewalCycle;
            }
            return { rows: sub ? [{ id: sub.id }] : [] } as any;
        }
        if (sql.includes('FROM SUBSCRIPTIONS S') && sql.includes('JOIN PLANS P')) {
            const companyId = params[0];
            const sub = this.subscriptions.find(s => s.company_id === companyId);
            if (!sub) return wrap([]);
            const plan = this.plans.find(p => p.id === sub.plan_id) || this.plans[0];
            return wrap([{
                ...sub,
                subscription_id: sub.id,
                subscription_status: sub.status,
                payment_status: sub.payment_status,
                started_at: sub.started_at,
                expires_at: sub.expires_at,
                plan_id: plan.id,
                plan_code: plan.code,
                plan_name: plan.name,
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly
            }]);
        }
        if (sql.startsWith('SELECT TOP 1 S.*, P.CODE')) {
            const companyId = params[0];
            const sub = this.subscriptions.find(s => s.company_id === companyId);
            if (!sub) return wrap([]);
            const plan = this.plans.find(p => p.id === sub.plan_id) || this.plans[0];
            const seatLimit = this.planEntitlements.find(e => e.plan_code === plan.code && e.entitlement_key === 'SEATS')?.limit_value ?? null;
            const collaboratorCount = this.companyMembers.filter(m => m.company_id === companyId && m.status === 'ACTIVE' && m.role === 'COLLABORATOR').length;
            return wrap([{ ...sub, plan_code: plan.code, plan_name: plan.name, seat_limit: seatLimit, current_collaborators: collaboratorCount }]);
        }

        // Usage counters
        if (sql.includes('MERGE USAGE_COUNTERS')) {
            const companyId = params[0];
            const key = params[1];
            const used = params[2];
            const existing = this.usageCounters.find(u => u.company_id === companyId && u.entitlement_key === key);
            if (existing) {
                existing.used_value = used;
            } else {
                this.usageCounters.push({ company_id: companyId, entitlement_key: key, used_value: used });
            }
            return wrap([]);
        }
        if (sql.startsWith('SELECT USED_VALUE FROM USAGE_COUNTERS')) {
            const companyId = params[0];
            const key = params[1];
            const entry = this.usageCounters.find(u => u.company_id === companyId && u.entitlement_key === key);
            return wrap(entry ? [entry] : []);
        }
        if (sql.startsWith('SELECT ENTITLEMENT_KEY, USED_VALUE FROM USAGE_COUNTERS')) {
            const companyId = params[0];
            const rows = this.usageCounters.filter(u => u.company_id === companyId);
            return wrap(rows);
        }
        if (sql.startsWith('DELETE FROM USAGE_COUNTERS')) {
            const companyId = params[0];
            this.usageCounters = this.usageCounters.filter(u => u.company_id !== companyId);
            return wrap([]);
        }

        // Audit logs
        if (sql.startsWith('INSERT INTO AUDIT_LOGS')) {
            const row = {
                id: randomUUID(),
                company_id: params[0],
                actor_user_id: params[1],
                actor_type: params[2],
                actor_accounting_firm_id: params[3],
                action: params[4],
                entity_type: params[5],
                entity_id: params[6],
                before_state: params[7],
                after_state: params[8],
                ip_address: params[9],
                user_agent: params[10],
                created_at: new Date().toISOString()
            };
            this.auditLogs.push(row);
            return wrap([row]);
        }
        if (sql.startsWith('SELECT * FROM AUDIT_LOGS')) {
            const companyId = params[0];
            const action = params[1];
            const rows = this.auditLogs.filter(l => l.company_id === companyId && l.action === action);
            return wrap(rows);
        }
        if (sql.startsWith('DELETE FROM AUDIT_LOGS')) {
            const companyId = params[0];
            this.auditLogs = this.auditLogs.filter(l => l.company_id !== companyId);
            return wrap([]);
        }

        // Transaction no-ops
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
            return wrap([]);
        }

        // Invoices
        if (sql.startsWith('INSERT INTO INVOICES')) {
            const row = { id: randomUUID(), company_id: params[0], issue_date: params[1], status: params[2], amount: params[3], borrower_doc: params[4], borrower_name: params[5], xml_storage_url: params[6] };
            this.invoices.push(row);
            return wrap([row]);
        }
        if (sql.startsWith('UPDATE INVOICES SET STATUS')) {
            const invoiceId = params[0];
            const companyId = params[1];
            const inv = this.invoices.find(i => i.id === invoiceId && i.company_id === companyId);
            if (inv) inv.status = 'CANCELLED';
            return { rows: inv ? [inv] : [], rowCount: inv ? 1 : 0 } as any;
        }
        if (sql.includes('FROM INVOICES')) {
            const companyId = params[0];
            let rows = this.invoices.filter(i => i.company_id === companyId);
            if (sql.includes("FORMAT(ISSUE_DATE, 'YYYY-MM') =")) {
                const month = params[1];
                rows = rows.filter(i => {
                    const d = new Date(i.issue_date);
                    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    return ym === month;
                });
            }
            rows = rows.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
            return wrap(rows);
        }

        // Plan features
        if (sql.includes('FROM PLAN_FEATURES')) {
            const planId = params[0];
            const rows = this.planFeatures.filter(f => f.plan_id === planId && (f.is_enabled ?? true));
            return wrap(rows);
        }

        // Plans select top 1 id, code
        if (sql.startsWith('SELECT TOP 1 ID, CODE FROM PLANS')) {
            const codes = params.filter(Boolean).map((c: any) => c.toString().toUpperCase());
            const match = this.plans.find(p => codes.includes(p.code.toUpperCase())) || this.plans[0];
            return wrap(match ? [match] : []);
        }

        // Marketplace installs (fallback only)
        if (sql.startsWith('INSERT INTO MARKETPLACE_INSTALLATIONS')) {
            const row = { id: randomUUID(), app_id: params[0], company_id: params[1], created_at: new Date().toISOString() };
            this.marketplaceInstalls.push(row);
            return wrap([row]);
        }

        // Deletes for cleanup
        if (sql.startsWith('DELETE FROM COMPANIES')) {
            const companyId = params[0];
            this.companies = this.companies.filter(c => c.id !== companyId);
            return wrap([]);
        }
        if (sql.startsWith('DELETE FROM USERS')) {
            const userId = params[0];
            this.users = this.users.filter(u => u.id !== userId);
            return wrap([]);
        }

        // Company existence check
        if (sql.startsWith('SELECT TOP 1 1 FROM COMPANIES')) {
            const companyId = params[0];
            const exists = this.companies.some(c => c.id === companyId);
            return wrap(exists ? [{ exists: 1 }] : []);
        }

        console.warn('[MockDb] Unhandled query, returning empty rows:', text);
        return wrap([]);
    }
}

const mockDb = new MockDb();

const config: sql.config = {
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    server: process.env.SQLSERVER_HOST || 'localhost',
    port: process.env.SQLSERVER_PORT ? parseInt(process.env.SQLSERVER_PORT, 10) : 1433,
    database: process.env.SQLSERVER_DB,
    options: {
        encrypt: true,
        trustServerCertificate: process.env.SQLSERVER_TRUST_CERT === 'true'
    }
};

let poolPromise: Promise<any> | null = null;

async function getPool(): Promise<any> {
    if (useMock) {
        return mockDb;
    }

    if (!poolPromise) {
        poolPromise = (async () => {
            const pool = new sql.ConnectionPool(config);
            await pool.connect();
            // Monkey-patch a pg-like query helper for compatibility
            (pool as any).query = async (text: string, params: any[] = []) => {
                const { sqlText, namedParams } = mapParams(text, params);
                const request = pool.request();
                for (const [name, value] of Object.entries(namedParams)) {
                    request.input(name, value as any);
                }
                const result = await request.query(sqlText);
                return { rows: result.recordset || [] };
            };
            return pool;
        })();
    }
    return poolPromise;
}

function mapParams(text: string, params: any[]) {
    // Convert $1 style to @p1
    const namedParams: Record<string, any> = {};
    const sqlText = text.replace(/\$(\d+)/g, (_m, idx) => {
        const name = `p${idx}`;
        namedParams[name] = params[Number(idx) - 1];
        return `@${name}`;
    });
    return { sqlText, namedParams };
}

export async function connectToDatabase() {
    try {
        const pool = await getPool();
        if (!useMock) {
            console.log('✅ Connected to Azure SQL Database');
        }
        return pool as any;
    } catch (err) {
        console.error('❌ Database Connection Failed:', err);
        throw err;
    }
}

// Export pg-like pool shim
export const pool: any = {
    async query(text: string, params: any[] = []) {
        const p = await getPool();
        return p.query(text, params);
    },
    // pg-like connect shim (no dedicated connection pinning; queries run on pool)
    async connect() {
        const p = await getPool();
        return {
            query: (text: string, params: any[] = []) => p.query(text, params),
            release: () => undefined
        };
    }
};
