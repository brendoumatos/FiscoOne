import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { planStateService, PlanCTA, PlanStatus } from './planState';

export interface EntitlementResult {
    allowed: boolean;
    reason?: string;
    upgrade_suggestion?: string;
    current_usage?: number;
    limit?: number | null;
    plan_code?: string;
    error?: string;
    cta?: PlanCTA;
    status?: PlanStatus;
}

type PlanCode = 'START' | 'ESSENTIAL' | 'PROFESSIONAL' | 'ENTERPRISE';

const PLAN_ORDER: PlanCode[] = ['START', 'ESSENTIAL', 'PROFESSIONAL', 'ENTERPRISE'];

const normalizePlanCode = (code?: string): PlanCode => {
    const upper = (code || 'START').toUpperCase();
    if (upper.includes('PROFESSIONAL') || upper === 'PRO') return 'PROFESSIONAL';
    if (upper.includes('ENTERPRISE')) return 'ENTERPRISE';
    if (upper.includes('ESSENTIAL')) return 'ESSENTIAL';
    return 'START';
};

export const subscriptionService = {
    async getPlanMeta(planCode: PlanCode) {
        const res = await pool.query(`SELECT code, name, price_monthly, price_yearly FROM plans WHERE code = $1`, [planCode]);
        return res.rows[0] || null;
    },

    async seatLimitForPlan(planCode: PlanCode): Promise<number | null> {
        const res = await pool.query(
            `SELECT TOP 1 limit_value 
             FROM plan_entitlements
             WHERE plan_code = $1 AND entitlement_key = 'SEATS'`,
            [planCode]
        );
        if (res.rows.length === 0) return null;
        const val = Number(res.rows[0].limit_value);
        return val === -1 ? null : val;
    },

    async getSubscription(companyId: string) {
        const result = await pool.query(
            `SELECT TOP 1 s.*, p.code as plan_code, p.name as plan_name
             FROM subscriptions s
             JOIN plans p ON s.plan_id = p.id
             WHERE s.company_id = $1 AND s.status = 'ACTIVE'`,
            [companyId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const sub = result.rows[0];
        const planCode = normalizePlanCode(sub.plan_code);

        const seatEnt = await pool.query(
            `SELECT TOP 1 limit_value 
             FROM plan_entitlements
             WHERE plan_code = $1 AND entitlement_key = 'SEATS'`,
            [planCode]
        );
        const seatLimitRaw = seatEnt.rows.length ? Number(seatEnt.rows[0].limit_value) : null;
        const seatLimit = seatLimitRaw === -1 ? null : seatLimitRaw;

        const memberRes = await pool.query(
            `SELECT COUNT(*) AS cnt FROM company_members 
             WHERE company_id = $1 AND status = 'ACTIVE' AND role = 'COLLABORATOR'`,
            [companyId]
        );
        const currentCollaborators = parseInt(memberRes.rows[0]?.cnt || '0', 10);

        return { ...sub, plan_code: planCode, seat_limit: seatLimit, current_collaborators: currentCollaborators };
    },

    async ensureSubscription(companyId: string) {
        let sub = await this.getSubscription(companyId);
        if (!sub) {
            const planRes = await pool.query(`SELECT TOP 1 id, code FROM plans WHERE code = 'START'`);
            if (planRes.rows.length > 0) {
                await pool.query(
                    `IF NOT EXISTS (SELECT 1 FROM subscriptions WHERE company_id = $1)
                     BEGIN
                        INSERT INTO subscriptions (company_id, plan_id, status, payment_status, started_at, expires_at)
                        VALUES ($1, $2, 'ACTIVE', 'PAID', SYSUTCDATETIME(), DATEADD(month, 1, SYSUTCDATETIME()))
                     END`,
                    [companyId, planRes.rows[0].id]
                );
                sub = await this.getSubscription(companyId);
            }
        }
        return sub;
    },

    async getFeatures(planId: string) {
        const result = await pool.query(
            `SELECT feature_code FROM plan_features WHERE plan_id = $1 AND is_enabled = true`,
            [planId]
        );
        return result.rows.map((r: any) => r.feature_code);
    },

    nextPlan(planCode: PlanCode): PlanCode {
        const idx = PLAN_ORDER.indexOf(planCode);
        return PLAN_ORDER[Math.min(idx + 1, PLAN_ORDER.length - 1)];
    },

    async checkEntitlement(companyId: string, action: string, options?: { req?: AuthRequest }): Promise<EntitlementResult> {
        const planState = await planStateService.getPlanState(companyId);
        const planCode = normalizePlanCode(planState.plan.code);

        const deny = async (reason: string, upgrade?: PlanCode, current_usage?: number, limit?: number | null, override?: { error?: string; cta?: PlanCTA; status?: PlanStatus }): Promise<EntitlementResult> => {
            if (options?.req) {
                const { auditLogService } = require('./auditLog');
                await auditLogService.log({
                    action: 'ENTITLEMENT_DENIED',
                    entityType: 'SUBSCRIPTION',
                    entityId: companyId,
                    beforeState: null,
                    afterState: { denied: action, reason, planCode },
                    req: options.req
                });
            }

            return {
                allowed: false,
                reason,
                upgrade_suggestion: upgrade || this.nextPlan(planCode),
                current_usage,
                limit,
                plan_code: planCode,
                error: override?.error,
                cta: override?.cta ?? planState.cta ?? 'UPGRADE',
                status: override?.status ?? planState.status
            };
        };

        const allow = (current_usage?: number, limit?: number | null): EntitlementResult => ({
            allowed: true,
            current_usage,
            limit,
            plan_code: planCode,
            status: planState.status,
            cta: planState.cta
        });

        if (planState.status === 'BLOCKED') {
            return await deny(planState.reason || 'Plano bloqueado.', this.nextPlan(planCode), planState.usage.invoices.used, planState.usage.invoices.limit, {
                error: 'PLAN_BLOCKED',
                cta: planState.cta || 'UPGRADE',
                status: 'BLOCKED'
            });
        }

        switch (action) {
            case 'ISSUE_INVOICE': {
                const { used, limit } = planState.usage.invoices;
                if (limit === null || used < limit) return allow(used, limit);
                return await deny(`Limite de notas excedido (${used}/${limit}).`, this.nextPlan(planCode), used, limit, {
                    error: 'PLAN_BLOCKED',
                    cta: 'UPGRADE'
                });
            }
            case 'CANCEL_INVOICE': {
                return allow();
            }
            case 'ADD_COLLABORATOR': {
                const { used, limit } = planState.usage.seats;
                if (limit === null || used < limit) return allow(used, limit);
                return await deny('Limite de assentos atingido.', this.nextPlan(planCode), used, limit, {
                    error: 'PLAN_BLOCKED',
                    cta: 'UPGRADE'
                });
            }
            case 'ADD_ACCOUNTANT': {
                const { used, limit } = planState.usage.accountants;
                if (limit === null || used < limit) return allow(used, limit);
                return await deny('Limite de contadores atingido.', this.nextPlan(planCode), used, limit, {
                    error: 'PLAN_BLOCKED',
                    cta: 'UPGRADE'
                });
            }
            default:
                return allow();
        }
    },

    async getPlanState(companyId: string) {
        return planStateService.getPlanState(companyId);
    },

    async upgradeSubscription(companyId: string, planCode: PlanCode, cycle: 'MONTHLY' | 'ANNUAL', client?: any) {
        const db = client ?? pool;

        const planRes = await db.query(`SELECT id FROM plans WHERE code = $1`, [planCode]);
        if (planRes.rows.length === 0) throw new Error('Plan not found');
        const planId = planRes.rows[0].id;

                const res = await db.query(
                        `UPDATE subscriptions 
                            SET plan_id = $1, renewal_cycle = $2, status = 'ACTIVE' 
                            WHERE company_id = $3
                            OUTPUT inserted.id`,
                        [planId, cycle, companyId]
                );

                const subId = res.rows[0].id;

        if (cycle === 'ANNUAL') {
            const { incentiveService } = await import('./incentive');
            await incentiveService.grantAnnualIncentives(subId, planCode, companyId);
        }

        return { success: true, planCode, cycle };
    },

    async createInitialSubscription(companyId: string, planCode: PlanCode) {
        const planRes = await pool.query(`SELECT id FROM plans WHERE code = $1`, [planCode]);
        let planId;

        if (planRes.rows.length === 0) {
            const fallbackRes = await pool.query(`SELECT TOP 1 id FROM plans WHERE code = 'START'`);
            planId = fallbackRes.rows[0].id;
        } else {
            planId = planRes.rows[0].id;
        }

        await pool.query(
            `IF EXISTS (SELECT 1 FROM subscriptions WHERE company_id = $1)
                UPDATE subscriptions SET plan_id = $2, status = 'ACTIVE', payment_status = 'PAID', expires_at = DATEADD(month, 1, SYSUTCDATETIME()) WHERE company_id = $1
             ELSE
                INSERT INTO subscriptions (company_id, plan_id, status, payment_status, start_date, expires_at)
                VALUES ($1, $2, 'ACTIVE', 'PAID', CAST(SYSUTCDATETIME() AS DATE), DATEADD(month, 1, SYSUTCDATETIME()))`,
            [companyId, planId]
        );
    }
};
