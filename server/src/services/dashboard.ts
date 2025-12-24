import { pool } from '../config/db';

export const dashboardService = {
    async getStats(companyId: string) {
        // CTE to aggregate data from multiple tables efficiently
        const result = await pool.query(
            `WITH MonthlyInvoices AS (
                SELECT 
                    COALESCE(SUM(amount), 0) as monthly_revenue,
                    COUNT(*) as invoices_issued
                FROM invoices 
                WHERE company_id = $1 
                  AND status = 'ISSUED'
                  AND issue_date >= date_trunc('month', CURRENT_DATE)
             ),
             AnnualInvoices AS (
                SELECT 
                    COALESCE(SUM(amount), 0) as annual_revenue
                FROM invoices 
                WHERE company_id = $1 
                  AND status = 'ISSUED'
                  AND issue_date >= date_trunc('year', CURRENT_DATE)
             ),
             PendingTaxes AS (
                 -- Placeholder table for taxes if not fully implemented, or use invoices with status 'SCHEDULED'?
                 -- Assuming 'fiscal_obligations' table exists as per readiness service check
                 SELECT COALESCE(SUM(amount), 0) as pending_taxes 
                 FROM fiscal_obligations 
                 WHERE company_id = $1 AND status = 'PENDING'
             ),
             RevenueHistory AS (
                 SELECT 
                    to_char(issue_date, 'Mon') as month_name,
                    SUM(amount) as amount,
                    EXTRACT(MONTH FROM issue_date) as month_num
                 FROM invoices
                 WHERE company_id = $1 
                   AND status = 'ISSUED'
                   AND issue_date > NOW() - INTERVAL '6 months'
                 GROUP BY 1, 3
             )
             SELECT 
                (SELECT monthly_revenue FROM MonthlyInvoices) as monthly_revenue,
                (SELECT annual_revenue FROM AnnualInvoices) as annual_revenue,
                (SELECT invoices_issued FROM MonthlyInvoices) as invoices_issued,
                (SELECT pending_taxes FROM PendingTaxes) as pending_taxes,
                (
                    SELECT json_agg(rh ORDER BY month_num) 
                    FROM RevenueHistory rh
                ) as revenue_history`,
            [companyId]
        );

        const row = result.rows[0];

        // Format history
        const history = row.revenue_history || [];

        return {
            monthlyRevenue: parseFloat(row.monthly_revenue),
            annualRevenue: parseFloat(row.annual_revenue),
            invoicesIssued: parseInt(row.invoices_issued),
            pendingTaxes: parseFloat(row.pending_taxes),
            pendingTasks: 3, // Mock for now until we have task table
            revenueHistory: history.map((h: any) => ({
                month: h.month_name,
                amount: parseFloat(h.amount)
            }))
        };
    }
};
