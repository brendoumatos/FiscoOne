import { pool } from '../config/db';

export const dashboardService = {
    async getStats(companyId: string) {
        const result = await pool.query(
            `SELECT monthly_revenue, annual_revenue, invoices_issued, pending_taxes, revenue_history
             FROM mv_monthly_financials
             WHERE company_id = $1`,
            [companyId]
        );

        if (result.rowCount === 0) {
            return {
                monthlyRevenue: 0,
                annualRevenue: 0,
                invoicesIssued: 0,
                pendingTaxes: 0,
                pendingTasks: 0,
                revenueHistory: []
            };
        }

        const row = result.rows[0];
        const history = row.revenue_history || [];

        return {
            monthlyRevenue: parseFloat(row.monthly_revenue || 0),
            annualRevenue: parseFloat(row.annual_revenue || 0),
            invoicesIssued: parseInt(row.invoices_issued || 0),
            pendingTaxes: parseFloat(row.pending_taxes || 0),
            pendingTasks: 0,
            revenueHistory: history.map((h: any) => ({
                month: h.month,
                amount: parseFloat(h.amount)
            }))
        };
    }
};
