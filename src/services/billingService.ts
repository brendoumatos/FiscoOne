import api from "./api";

export interface Subscription {
    id: string;
    planCode: string;
    status: string;
    renewalDate?: string;
    paymentMethod?: { brand: string; last4: string };
    grace?: boolean;
}

export const billingService = {
    async getSubscription(): Promise<Subscription> {
        const { data } = await api.get("/billing/subscription");
        return data;
    },

    async upgrade(planCode: string): Promise<Subscription> {
        const { data } = await api.post("/billing/upgrade", { planCode });
        return data;
    }
};
