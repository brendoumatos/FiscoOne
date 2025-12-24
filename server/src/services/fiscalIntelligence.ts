
import { pool } from '../config/db';
import { auditLogService } from './auditLog'; // Optional linkage

export const fiscalIntelligence = {
    /**
     * Engine Core: Avaliar regras para uma empresa específica
     * Deve ser chamado:
     * 1. Após emissão de nota (Event-driven)
     * 2. Via Job diário (Scheduled)
     */
    async evaluateAllRules(companyId: string) {
        // 1. Carregar Dados Financeiros (YTD - Year to Date)
        const currentYear = new Date().getFullYear();

        // Simulação de obtenção rápida (usaria Materialized Views na vida real)
        const financials = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as ytd_revenue 
             FROM invoices 
             WHERE company_id = $1 
               AND status = 'ISSUED' 
               AND EXTRACT(YEAR FROM issue_date) = $2`,
            [companyId, currentYear]
        );

        const ytdRevenue = parseFloat(financials.rows[0].ytd_revenue);

        // 2. Carregar Regras Ativas
        const rulesRes = await pool.query(`SELECT * FROM fiscal_rules WHERE is_active = true`);
        const rules = rulesRes.rows;

        // 3. Avaliar Regras
        for (const rule of rules) {
            await this.evaluateRule(companyId, rule, { ytdRevenue });
        }
    },

    async evaluateRule(companyId: string, rule: any, data: any) {
        const condition = rule.condition_json;
        let triggered = false;
        let contextData = {};

        // Lógica de Avaliação (Hardcoded para MVP, mas extensível)

        // --- Regra: Limite MEI (81k) ---
        if (rule.code.startsWith('MEI_LIMIT_')) {
            const MEI_LIMIT = 81000;
            const threshold = MEI_LIMIT * (condition.value / 100); // Ex: 80% de 81k = 64.8k

            if (data.ytdRevenue >= threshold) {
                triggered = true;
                contextData = {
                    current: data.ytdRevenue,
                    limit: MEI_LIMIT,
                    percent: (data.ytdRevenue / MEI_LIMIT) * 100
                };
            }
        }

        // --- Output: Gerar ou Atualizar Alerta ---
        if (triggered) {
            await this.upsertAlert(companyId, rule, contextData);
        }
    },

    async upsertAlert(companyId: string, rule: any, contextData: any) {
        // Evitar duplicidade: Se já existe um alerta ATIVO para essa regra, não cria outro.
        const existing = await pool.query(
            `SELECT id FROM fiscal_alerts 
             WHERE company_id = $1 AND rule_code = $2 AND status = 'ACTIVE'`,
            [companyId, rule.code]
        );

        if (existing.rows.length === 0) {
            await pool.query(
                `INSERT INTO fiscal_alerts 
                (company_id, rule_code, severity, title, message, context_data, visibility)
                VALUES ($1, $2, $3, $4, $5, $6, 'BOTH')`, // Visibility default BOTH for safety
                [
                    companyId,
                    rule.code,
                    rule.severity,
                    rule.name,
                    rule.recommendation_pt_br, // Usando a recomendação como mensagem principal
                    contextData
                ]
            );
            console.log(`[Fiscal Intel] Alert generated for Company ${companyId}: ${rule.code}`);
        }
    },

    async getActiveAlerts(companyId: string) {
        const res = await pool.query(
            `SELECT * FROM fiscal_alerts 
             WHERE company_id = $1 AND status = 'ACTIVE' 
             ORDER BY created_at DESC`
        );
        return res.rows;
    },

    async dismissAlert(alertId: string, userId: string) {
        await pool.query(
            `UPDATE fiscal_alerts SET status = 'DISMISSED' WHERE id = $1`,
            [alertId]
        );
        // Opcional: Logar quem dispensou no Audit Log
    }
};
