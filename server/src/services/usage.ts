import { pool } from '../config/db';

export const usageService = {
    async getCurrentUsage(companyId: string, metric: string): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const result = await pool.query(
            `SELECT current_value FROM usage_counters 
             WHERE company_id = $1 AND metric_code = $2 AND period_start = $3`,
            [companyId, metric, startOfMonth]
        );

        return result.rows[0]?.current_value || 0;
    },

    async incrementUsage(companyId: string, metric: string, amount: number = 1): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Upsert
        const result = await pool.query(
            `INSERT INTO usage_counters (company_id, metric_code, current_value, period_start, period_end)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (company_id, metric_code, period_start) 
             DO UPDATE SET current_value = usage_counters.current_value + $3, last_updated = NOW()
             RETURNING current_value`,
            [companyId, metric, amount, startOfMonth, endOfMonth]
        );

        return result.rows[0].current_value;
    }
};
