import { pool } from '../config/db';
import { scoreService } from './score';

export interface FinancialReadiness {
    status: 'READY' | 'ATTENTION' | 'NOT_READY';
    summary: {
        avgMonthlyRevenue: number;
        revenueStability: 'HIGH' | 'MEDIUM' | 'LOW';
        taxRegularity: boolean;
        fiscalScore: number;
    };
    explanation: string;
}

export const readinessService = {
    async calculateReadiness(companyId: string): Promise<FinancialReadiness> {
        // 1. Get Fiscal Score
        const fiscalScoreData = await scoreService.getLatestScore(companyId);
        const fiscalScore = fiscalScoreData.score;

        // 2. Calculate Avg Revenue & Stability (Last 6 months) via CTE
        const revenueResult = await pool.query(
                        `WITH MonthlyStats AS (
                                SELECT 
                                        FORMAT(issue_date, 'yyyy-MM') as month_str, 
                                        SUM(amount) as total_amount
                                FROM invoices 
                                WHERE company_id = $1 
                                    AND status = 'ISSUED' 
                                    AND issue_date > DATEADD(month, -6, SYSUTCDATETIME())
                                GROUP BY FORMAT(issue_date, 'yyyy-MM')
                         )
                         SELECT 
                                COALESCE(AVG(total_amount), 0) as avg_revenue,
                                COUNT(*) as month_count
                         FROM MonthlyStats`,
            [companyId]
        );

        const avgRevenue = parseFloat(revenueResult.rows[0]?.avg_revenue || '0');
        const monthCount = parseInt(revenueResult.rows[0]?.month_count || '0');

        // Stability Logic
        let stability: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (monthCount < 3) {
            stability = 'LOW';
        } else {
            stability = 'HIGH';
        }

        // 3. Tax Regularity (Check if any late obligations recently)
        const lateResult = await pool.query(
            `SELECT COUNT(*) as count FROM fiscal_obligations 
             WHERE company_id = $1 AND status = 'LATE' AND due_date > DATEADD(month, -3, SYSUTCDATETIME())`,
            [companyId]
        );
        const hasRecentLateTaxes = parseInt(lateResult.rows[0]?.count || '0') > 0;

        // 4. Determine Readiness
        let status: 'READY' | 'ATTENTION' | 'NOT_READY' = 'READY';
        let explanation = "Sua empresa apresenta excelentes indicadores para análise de crédito.";

        if (fiscalScore < 60 || hasRecentLateTaxes) {
            status = 'NOT_READY';
            explanation = "Existem pendências fiscais ou score baixo que impedem a prontidão para crédito no momento.";
        } else if (stability === 'LOW' || avgRevenue < 1000) {
            status = 'ATTENTION';
            explanation = "Seu histórico de faturamento ainda é recente ou baixo para uma análise robusta.";
        }

        const summary = {
            avgMonthlyRevenue: avgRevenue,
            revenueStability: stability,
            taxRegularity: !hasRecentLateTaxes,
            fiscalScore
        };

        // 5. Persist
        await pool.query(
            `INSERT INTO financial_readiness_profiles (company_id, status, profile_summary_json)
             VALUES ($1, $2, $3)`,
            [companyId, status, JSON.stringify(summary)]
        );

        return { status, summary, explanation };
    },

    async getLatestReadiness(companyId: string) {
        const result = await pool.query(
            `SELECT status, profile_summary_json, computed_at 
             FROM financial_readiness_profiles 
             WHERE company_id = $1 
             ORDER BY computed_at DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY`,
            [companyId]
        );

        if (result.rows.length === 0) {
            return this.calculateReadiness(companyId);
        }

        return {
            status: result.rows[0].status,
            explanation: result.rows[0].status === 'READY'
                ? "Sua empresa apresenta excelentes indicadores para análise de crédito."
                : "Indicadores requerem atenção.", // Simplification, ideally store explanation in DB too
            summary: JSON.parse(result.rows[0].profile_summary_json)
        };
    }
};
