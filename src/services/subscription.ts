import api from './api';

export interface PlanInfo {
    name: string;
    code: string;
    limit: number;
    cycle?: 'MONTHLY' | 'ANNUAL';
}

export interface UsageInfo {
    invoices: number;
}

export interface SubscriptionData {
    plan: PlanInfo;
    usage: UsageInfo;
    features: string[];
}

export const subscriptionService = {
    async getCurrentSubscription(companyId?: string): Promise<SubscriptionData> {
        const params = companyId ? { companyId } : {};
        const response = await api.get('/subscriptions/current', { params });
        return response.data;
    }
};
