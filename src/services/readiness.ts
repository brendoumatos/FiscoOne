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
    async getReadiness(): Promise<FinancialReadiness> {
        const response = await api.get('/readiness/readiness');
        return response.data;
    },

    async recalculate(): Promise<FinancialReadiness> {
        const response = await api.post('/readiness/readiness/recalculate');
        return response.data;
    }
};
