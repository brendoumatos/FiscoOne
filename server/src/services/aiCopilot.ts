
import { pool } from '../config/db';

interface AIRequest {
    companyId: string;
    userId: string;
    intent: 'EXPLAIN_TAX_SPIKE' | 'EXPLAIN_LIMIT_WARNING';
    targetMonth?: Date;
}

export const aiCopilotService = {
    /**
     * Main Entry Point: Safe, Context-Aware Explanation
     */
    async generateExplanation(req: AIRequest) {
        // 1. Build Ground Truth Context (No hallucinations permissible)
        const context = await this.buildContext(req);

        // 2. Select & Hydrate Template
        const templateCode = `${req.intent}_V1`; // Simple versioning mapping
        const template = await this.getTemplate(templateCode); // Mocked or DB fetch

        const prompt = this.hydratePrompt(template, context);

        // 3. Call LLM (Mocked for this stage)
        const aiResponse = await this.mockLLMCall(prompt);

        // 4. Apply Safety Wrapper
        const finalOutput = `${aiResponse}\n\n⚠️ **${template.disclaimer}**`;

        // 5. Audit Log (Immutability)
        await this.logInteraction(req, context, finalOutput);

        return {
            explanation: finalOutput,
            contextUsed: context, // Transparency: Show user what data was used
            reviewStatus: 'PENDING_ACCOUNTANT_REVIEW'
        };
    },

    async buildContext(req: AIRequest) {
        // Fetches ACTUAL database values. 
        // The AI never guesses numbers; it only reads provided context.

        if (req.intent === 'EXPLAIN_TAX_SPIKE') {
            // Example: Fetch comparison data
            return {
                currentRevenue: 50000, // Would be DB query
                lastRevenue: 20000,
                taxRate: 0.06,
                spikeFactor: 2.5
            };
        } else if (req.intent === 'EXPLAIN_LIMIT_WARNING') {
            return {
                ytdRevenue: 65000,
                limit: 81000,
                percentUsed: 80.2
            };
        }
        return {};
    },

    async getTemplate(code: string) {
        // Simulating DB fetch from ai_prompt_templates
        if (code.includes('TAX_SPIKE')) {
            return {
                system: "You are a helpful Fiscal Assistant.",
                structure: "User revenue jumped from {{lastRevenue}} to {{currentRevenue}}. Tax rate is {{taxRate}}. Explain that higher revenue leads to higher absolute tax, even if rate is constant.",
                disclaimer: "Explicação gerada por IA. Valide com seu contador."
            };
        }
        return {
            system: "Assistant",
            structure: "Analyze: {{ytdRevenue}} vs {{limit}}.",
            disclaimer: "IA Consultiva. Não substitui parecer legal."
        };
    },

    hydratePrompt(template: any, context: any) {
        let prompt = template.structure;
        for (const key of Object.keys(context)) {
            prompt = prompt.replace(`{{${key}}}`, context[key]);
        }
        return prompt;
    },

    async mockLLMCall(prompt: string) {
        // Simulate a calm, professional response
        return `Observamos que sua receita aumentou significativamente em relação ao mês anterior (Fator 2.5x). Como o imposto no Simples Nacional/MEI incide sobre o faturamento, um aumento na base de cálculo gera um aumento proporcional no imposto a pagar. Não detectamos alteração na alíquota, apenas no volume faturado.`;
    },

    async logInteraction(req: AIRequest, context: any, output: string) {
        await pool.query(
            `INSERT INTO ai_interactions 
            (company_id, user_id, intent, input_context_json, generated_explanation)
            VALUES ($1, $2, $3, $4, $5)`,
            [req.companyId, req.userId, req.intent, JSON.stringify(context), output]
        );
    }
};
