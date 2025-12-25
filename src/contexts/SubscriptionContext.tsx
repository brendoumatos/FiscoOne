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
    canAddCollaborator: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    data: null,
    isLoading: true,
    refresh: () => { },
    hasFeature: () => false,
    canIssueInvoice: () => false,
    canAddCollaborator: () => false
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

        // 2. Free Plan Expiration Rule (use explicit expirationDate if provided)
        if (data.plan.code === 'FREE' && data.expirationDate) {
            const exp = new Date(data.expirationDate);
            if (Date.now() > exp.getTime()) return false;
        }

        // 3. Usage Limit
        return data.usage.invoices < data.plan.limit;
    };

    const canAddCollaborator = () => {
        if (!data) return false;
        if (data.seatLimit === undefined || data.currentCollaborators === undefined) return false;
        if (data.seatLimit === -1) return true;
        return data.currentCollaborators < data.seatLimit;
    };

    return (
        <SubscriptionContext.Provider value={{ data, isLoading, refresh: load, hasFeature, canIssueInvoice, canAddCollaborator }}>
            {children}
        </SubscriptionContext.Provider>
    );
}
