import api from './api';

export interface FiscalScore {
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    explanation: Array<{ factor: string; deduction: number }>;
}

export const scoreService = {
    async getScore(): Promise<FiscalScore> {
        const response = await api.get('/score/score');
        return response.data;
    },

    async recalculate(): Promise<FiscalScore> {
        const response = await api.post('/score/score/recalculate');
        return response.data;
    }
};
