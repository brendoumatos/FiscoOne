import { pool } from '../config/db';

const TABLE = 'usage_counters';

export const usageService = {
    async getCurrentUsage(companyId: string, entitlementKey: string): Promise<number> {
        const result = await pool.query(
            `SELECT used_value FROM ${TABLE} WHERE company_id = $1 AND entitlement_key = $2`,
            [companyId, entitlementKey]
        );

        return result.rows[0]?.used_value ? Number(result.rows[0].used_value) : 0;
    },

    async setUsage(companyId: string, entitlementKey: string, usedValue: number): Promise<void> {
        await pool.query(
            `MERGE ${TABLE} AS target
             USING (SELECT $1 AS company_id, $2 AS entitlement_key, $3 AS used_value) AS src
             ON target.company_id = src.company_id AND target.entitlement_key = src.entitlement_key
             WHEN MATCHED THEN
                 UPDATE SET used_value = src.used_value
             WHEN NOT MATCHED THEN
                 INSERT (company_id, entitlement_key, used_value)
                 VALUES (src.company_id, src.entitlement_key, src.used_value);`,
            [companyId, entitlementKey, usedValue]
        );
    },

    async incrementUsage(companyId: string, entitlementKey: string, amount: number = 1): Promise<number> {
        const current = await this.getCurrentUsage(companyId, entitlementKey);
        const next = current + amount;
        await this.setUsage(companyId, entitlementKey, next);
        return next;
    }
};
