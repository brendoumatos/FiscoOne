import api from './api';

export interface PricingInsight {
    reason_pt_br: string;
    recommended_plan_code: string;
    confidence_score: number;
}

export const pricingService = {
    async getInsight(): Promise<PricingInsight | null> {
        const response = await api.get('/pricing/insight');
        return response.data;
    }
}
