import { pool } from '../config/db';
import { usageService } from './usage';

export interface PlanContext {
    planCode: string;
    invoiceLimit: number; // -1 for unlimited
    hasFeature: (code: string) => boolean;
}

export const subscriptionService = {
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
        return result.rows[0];
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

        // 1. Check Feature Flag
        if (featureOrMetric.startsWith('FEATURE_')) {
            const featureCode = featureOrMetric.replace('FEATURE_', '');
            const features = await this.getFeatures(sub.plan_id);
            if (!features.includes(featureCode)) {
                return { allowed: false, reason: `Feature ${featureCode} not included in ${sub.plan_name}` };
            }
        }

        // 2. Check Usage Limit (Invoices)
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
