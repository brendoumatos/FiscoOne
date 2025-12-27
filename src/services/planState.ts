import api from './api';

export type PlanStatus = 'ACTIVE' | 'WARNING' | 'BLOCKED' | 'GRACE' | 'EXPIRED';
export type PlanCTA = 'UPGRADE' | 'BUY_CREDITS' | 'CONTACT_SUPPORT' | null;

export interface PlanUsage {
    used: number;
    limit: number | null;
}

export interface PlanState {
    plan: {
        code: string;
        name: string;
        priceMonthly: number | null;
        priceYearly: number | null;
    };
    status: PlanStatus;
    usage: {
        invoices: PlanUsage;
        seats: PlanUsage;
        accountants: PlanUsage;
    };
    expiration: string | null;
    reason?: string;
    cta: PlanCTA;
    planCode?: string; // legacy compatibility
    limits?: {
        invoices: number | null;
        seats: number | null;
        accountants: number | null;
    };
}

export const planStateService = {
    async getPlanState(): Promise<PlanState> {
        const res = await api.get('/companies/plan-state', {
            params: { noCache: 1 },
            headers: { 'x-no-cache': '1' }
        });
        return res.data as PlanState;
    }
};
