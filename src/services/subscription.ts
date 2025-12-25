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
    createdAt: string; // ISO Date of company creation
    expirationDate?: string | null;
    seatLimit?: number;
    currentCollaborators?: number;
}

export const subscriptionService = {
    async getCurrentSubscription(companyId?: string): Promise<SubscriptionData> {
        if (!companyId) throw new Error('companyId is required to fetch subscription');
        const response = await api.get(`/subscriptions/${companyId}/current`);
        return response.data;
    }
};
