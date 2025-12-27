
import api from './api';
import { TaxStatus, TaxType, type TaxGuide, type TaxSummary } from "@/types/tax";

export const taxService = {
    async getGuides(): Promise<TaxGuide[]> {
        try {
            const { data } = await api.get('/taxes/guides');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao carregar guias', error);
            return [];
        }
    },

    async getSummary(): Promise<TaxSummary> {
        try {
            const { data } = await api.get('/taxes/summary');
            if (data) return data;
        } catch (error) {
            console.error('Erro ao carregar resumo de impostos', error);
        }

        return {
            totalPending: 0,
            nextDueDate: null,
            overdueAmount: 0
        };
    },

    async generateGuide(period: string, type: TaxType): Promise<TaxGuide> {
        try {
            const { data } = await api.post('/taxes/guides', { period, type });
            if (data) return data;
        } catch (error) {
            console.error('Erro ao gerar guia', error);
        }

        return {
            id: crypto.randomUUID?.() || String(Date.now()),
            type,
            description: `${type} - ${period}`,
            period,
            dueDate: new Date().toISOString(),
            amount: 0,
            status: TaxStatus.PENDING
        };
    }
};
