import api from './api';
import type { DashboardStats, ActivityItem, DashboardAlert } from "@/types/dashboard";

const normalizeAlert = (alert: any): DashboardAlert => {
    const severity = (alert?.severity || alert?.level || "info").toString().toLowerCase();
    const normalizedSeverity: DashboardAlert["severity"] = severity === "critical" ? "critical" : severity === "warning" ? "warning" : "info";

    return {
        id: alert?.id || alert?.code || crypto.randomUUID?.() || String(Math.random()),
        message: alert?.message || alert?.title || "",
        severity: normalizedSeverity,
        timestamp: alert?.timestamp || alert?.createdAt || new Date().toISOString(),
        source: alert?.source,
        ctaLabel: alert?.ctaLabel,
    } satisfies DashboardAlert;
};

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/summary');
        const data = response.data || {};

        const alerts = Array.isArray(data.alerts) ? data.alerts.map(normalizeAlert) : [];

        return {
            invoicesCount: data.invoicesCount ?? data.invoices?.count ?? 0,
            invoicesBlocked: data.invoicesBlocked ?? data.invoices?.blocked ?? 0,
            taxesDue: data.taxesDue ?? data.taxes?.due ?? 0,
            taxesOverdue: data.taxesOverdue ?? data.taxes?.overdue ?? 0,
            alerts,
            lastUpdated: data.lastUpdated || data.updatedAt,
        } satisfies DashboardStats;
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
