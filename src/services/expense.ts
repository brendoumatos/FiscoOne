
import { ExpenseCategory, type Expense } from "@/types/expense";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockExpenses: Expense[] = [
    {
        id: '1',
        description: 'Assinatura Adobe Creative Cloud',
        amount: 299.90,
        date: new Date().toISOString(),
        category: ExpenseCategory.SOFTWARE,
        hasReceipt: true,
        status: 'PAID'
    },
    {
        id: '2',
        description: 'Aluguel Escritório Coworking',
        amount: 1500.00,
        date: new Date(new Date().setDate(5)).toISOString(),
        category: ExpenseCategory.OFFICE,
        hasReceipt: true,
        status: 'PENDING'
    },
    {
        id: '3',
        description: 'Campanha Google Ads',
        amount: 500.00,
        date: new Date(new Date().setDate(10)).toISOString(),
        category: ExpenseCategory.MARKETING,
        hasReceipt: false,
        status: 'PAID'
    }
];

export const expenseService = {
    async getExpenses(): Promise<Expense[]> {
        await delay(500);
        return mockExpenses;
    },

    async addExpense(expense: Omit<Expense, 'id' | 'hasReceipt'>): Promise<Expense> {
        await delay(500);
        const newExpense = {
            ...expense,
            id: Math.random().toString(),
            hasReceipt: false
        };
        mockExpenses.push(newExpense);
        return newExpense;
    }
};
