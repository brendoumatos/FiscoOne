import { pool } from '../config/db';
import { usageService } from './usage';

export interface PlanContext {
    planCode: string;
    invoiceLimit: number; // -1 for unlimited
    hasFeature: (code: string) => boolean;
}

export const subscriptionService = {
    seatLimitForPlan(planCode: string): number {
        // Seat limits per plan (non-accountant). Accountants do not consume seats.
        switch (planCode) {
            case 'FREE': return 1; // owner only
            case 'BASIC': return 3;
            case 'PRO': return 10;
            case 'ENTERPRISE': return 50;
            default: return 1;
        }
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
            // Check if we should auto-create a FREE subscription?
            // For now return null or default to FREE logic in check
            return null;
        }
        const sub = result.rows[0];

        // Compute expiration for FREE (60 days hard cap)
        const created = new Date(sub.start_date || sub.created_at || new Date());
        const expiration = sub.plan_code === 'FREE'
            ? new Date(created.getTime() + 60 * 24 * 60 * 60 * 1000)
            : null;

        // Collaborator count (seats) - accountants not counted
        const memberRes = await pool.query(
            `SELECT COUNT(*) AS cnt FROM company_members 
             WHERE company_id = $1 AND status = 'ACTIVE' AND role = 'COLLABORATOR'`,
            [companyId]
        );
        const currentCollaborators = parseInt(memberRes.rows[0]?.cnt || '0', 10);
        const seatLimit = this.seatLimitForPlan(sub.plan_code);

        return { ...sub, expiration_date: expiration, seat_limit: seatLimit, current_collaborators: currentCollaborators };
    },

    async ensureSubscription(companyId: string) {
        let sub = await this.getSubscription(companyId);
        if (!sub) {
            // Assign FREE plan automatically
            const planRes = await pool.query(`SELECT id FROM plans WHERE code = 'FREE'`);
            if (planRes.rows.length > 0) {
                await pool.query(
                    `INSERT INTO subscriptions (company_id, plan_id, status) VALUES ($1, $2, 'ACTIVE')`,
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
        return result.rows.map(r => r.feature_code);
    },

    async checkEntitlement(companyId: string, featureOrMetric: string): Promise<{ allowed: boolean; reason?: string }> {
        const sub = await this.ensureSubscription(companyId);
        if (!sub) return { allowed: false, reason: 'No Active Subscription' };

        if (featureOrMetric.startsWith('FEATURE_')) {
            const featureCode = featureOrMetric.replace('FEATURE_', '');
            const features = await this.getFeatures(sub.plan_id);
            if (!features.includes(featureCode)) {
                return { allowed: false, reason: `Feature ${featureCode} not included in ${sub.plan_name}` };
            }
        }

        // 2. Check Plan Expiration (Free Plan Limit)
        if (sub.plan_code === 'FREE') {
            const createdAt = new Date(sub.created_at || sub.start_date);
            const expiration = new Date(createdAt.getTime() + 60 * 24 * 60 * 60 * 1000);

            if (Date.now() > expiration.getTime()) {
                return {
                    allowed: false,
                    reason: 'Seu plano gratuito expirou (limite de 2 meses). Faça upgrade para continuar emitindo.'
                };
            }
        }

        // Generic access: block if free expired
        if (featureOrMetric === 'GENERIC_ACCESS') {
            return { allowed: true };
        }

        // Invoice issuance limit
        if (featureOrMetric === 'ISSUE_INVOICE') {
            if (sub.invoice_limit === -1) return { allowed: true };

            const used = await usageService.getCurrentUsage(companyId, 'INVOICES_ISSUED');

            // If within plan limit, allow
            if (used < sub.invoice_limit) return { allowed: true };

            // If Limit Exceeded, check Credits
            const hasCredit = await import('./credit').then(m => m.creditService.consumeCredit(companyId, 'EXTRA_INVOICES', 1));

            if (hasCredit) return { allowed: true };

            return { allowed: false, reason: `Limite de notas excedido (${used}/${sub.invoice_limit}). Atualize seu plano ou ganhe créditos.` };
        }

        // Invoice cancel (treat as fiscal-sensitive; allow if subscription active)
        if (featureOrMetric === 'CANCEL_INVOICE') {
            return { allowed: true };
        }

        // Collaborator seat check
        if (featureOrMetric === 'ADD_COLLABORATOR') {
            const seatLimit = this.seatLimitForPlan(sub.plan_code);
            if (seatLimit === -1) return { allowed: true };
            const memberRes = await pool.query(
                `SELECT COUNT(*) AS cnt FROM company_members 
                 WHERE company_id = $1 AND status = 'ACTIVE' AND role = 'COLLABORATOR'`,
                [companyId]
            );
            const current = parseInt(memberRes.rows[0]?.cnt || '0', 10);
            if (current >= seatLimit) {
                return { allowed: false, reason: 'Limite de colaboradores atingido. Faça upgrade de plano.' };
            }
            return { allowed: true };
        }

        // Marketplace mutation requires active subscription (no extra limits here)
        if (featureOrMetric === 'MARKETPLACE_MUTATION') {
            return { allowed: true };
        }

        // Company update
        if (featureOrMetric === 'COMPANY_UPDATE') {
            return { allowed: true };
        }

        return { allowed: true };
    },

    async upgradeSubscription(companyId: string, planCode: string, cycle: 'MONTHLY' | 'ANNUAL') {
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

    async createInitialSubscription(companyId: string, planCode: string) {
        const planRes = await pool.query(`SELECT id FROM plans WHERE code = $1`, [planCode]);
        let planId;

        if (planRes.rows.length === 0) {
            // Fallback to FREE if invalid code
            const freeRes = await pool.query(`SELECT id FROM plans WHERE code = 'FREE'`);
            planId = freeRes.rows[0].id;
        } else {
            planId = planRes.rows[0].id;
        }

        await pool.query(
            `INSERT INTO subscriptions (company_id, plan_id, status, start_date) 
             VALUES ($1, $2, 'ACTIVE', CURRENT_DATE)
             ON CONFLICT (company_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = 'ACTIVE'`, // Robustness
            [companyId, planId]
        );
    }
};
