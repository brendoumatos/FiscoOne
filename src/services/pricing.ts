import api from './api';

export interface PricingInsight {
    reason_pt_br: string;
    recommended_plan_code: string;
    confidence_score: number;
}

export interface PublicPlanEntitlement {
    key: string;
    limit: number | null;
}

export interface PublicPlan {
    code: string;
    name: string;
    description?: string | null;
    priceMonthly: number | null;
    priceYearly: number | null;
    invoiceLimit: number | null;
    seatLimit: number | null;
    accountantLimit: number | null;
    extraInvoicePrice: number | null;
    extraSeatPrice: number | null;
    features: string[];
    entitlements: PublicPlanEntitlement[];
    updatedAt?: string | null;
}

type PublicPlanApi = {
    code: string;
    name: string;
    description?: string | null;
    description_pt_br?: string | null;
    priceMonthly?: number | null;
    price_monthly?: number | null;
    priceYearly?: number | null;
    price_yearly?: number | null;
    invoice_limit?: number | null;
    seat_limit?: number | null;
    accountant_limit?: number | null;
    extra_invoice_price?: number | null;
    extra_seat_price?: number | null;
    features?: string[];
    entitlements?: PublicPlanEntitlement[];
    updated_at?: string | null;
};

const normalizeLimit = (value?: number | null): number | null => {
    if (value === undefined || value === null) return null;
    return value === -1 ? null : Number(value);
};

const normalizePlan = (plan: PublicPlanApi): PublicPlan => {
    const entitlements = (plan.entitlements ?? []).map((ent) => ({
        key: ent.key,
        limit: normalizeLimit(ent.limit)
    }));

    const entitlementMap = entitlements.reduce<Record<string, number | null>>((acc, item) => {
        acc[item.key.toUpperCase()] = item.limit;
        return acc;
    }, {});

    const invoiceLimit = normalizeLimit(plan.invoice_limit) ?? entitlementMap.INVOICES ?? null;
    const seatLimit = normalizeLimit(plan.seat_limit) ?? entitlementMap.SEATS ?? null;
    const accountantLimit = normalizeLimit(plan.accountant_limit) ?? entitlementMap.ACCOUNTANTS ?? null;

    return {
        code: plan.code,
        name: plan.name,
        description: plan.description ?? plan.description_pt_br ?? null,
        priceMonthly: plan.priceMonthly ?? plan.price_monthly ?? null,
        priceYearly: plan.priceYearly ?? plan.price_yearly ?? null,
        invoiceLimit,
        seatLimit,
        accountantLimit,
        extraInvoicePrice: plan.extra_invoice_price ?? null,
        extraSeatPrice: plan.extra_seat_price ?? null,
        features: plan.features ?? [],
        entitlements: entitlements.length ? entitlements : [
            invoiceLimit !== null ? { key: 'INVOICES', limit: invoiceLimit } : null,
            seatLimit !== null ? { key: 'SEATS', limit: seatLimit } : null,
            accountantLimit !== null ? { key: 'ACCOUNTANTS', limit: accountantLimit } : null
        ].filter(Boolean) as PublicPlanEntitlement[],
        updatedAt: plan.updated_at ?? null
    };
};

export const pricingService = {
    async getInsight(): Promise<PricingInsight | null> {
        const response = await api.get('/pricing/insight');
        return response.data;
    },

    async getPublicPlans(): Promise<PublicPlan[]> {
        const response = await api.get('/public/plans');
        const data = Array.isArray(response.data) ? response.data : [];
        return data.map(normalizePlan);
    }
};
