import api from './api';

export interface PricingInsight {
    reason_pt_br: string;
    recommended_plan_code: string;
    confidence_score: number;
}

export interface PublicPlanEntitlement {
    key: string;
    limit: number | null;
}

export interface PublicPlan {
    code: string;
    name: string;
    description?: string | null;
    priceMonthly: number | null;
    priceYearly: number | null;
    entitlements: PublicPlanEntitlement[];
}

export const pricingService = {
    async getInsight(): Promise<PricingInsight | null> {
        const response = await api.get('/pricing/insight');
        return response.data;
    },

    async getPublicPlans(): Promise<PublicPlan[]> {
        const response = await api.get('/pricing/plans');
        return response.data;
    }
}
