import { pool } from '../config/db';

export interface FiscalScore {
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    explanation: Array<{ factor: string; deduction: number }>;
}

export const scoreService = {
    async calculateScore(companyId: string): Promise<FiscalScore> {
        // Base Score
        let score = 100;
        const explanation: Array<{ factor: string; deduction: number }> = [];

        // 1. Check Late Payments (Last 12 months)
        // In a real scenario, we'd query 'fiscal_obligations' where status = 'LATE'
        // For MVP, we'll check if table exists and query, or default to 0 deductions if empty.
        const lateResult = await pool.query(
            `SELECT COUNT(*) as count FROM fiscal_obligations 
             WHERE company_id = $1 AND status = 'LATE' AND due_date > DATEADD(month, -12, SYSUTCDATETIME())`,
            [companyId]
        );
        const lateCount = parseInt(lateResult.rows[0]?.count || '0');

        if (lateCount > 0) {
            const deduction = lateCount * 10;
            score -= deduction;
            explanation.push({ factor: `${lateCount} pagamentos atrasados últimos 12 meses`, deduction });
        }

        // 2. Check Revenue Limit (MEI / Simples)
        // Assume retrieving revenue from invoices
        const revenueResult = await pool.query(
            `SELECT SUM(amount) as total FROM invoices 
             WHERE company_id = $1 AND issue_date > DATEADD(month, -12, SYSUTCDATETIME()) AND status = 'ISSUED'`,
            [companyId]
        );
        const annualRevenue = parseFloat(revenueResult.rows[0]?.total || '0');
        const MEI_LIMIT = 81000;

        // Simplification: Check against MEI limit if we knew tax regime. 
        // For now, let's just create a generic rule: If revenue > 81k, flag it as "High Revenue Watch" just for demo logic
        // Ideally we check company.tax_regime.
        const companyResult = await pool.query('SELECT tax_regime FROM companies WHERE id = $1', [companyId]);
        const taxRegime = companyResult.rows[0]?.tax_regime;

        if (taxRegime === 'MEI' && annualRevenue > MEI_LIMIT * 0.9) {
            const deduction = 15;
            score -= deduction;
            explanation.push({ factor: 'Receita próxima ao limite MEI', deduction });
        }

        // 3. Consistency Check (Audit Logs - Placeholder)
        // If we had audit_logs, we'd query them here.

        // 4. Collaboration & Governance Check (Bus Factor Risk)
        // Count active members including owner
        const membersRes = await pool.query(
            `SELECT COUNT(*) as count FROM company_members WHERE company_id = $1 AND status = 'ACTIVE'`,
            [companyId]
        );
        // Owner is always 1 (assuming owner table structure). 
        // Ideally we unite owner + members. Let's assume company_members stores ONLY extra members.
        // So total = 1 (owner) + members.
        const memberCount = parseInt(membersRes.rows[0]?.count || '0');
        const totalUsers = 1 + memberCount;

        if (totalUsers === 1) {
            const deduction = 5;
            score -= deduction;
            explanation.push({ factor: 'Centralização de Risco Operacional (Apenas 1 usuário)', deduction });
        } else {
            // Bonus for distributed governance (Up to a cap)
            // No direct points added to stay within 0-100 logic (start at 100 and deduct), 
            // BUT we can "refund" previous deductions or just not deduct.
            // Let's actually give a positive reinforcement via explanation if score > 90
            // Or strictly: if roles are distributed. 
            // Let's check roles.
            const rolesRes = await pool.query(
                `SELECT DISTINCT role FROM company_members WHERE company_id = $1`,
                [companyId]
            );
            if (rolesRes.rows.length > 1) {
                // Good distribution
                // Maybe add "Stability Bonus" if score < 100? 
                // Simple logic for now: No deduction = good.
                // We add a "Zero Deduction" explanation to reinforce behavior? 
                // No, standard is "Explanation of penalties".
                // Use "Positive Factors" ? The interface expects "deduction".
                // Let's stick to deductions for negative only.
            }
        }

        // 5. Inactive Users Check (Risk Security)
        // Check for users in this company (owner + members) who haven't logged in for 30 days
        // We'd need to join company_members -> users, and companies -> owner -> users
        const inactiveRes = await pool.query(
            `WITH CompanyUsers AS (
                SELECT user_id FROM company_members WHERE company_id = $1 AND status = 'ACTIVE'
                UNION
                SELECT owner_id as user_id FROM companies WHERE id = $1
             )
             SELECT COUNT(*) as count 
             FROM users u
             JOIN CompanyUsers cu ON u.id = cu.user_id
             WHERE u.last_login_at < DATEADD(day, -30, SYSUTCDATETIME())`,
            [companyId]
        );
        const inactiveCount = parseInt(inactiveRes.rows[0]?.count || '0');

        if (inactiveCount > 0) {
            const deduction = 5 * inactiveCount;
            score -= deduction;
            explanation.push({ factor: `${inactiveCount} usuários inativos (>30 dias) - Risco de Segurança`, deduction });
        }

        // Clamp Score
        score = Math.max(0, Math.min(100, score));

        // Determine Level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (score < 50) riskLevel = 'HIGH';
        else if (score < 80) riskLevel = 'MEDIUM';

        // 4. Persist Score History
        await pool.query(
            `INSERT INTO fiscal_trust_scores (company_id, score, risk_level, explanation_json)
             VALUES ($1, $2, $3, $4)`,
            [companyId, score, riskLevel, JSON.stringify(explanation)]
        );

        return { score, riskLevel, explanation };
    },

    async getLatestScore(companyId: string) {
        const result = await pool.query(
            `SELECT score, risk_level, explanation_json, computed_at 
             FROM fiscal_trust_scores 
             WHERE company_id = $1 
             ORDER BY computed_at DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY`,
            [companyId]
        );

        if (result.rows.length === 0) {
            // First time calculation
            return this.calculateScore(companyId);
        }

        const row = result.rows[0];
        return {
            score: row.score,
            riskLevel: row.risk_level,
            explanation: row.explanation_json ? JSON.parse(row.explanation_json) : [],
            computedAt: row.computed_at
        };
    }
};
