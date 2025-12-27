
import api from './api';
import { type Expense } from "@/types/expense";

export const expenseService = {
    async getExpenses(): Promise<Expense[]> {
        try {
            const { data } = await api.get('/expenses');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao carregar despesas', error);
            return [];
        }
    },

    async addExpense(expense: Omit<Expense, 'id' | 'hasReceipt'>): Promise<Expense> {
        try {
            const { data } = await api.post('/expenses', expense);
            if (data) return data;
        } catch (error) {
            console.error('Erro ao adicionar despesa', error);
        }

        return {
            ...expense,
            id: crypto.randomUUID?.() || String(Date.now()),
            hasReceipt: false
        } as Expense;
    }
};
