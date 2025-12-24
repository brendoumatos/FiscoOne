import api from './api';

export interface FiscalScore {
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    explanation: Array<{ factor: string; deduction: number }>;
}

export const scoreService = {
    async getScore(companyId: string): Promise<FiscalScore> {
        const response = await api.get(`/score/${companyId}/score`);
        return response.data;
    },

    async recalculate(companyId: string): Promise<FiscalScore> {
        const response = await api.post(`/score/${companyId}/score/recalculate`);
        return response.data;
    }
};
