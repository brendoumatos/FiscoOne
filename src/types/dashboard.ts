export interface DashboardStats {
    monthlyRevenue: number;
    annualRevenue: number;
    invoicesIssued: number;
    pendingTaxes: number;
    pendingTasks: number;
    revenueHistory: Array<{
        month: string;
        amount: number;
    }>;
}

export interface ActivityItem {
    id: string;
    type: 'INVOICE' | 'TAX' | 'SYSTEM';
    description: string;
    timestamp: string;
}
