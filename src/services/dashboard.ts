import api from './api';
import type { DashboardStats, ActivityItem } from "@/types/dashboard";

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/summary');
        return response.data;
    },

    getRecentActivity: async (): Promise<ActivityItem[]> => {
        const response = await api.get('/timeline');
        const events = response.data as Array<{ id: string; type: string; title: string; description?: string; createdAt: string }>;
        return events.map((event) => {
            const normalizedType = (() => {
                const t = event.type?.toUpperCase?.();
                if (t === 'INVOICE') return 'INVOICE' as const;
                if (t === 'TAX') return 'TAX' as const;
                return 'SYSTEM' as const;
            })();

            return {
                id: event.id,
                type: normalizedType,
                description: event.description || event.title,
                timestamp: event.createdAt
            } satisfies ActivityItem;
        });
    }
};
