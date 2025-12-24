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
        if (data.plan.limit === -1) return true;
        return data.usage.invoices < data.plan.limit;
    };

    return (
        <SubscriptionContext.Provider value={{ data, isLoading, refresh: load, hasFeature, canIssueInvoice }}>
            {children}
        </SubscriptionContext.Provider>
    );
}
