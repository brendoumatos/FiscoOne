import api from './api';

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
    async getReadiness(companyId: string): Promise<FinancialReadiness> {
        const response = await api.get(`/readiness/${companyId}/readiness`);
        return response.data;
    },

    async recalculate(companyId: string): Promise<FinancialReadiness> {
        const response = await api.post(`/readiness/${companyId}/readiness/recalculate`);
        return response.data;
    }
};
