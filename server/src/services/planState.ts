import { pool } from '../config/db';
import { usageService } from './usage';

export type PlanStatus = 'ACTIVE' | 'WARNING' | 'BLOCKED' | 'GRACE' | 'EXPIRED';
export type PlanCTA = 'UPGRADE' | 'BUY_CREDITS' | 'CONTACT_SUPPORT' | null;

export interface PlanState {
    companyId: string;
    plan: {
        code: string;
        name: string;
        priceMonthly: number | null;
        priceYearly: number | null;
    };
    status: PlanStatus;
    usage: {
        invoices: { used: number; limit: number | null };
        seats: { used: number; limit: number | null };
        accountants: { used: number; limit: number | null };
    };
    expiration: Date | null;
    reason?: string;
    cta: PlanCTA;
    // Legacy compatibility
    planCode?: string;
    limits?: { invoices: number | null; seats: number | null; accountants: number | null };
}

const WARNING_THRESHOLD = 0.8;

const LIMIT_KEYS = {
    invoices: 'INVOICES',
    seats: 'SEATS',
    accountants: 'ACCOUNTANTS',
    grace: 'GRACE_DAYS'
};

export const planStateService = {
    async getPlanState(companyId: string): Promise<PlanState> {
        const subResult = await pool.query(
            `SELECT s.id               AS subscription_id,
                    s.status           AS subscription_status,
                    s.payment_status   AS payment_status,
                    s.started_at       AS started_at,
                    s.expires_at       AS expires_at,
                    p.id               AS plan_id,
                    p.code             AS plan_code,
                    p.name             AS plan_name,
                    p.price_monthly,
                    p.price_yearly
             FROM subscriptions s
             JOIN plans p ON p.id = s.plan_id
             WHERE s.company_id = $1
             OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY`,
            [companyId]
        );

        if (subResult.rows.length === 0) {
            throw new Error('Subscription not found for company');
        }

        const row = subResult.rows[0];
        const planCode = (row.plan_code || 'START').toUpperCase();

        // Load entitlements from SQL
        const entRes = await pool.query(
            `SELECT entitlement_key, limit_value FROM plan_entitlements WHERE plan_code = $1`,
            [planCode]
        );

        const entitlements: Record<string, number> = {};
        entRes.rows.forEach((r: any) => {
            entitlements[r.entitlement_key.toUpperCase()] = Number(r.limit_value);
        });

        const limitFromEntitlement = (key: string): number | null => {
            const val = entitlements[key];
            if (val === undefined) return null;
            if (val === -1) return null; // unlimited
            return Number(val);
        };

        // Usage counters
        const usageRows = await pool.query(
            `SELECT entitlement_key, used_value FROM usage_counters WHERE company_id = $1`,
            [companyId]
        );
        const usageMap: Record<string, number> = {};
        usageRows.rows.forEach((r: any) => {
            usageMap[r.entitlement_key.toUpperCase()] = Number(r.used_value);
        });

        const invoicesUsed = usageMap[LIMIT_KEYS.invoices] ?? await usageService.getCurrentUsage(companyId, LIMIT_KEYS.invoices);
        let seatsUsed = usageMap[LIMIT_KEYS.seats];
        if (seatsUsed === undefined) {
            const seatRes = await pool.query(
                `SELECT COUNT(*) AS cnt FROM company_members WHERE company_id = $1 AND status = 'ACTIVE' AND role = 'COLLABORATOR'`,
                [companyId]
            );
            seatsUsed = seatRes.rows.length ? parseInt(seatRes.rows[0].cnt || '0', 10) : 0;
        }
        if (seatsUsed === undefined || Number.isNaN(seatsUsed)) seatsUsed = 0;
        const accountantsUsed = usageMap[LIMIT_KEYS.accountants] ?? 0;

        const invoiceLimit = limitFromEntitlement(LIMIT_KEYS.invoices);
        const seatLimit = limitFromEntitlement(LIMIT_KEYS.seats);
        const accountantLimit = limitFromEntitlement(LIMIT_KEYS.accountants);
        const graceDays = limitFromEntitlement(LIMIT_KEYS.grace) ?? 0;

        const now = new Date();
        const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
        let status: PlanStatus = 'ACTIVE';
        let reason: string | undefined;
        let cta: PlanCTA = null;

        // Expiration check
        if (expiresAt && expiresAt < now) {
            status = 'BLOCKED';
            reason = 'Subscription expired';
            cta = 'UPGRADE';
        }

        // Payment failure -> grace then block
        if (row.payment_status === 'FAILED') {
            if (graceDays > 0 && expiresAt) {
                const graceUntil = new Date(expiresAt.getTime());
                graceUntil.setDate(graceUntil.getDate() + graceDays);
                if (now <= graceUntil && status !== 'BLOCKED') {
                    status = 'GRACE';
                    reason = 'Payment failed - grace period';
                    cta = 'UPGRADE';
                } else {
                    status = 'BLOCKED';
                    reason = 'Payment failed - subscription blocked';
                    cta = 'CONTACT_SUPPORT';
                }
            } else if (status !== 'BLOCKED') {
                status = 'GRACE';
                reason = 'Payment failed - grace period';
                cta = 'UPGRADE';
            }
        }

        const evaluateLimit = (used: number, limit: number | null, label: string) => {
            if (limit === null) return;

            if (limit === 0) {
                if (used > 0) {
                    status = 'BLOCKED';
                    reason = `${label} limit exceeded`;
                    cta = 'UPGRADE';
                }
                return;
            }

            if (used >= limit) {
                status = 'BLOCKED';
                reason = `${label} limit exceeded`;
                cta = 'UPGRADE';
            } else if ((status === 'ACTIVE' || status === 'GRACE') && used / limit >= WARNING_THRESHOLD) {
                if (status === 'ACTIVE') {
                    status = 'WARNING';
                }
                reason = `${label} usage near limit`;
                cta = cta || 'BUY_CREDITS';
            }
        };

        if (status === 'ACTIVE' || status === 'GRACE') {
            evaluateLimit(invoicesUsed, invoiceLimit, 'Invoice');
            evaluateLimit(seatsUsed, seatLimit, 'Seat');
            evaluateLimit(accountantsUsed, accountantLimit, 'Accountant');
        }

        const planState: PlanState = {
            companyId,
            plan: {
                code: planCode,
                name: row.plan_name,
                priceMonthly: row.price_monthly ? Number(row.price_monthly) : null,
                priceYearly: row.price_yearly ? Number(row.price_yearly) : null
            },
            status,
            usage: {
                invoices: { used: invoicesUsed, limit: invoiceLimit },
                seats: { used: seatsUsed, limit: seatLimit },
                accountants: { used: accountantsUsed, limit: accountantLimit }
            },
            expiration: expiresAt,
            reason,
            cta: cta || null,
            planCode,
            limits: {
                invoices: invoiceLimit,
                seats: seatLimit,
                accountants: accountantLimit
            }
        };

        return planState;
    }
};
