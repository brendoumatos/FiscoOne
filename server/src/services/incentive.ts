import { pool } from '../config/db';
import { creditService } from './credit';

export const incentiveService = {
    async grantAnnualIncentives(subscriptionId: string, planCode: string, companyId: string) {
        // 1. Get Rules
        const rulesRes = await pool.query(
            `SELECT * FROM annual_incentive_rules WHERE plan_code = $1 AND is_active = true`,
            [planCode]
        );

        if (rulesRes.rows.length === 0) return;

        // 2. Grant Benefits
        for (const rule of rulesRes.rows) {
            const finalValue = rule.base_credit_value * rule.multiplier;

            // Grant Service Credit
            await creditService.grantCredit(
                companyId,
                rule.base_credit_type,
                finalValue,
                365, // Valid for 1 year
                'ANNUAL_SUBSCRIPTION_BONUS'
            );

            // Log Benefit
            await pool.query(
                `INSERT INTO subscription_benefits (subscription_id, benefit_type, benefit_value)
                 VALUES ($1, $2, $3)`,
                [subscriptionId, rule.base_credit_type, finalValue]
            );
        }
    }
};
