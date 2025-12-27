export type AlertSeverity = "info" | "warning" | "critical";

export interface DashboardAlert {
    id: string;
    message: string;
    severity: AlertSeverity;
    timestamp: string;
    source?: string;
    ctaLabel?: string;
}

export interface DashboardStats {
    invoicesCount: number;
    invoicesBlocked: number;
    taxesDue: number;
    taxesOverdue: number;
    alerts: DashboardAlert[];
    lastUpdated?: string;
}

export interface ActivityItem {
    id: string;
    type: "INVOICE" | "TAX" | "SYSTEM";
    description: string;
    timestamp: string;
}
