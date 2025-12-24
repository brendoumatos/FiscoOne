
import { pool } from '../config/db';

export const dataProductsService = {
    /**
     * Generates strategic insights comparing Company vs Market.
     */
    async generateMarketInsights(companyId: string) {
        // 1. Get Company Profile & Stats
        const profileRes = await pool.query(
            `SELECT tax_regime, SUBSTRING(cnae, 1, 2) as sector_code, address_state 
             FROM companies WHERE id = $1`,
            [companyId]
        );
        const profile = profileRes.rows[0];

        // 2. Get Last Month's Revenue for Company
        const myStatsRes = await pool.query(
            `SELECT SUM(amount) as revenue 
             FROM invoices 
             WHERE company_id = $1 
               AND status = 'ISSUED' 
               AND issue_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
               AND issue_date < DATE_TRUNC('month', CURRENT_DATE)`,
            [companyId]
        );
        const myRevenue = parseFloat(myStatsRes.rows[0]?.revenue || '0');

        // 3. Get Benchmark Data (Matching Segment)
        const benchmarkRes = await pool.query(
            `SELECT p25_revenue, p50_revenue, p75_revenue, avg_revenue, sample_size 
             FROM mv_benchmark_revenue 
             WHERE tax_regime = $1 
               AND sector_code = $2 
               AND region_macro = $3
               AND reference_month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE`,
            [profile.tax_regime, profile.sector_code, profile.address_state]
        );

        const market = benchmarkRes.rows[0];

        if (!market) {
            return null; // Not enough data for k-anonymity yet
        }

        // 4. Compare and Generate Message
        const insights = [];

        // REVENUE POSITION
        if (myRevenue > market.p75_revenue) {
            insights.push({
                category: 'REVENUE_POSITION',
                key: 'MARKET_LEADER',
                message: `Desempenho de Elite: Sua receita está no Top 25% do setor ${profile.sector_code} em ${profile.address_state}.`,
                data: { my: myRevenue, p75: market.p75_revenue }
            });
        } else if (myRevenue < market.p25_revenue) {
            insights.push({
                category: 'REVENUE_POSITION',
                key: 'BELOW_MARKET',
                message: `Oportunidade de Crescimento: Sua receita está abaixo da média de mercado (R$ ${parseFloat(market.avg_revenue).toFixed(2)}).`,
                data: { my: myRevenue, avg: market.avg_revenue }
            });
        } else {
            insights.push({
                category: 'REVENUE_POSITION',
                key: 'MARKET_AVERAGE',
                message: `Desempenho Sólido: Você está dentro da média de mercado para o seu setor.`,
                data: { my: myRevenue, avg: market.avg_revenue }
            });
        }

        // 5. Persist Insights
        for (const insight of insights) {
            await pool.query(
                `INSERT INTO benchmark_insights_cache 
                 (company_id, category, insight_key, message_pt_br, comparison_data, expires_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '7 days')`,
                [companyId, insight.category, insight.key, insight.message, insight.data]
            );
        }

        return insights;
    },

    /**
     * Get public (aggregated) market trends for landing pages or teasers.
     */
    async getPublicTrends(state: string, sectorCode: string) {
        const res = await pool.query(
            `SELECT reference_month, avg_revenue 
             FROM mv_benchmark_revenue 
             WHERE sector_code = $1 AND region_macro = $2
             ORDER BY reference_month DESC LIMIT 6`,
            [sectorCode, state]
        );
        return res.rows;
    }
};
