import { pool } from '../config/db';
import { usageService } from './usage';
import { AuthRequest } from '../middleware/auth';

export interface EntitlementResult {
    allowed: boolean;
    reason?: string;
    upgrade_suggestion?: string;
    current_usage?: number;
    limit?: number;
    plan_code?: string;
}

type PlanCode = 'PLAN_START' | 'PLAN_ESSENTIAL' | 'PLAN_PROFESSIONAL' | 'PLAN_ENTERPRISE';

const PLAN_CATALOG: Record<PlanCode, {
    name: string;
    invoiceLimit: number;
    seatLimit: number;
    price: number | 'CUSTOM';
    features: string[];
    extraInvoicePrice?: number;
    extraSeatPrice?: number;
}> = {
    PLAN_START: {
        name: 'Start',
        invoiceLimit: 2,
        seatLimit: 1,
        price: 8.99,
        features: ['ISSUE_INVOICE_BASIC', 'DASHBOARD_BASIC', 'FISCAL_ALERTS_INFO', 'AUDIT_ENABLED']
    },
    PLAN_ESSENTIAL: {
        name: 'Essencial',
        invoiceLimit: 5,
        seatLimit: 1,
        price: 49,
        features: ['ISSUE_INVOICE', 'DASHBOARD_FULL', 'TAX_ESTIMATION', 'TAX_CALENDAR', 'WHATSAPP_ALERTS', 'ADVISOR_ENGINE'],
        extraInvoicePrice: 6
    },
    PLAN_PROFESSIONAL: {
        name: 'Profissional',
        invoiceLimit: 50,
        seatLimit: 3,
        price: 149,
        features: ['ISSUE_INVOICE', 'DASHBOARD_FULL', 'TAX_ESTIMATION', 'TAX_CALENDAR', 'WHATSAPP_ALERTS', 'ADVISOR_ENGINE', 'RECURRENT_INVOICES', 'FINANCIAL_HEALTH', 'DOCUMENT_MANAGEMENT', 'AUDIT_VISIBLE', 'FISCAL_SCORE', 'READINESS_INDEX'],
        extraInvoicePrice: 4,
        extraSeatPrice: 19
    },
    PLAN_ENTERPRISE: {
        name: 'Enterprise',
        invoiceLimit: -1,
        seatLimit: -1,
        price: 'CUSTOM',
        features: ['ISSUE_INVOICE', 'DASHBOARD_FULL', 'TAX_ESTIMATION', 'TAX_CALENDAR', 'WHATSAPP_ALERTS', 'ADVISOR_ENGINE', 'RECURRENT_INVOICES', 'FINANCIAL_HEALTH', 'DOCUMENT_MANAGEMENT', 'AUDIT_VISIBLE', 'FISCAL_SCORE', 'READINESS_INDEX', 'DEDICATED_ACCOUNTANT', 'SLA_SUPPORT', 'ADVANCED_VALIDATIONS']
    }
};

const PLAN_ORDER: PlanCode[] = ['PLAN_START', 'PLAN_ESSENTIAL', 'PLAN_PROFESSIONAL', 'PLAN_ENTERPRISE'];

