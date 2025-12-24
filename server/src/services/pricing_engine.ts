import { pool } from '../config/db';
import { subscriptionService } from './subscription';
import { usageService } from './usage';
import { analyticsService } from './analytics';

export const pricingEngine = {
    async analyzeUsage(companyId: string) {
        const sub = await subscriptionService.getSubscription(companyId);
        if (!sub) return null;

        // Skip if Enterprise (Unlimited) implementation logic varies, but usually limited plans are the target
        if (sub.invoice_limit === -1) return null;

        const currentUsage = await usageService.getCurrentUsage(companyId, 'INVOICES_ISSUED');
        const usagePercent = (currentUsage / sub.invoice_limit) * 100;

        let recommendation = null;

        // Simple Rule Engine Logic (Hardcoded for MVP reliability, usually loaded from DB rules)

        // Rule 1: High Usage (>= 85%)
        if (usagePercent >= 85) {
            recommendation = {
                planCode: 'UPGRADE', // Generic 'Next Tier'
                reason: `Você consumiu ${usagePercent.toFixed(0)}% do seu limite de notas este mês.`,
                confidence: usagePercent >= 95 ? 90 : 70
            };
        }

        // Rule 2: Growth Check (Compare with last month)
        // Would query history here.

        if (recommendation) {
            // Persist
            await pool.query(
                `INSERT INTO pricing_recommendations (company_id, current_plan_code, recommended_plan_code, reason_pt_br, confidence_score)
                 VALUES ($1, $2, $3, $4, $5)`,
                [companyId, sub.plan_code, recommendation.planCode, recommendation.reason, recommendation.confidence]
            );

            // Log Event
            await analyticsService.trackEvent('PricingRecommendationGenerated', {
                companyId,
                currentPlan: sub.plan_code,
                usagePercent,
                recommendation
            });
        }

        return recommendation;
    },

    async getLatestRecommendation(companyId: string) {
        // Run analysis on demand for MVP (or async job in real prod)
        await this.analyzeUsage(companyId);

        const res = await pool.query(
            `SELECT * FROM pricing_recommendations 
             WHERE company_id = $1 AND is_dismissed = false 
             ORDER BY created_at DESC LIMIT 1`,
            [companyId]
        );
        return res.rows[0];
    }
};
