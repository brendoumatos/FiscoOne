
export enum ExpenseCategory {
    OFFICE = 'Escritório',
    SOFTWARE = 'Software & SaaS',
    MARKETING = 'Marketing',
    TRAVEL = 'Viagens',
    TAXES = 'Impostos',
    OTHER = 'Outros'
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    hasReceipt: boolean;
    receiptUrl?: string;
    status: 'PAID' | 'PENDING';
    companyId?: string;
}