export const subscriptionService = {
    getPlanMeta(planCode: PlanCode) {
        return PLAN_CATALOG[planCode];
    },
    seatLimitForPlan(planCode: PlanCode): number {
        return PLAN_CATALOG[planCode]?.seatLimit ?? 1;
    },

    async getSubscription(companyId: string) {
        const result = await pool.query(
            `SELECT s.*, p.code as plan_code, p.name as plan_name, p.invoice_limit 
             FROM subscriptions s
             JOIN plans p ON s.plan_id = p.id
             WHERE s.company_id = $1 AND s.status = 'ACTIVE'`,
            [companyId]
        );

        if (result.rows.length === 0) {
            return null;
        }
        const sub = result.rows[0];

        const planCode = (sub.plan_code || 'PLAN_START') as PlanCode;
        const planMeta = PLAN_CATALOG[planCode];

        // Collaborator count (seats) - accountants not counted
        const memberRes = await pool.query(
            `SELECT COUNT(*) AS cnt FROM company_members 
             WHERE company_id = $1 AND status = 'ACTIVE' AND role = 'COLLABORATOR'`,
            [companyId]
        );
        const currentCollaborators = parseInt(memberRes.rows[0]?.cnt || '0', 10);
        const seatLimit = planMeta?.seatLimit ?? sub.seat_limit ?? 1;

        return { ...sub, plan_code: planCode, seat_limit: seatLimit, current_collaborators: currentCollaborators };
    },

    async ensureSubscription(companyId: string) {
        let sub = await this.getSubscription(companyId);
        if (!sub) {
            const planRes = await pool.query(`SELECT id FROM plans WHERE code = 'PLAN_START'`);
            if (planRes.rows.length > 0) {
                await pool.query(
                    `INSERT INTO subscriptions (company_id, plan_id, status) VALUES ($1, $2, 'ACTIVE')
                     ON CONFLICT (company_id) DO NOTHING`,
                    [companyId, planRes.rows[0].id]
                );
                sub = await this.getSubscription(companyId);
            }
        }
        return sub;
    },

    async getFeatures(planId: string, planCode?: PlanCode) {
        // Prefer DB features; fall back to catalog
        const result = await pool.query(
            `SELECT feature_code FROM plan_features WHERE plan_id = $1 AND is_enabled = true`,
            [planId]
        );
        if (result.rows.length > 0) return result.rows.map(r => r.feature_code);
        if (planCode && PLAN_CATALOG[planCode]) return PLAN_CATALOG[planCode].features;
        return [];
    },

    nextPlan(planCode: PlanCode): PlanCode {
        const idx = PLAN_ORDER.indexOf(planCode);
        return PLAN_ORDER[Math.min(idx + 1, PLAN_ORDER.length - 1)];
    },

    async checkEntitlement(companyId: string, action: string, options?: { req?: AuthRequest }): Promise<EntitlementResult> {
        const sub = await this.ensureSubscription(companyId);
        if (!sub) return { allowed: false, reason: 'Nenhum plano ativo encontrado.', upgrade_suggestion: 'PLAN_START' };

        const planCode = (sub.plan_code || 'PLAN_START') as PlanCode;
        const planMeta = PLAN_CATALOG[planCode];
        const features = await this.getFeatures(sub.plan_id, planCode);

        const deny = (reason: string, upgrade?: PlanCode, current_usage?: number, limit?: number): EntitlementResult => {
            const payload: EntitlementResult = {
                allowed: false,
                reason,
                upgrade_suggestion: upgrade || this.nextPlan(planCode),
                current_usage,
                limit,
                plan_code: planCode
            };

            // Audit denial when request context is present
            if (options?.req) {
                try {
                    const { auditLogService } = require('./auditLog');
                    auditLogService.log({
                        action: 'ENTITLEMENT_DENIED',
                        entityType: 'SUBSCRIPTION',
                        entityId: companyId,
                        beforeState: null,
                        afterState: { denied: action, reason, planCode },
                        req: options.req
                    }).catch(() => null);
                } catch (err) {
                    console.warn('Audit log entitlement denial falhou', err);
                }
            }
            return payload;
        };

        const allow = (current_usage?: number, limit?: number): EntitlementResult => ({
            allowed: true,
            current_usage,
            limit,
            plan_code: planCode
        });

        // Map actions to feature/limit checks
        switch (action) {
            case 'ISSUE_INVOICE': {
                const limit = planMeta.invoiceLimit ?? sub.invoice_limit ?? -1;
                if (limit === -1) return allow();
                const used = await usageService.getCurrentUsage(companyId, 'INVOICES_ISSUED');
                if (used < limit) return allow(used, limit);

                // Try to consume credit
                const creditModule = await import('./credit');
                const hasCredit = await creditModule.creditService.consumeCredit(companyId, 'EXTRA_INVOICES', 1);
                if (hasCredit) return allow(used, limit);
                return deny(`Limite de notas excedido (${used}/${limit}).`, this.nextPlan(planCode), used, limit);
            }
            case 'CANCEL_INVOICE': {
                if (!features.includes('AUDIT_ENABLED') && !features.includes('AUDIT_VISIBLE')) {
                    return deny('Seu plano não habilita cancelamento auditável.');
                }
                return allow();
            }
            case 'ADD_COLLABORATOR': {
                const seatLimit = planMeta.seatLimit ?? sub.seat_limit ?? 1;
                if (seatLimit === -1) return allow();
                const memberRes = await pool.query(
                    `SELECT COUNT(*) AS cnt FROM company_members 
                     WHERE company_id = $1 AND status = 'ACTIVE' AND role = 'COLLABORATOR'`,
                    [companyId]
                );
                const current = parseInt(memberRes.rows[0]?.cnt || '0', 10);
                if (current >= seatLimit) {
                    // Try to consume seat credit
                    const creditModule = await import('./credit');
                    const hasSeatCredit = await creditModule.creditService.consumeCredit(companyId, 'EXTRA_SEAT', 1);
                    if (hasSeatCredit) return allow(current, seatLimit);
                    return deny('Limite de assentos atingido.', this.nextPlan(planCode), current, seatLimit);
                }
                return allow(current, seatLimit);
            }
            case 'ACCESS_DASHBOARD': {
                if (features.includes('DASHBOARD_FULL') || features.includes('DASHBOARD_BASIC')) return allow();
                return deny('Seu plano não habilita o dashboard.');
            }
            case 'ENABLE_RECURRENCE': {
                if (features.includes('RECURRENT_INVOICES')) return allow();
                return deny('Recorrência disponível a partir do plano Profissional.', 'PLAN_PROFESSIONAL');
            }
            case 'DOWNLOAD_REPORTS': {
                if (features.includes('DOCUMENT_MANAGEMENT')) return allow();
                return deny('Relatórios avançados exigem o plano Profissional.', 'PLAN_PROFESSIONAL');
            }
            default:
                return allow();
        }
    },

    async upgradeSubscription(companyId: string, planCode: PlanCode, cycle: 'MONTHLY' | 'ANNUAL') {
        const planRes = await pool.query(`SELECT id FROM plans WHERE code = $1`, [planCode]);
        if (planRes.rows.length === 0) throw new Error('Plan not found');
        const planId = planRes.rows[0].id;

        const res = await pool.query(
            `UPDATE subscriptions 
              SET plan_id = $1, renewal_cycle = $2, status = 'ACTIVE' 
              WHERE company_id = $3
              RETURNING id`,
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
            const fallbackRes = await pool.query(`SELECT id FROM plans WHERE code = 'PLAN_START'`);
            planId = fallbackRes.rows[0].id;
        } else {
            planId = planRes.rows[0].id;
        }

        await pool.query(
            `INSERT INTO subscriptions (company_id, plan_id, status, start_date) 
             VALUES ($1, $2, 'ACTIVE', CURRENT_DATE)
             ON CONFLICT (company_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = 'ACTIVE'`,
            [companyId, planId]
        );
    }
};
