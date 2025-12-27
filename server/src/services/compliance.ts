
import { pool } from '../config/db';
import { auditLogService } from './auditLog';

export const complianceService = {
    /**
     * Critical Check: Can we write to this date?
     * Should be called by InvoiceService before Create/Update/Cancel.
     */
    async checkPeriodLock(companyId: string, targetDate: Date): Promise<boolean> {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1; // 1-12

        const res = await pool.query(
            `SELECT status FROM fiscal_periods 
             WHERE company_id = $1 AND ref_year = $2 AND ref_month = $3`,
            [companyId, year, month]
        );

        if (res.rows.length === 0) return true; // Open by default if not strictly defined

        const status = res.rows[0].status;
        return status === 'OPEN';
    },

    /**
     * Closes a fiscal period, effectively making it READ-ONLY.
     * Requires "FINANCE" or "OWNER" role (enforced by RBAC layer).
     */
    async closePeriod(companyId: string, year: number, month: number, userId: string, summarySnapshot: any) {
        // 1. Verify integrity checks can run here (e.g. no draft invoices)

        // 2. Lock the period
        await pool.query(
            `MERGE fiscal_periods AS target
             USING (SELECT $1 AS company_id, $2 AS ref_year, $3 AS ref_month) AS src
             ON target.company_id = src.company_id AND target.ref_year = src.ref_year AND target.ref_month = src.ref_month
             WHEN MATCHED THEN
                 UPDATE SET status = 'LOCKED', closed_at = SYSUTCDATETIME(), closed_by_user_id = $4, summary_snapshot = $5
             WHEN NOT MATCHED THEN
                 INSERT (company_id, ref_year, ref_month, status, closed_at, closed_by_user_id, summary_snapshot)
                 VALUES (src.company_id, src.ref_year, src.ref_month, 'LOCKED', SYSUTCDATETIME(), $4, $5);`,
            [companyId, year, month, userId, summarySnapshot]
        );

        // 3. Log Compliance Event
        await auditLogService.log({
            // @ts-ignore - Mocking context for internal service call if needed, or caller passes context
            req: { user: { id: userId }, context: { companyId } } as any,
            action: 'COMPANY_SETTINGS_UPDATED', // Mapping to generic or create new type
            entityType: 'COMPANY',
            entityId: `${year}-${month}`,
            afterState: { status: 'LOCKED', summary: summarySnapshot }
        });
    },

    /**
     * Configuration Versioning
     * Called whenever vital fiscal info changes.
     */
    async trackConfigurationChange(companyId: string, userId: string, newConfig: any, reason: string) {
        // 1. Expire current config (set valid_until = NOW)
        await pool.query(
            `UPDATE fiscal_config_history 
             SET valid_until = SYSUTCDATETIME() 
             WHERE company_id = $1 AND valid_until IS NULL`,
            [companyId]
        );

        // 2. Insert new config
        await pool.query(
            `INSERT INTO fiscal_config_history (company_id, changed_by_user_id, change_reason_pt_br, config_snapshot)
             VALUES ($1, $2, $3, $4)`,
            [companyId, userId, reason, newConfig]
        );
    }
};
