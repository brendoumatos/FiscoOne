import api from './api';

export interface PricingInsight {
    reason_pt_br: string;
    recommended_plan_code: string;
    confidence_score: number;
}

export const pricingService = {
    async getInsight(companyId: string): Promise<PricingInsight | null> {
        const response = await api.get(`/pricing/${companyId}/insight`);
        return response.data;
    }
}
