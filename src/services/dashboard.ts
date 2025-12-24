
import type { DashboardStats, ActivityItem } from "@/types/dashboard";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        await delay(1000);
        return {
            monthlyRevenue: 15430.00,
            annualRevenue: 68000.00, // Mock: approaching MEI limit (81k)
            invoicesIssued: 12,
            pendingTaxes: 1450.00,
            pendingTasks: 3,
            revenueHistory: [
                { month: 'Jan', amount: 12000 },
                { month: 'Fev', amount: 15430 },
                { month: 'Mar', amount: 14200 },
            ]
        };
    },

    getRecentActivity: async (): Promise<ActivityItem[]> => {
        await delay(600);
        return [
            { id: '1', type: 'INVOICE', description: 'Invoice #0012 issued to Client A', timestamp: new Date().toISOString() },
            { id: '2', type: 'TAX', description: 'DAS generated for December', timestamp: new Date(Date.now() - 86400000).toISOString() },
            { id: '3', type: 'SYSTEM', description: 'Company profile updated', timestamp: new Date(Date.now() - 172800000).toISOString() },
        ];
    }
};
