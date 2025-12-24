import api from './api';
import type { DashboardStats, ActivityItem } from "@/types/dashboard";

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    getRecentActivity: async (): Promise<ActivityItem[]> => {
        // Still mock activity for now or implement endpoint
        return [
            { id: '1', type: 'INVOICE', description: 'Invoice #0012 issued to Client A', timestamp: new Date().toISOString() },
            { id: '2', type: 'TAX', description: 'DAS generated for December', timestamp: new Date(Date.now() - 86400000).toISOString() },
            { id: '3', type: 'SYSTEM', description: 'Company profile updated', timestamp: new Date(Date.now() - 172800000).toISOString() },
        ];
    }
};
