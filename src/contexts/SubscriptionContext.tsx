import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionService } from '@/services/subscription';
import { type SubscriptionData } from "@/services/subscription";

interface SubscriptionContextType {
    data: SubscriptionData | null;
    isLoading: boolean;
    refresh: () => void;
    hasFeature: (code: string) => boolean;
    canIssueInvoice: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    data: null,
    isLoading: true,
    refresh: () => { },
    hasFeature: () => false,
    canIssueInvoice: () => false
});

export const useSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { currentCompany } = useAuth();
    const [data, setData] = useState<SubscriptionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = async () => {
        if (!currentCompany) {
            setIsLoading(false);
            return;
        }
        try {
            const sub = await subscriptionService.getCurrentSubscription(currentCompany.id);
            setData(sub);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [currentCompany]);

    const hasFeature = (code: string) => data?.features.includes(code) ?? false;

    const canIssueInvoice = () => {
        if (!data) return false;

        // 1. Enterprise / Unlimited
        if (data.plan.limit === -1) return true;

        // 2. Free Plan Expiration Rule (2 Months)
        if (data.plan.code === 'FREE') {
            const createdAt = new Date(data.createdAt); // Assuming data includes createdAt or we fetch it
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            if (createdAt < sixtyDaysAgo) {
                console.warn("Free plan expired");
                return false; // Expired
            }
        }

        // 3. Usage Limit
        return data.usage.invoices < data.plan.limit;
    };

    return (
        <SubscriptionContext.Provider value={{ data, isLoading, refresh: load, hasFeature, canIssueInvoice }}>
            {children}
        </SubscriptionContext.Provider>
    );
}
