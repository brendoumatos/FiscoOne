import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionService } from '@/services/subscription';
import type { SubscriptionData } from "@/services/subscription";
import { usePlanState } from "./PlanStateContext";

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
    const { status: planStatus, usage: planUsage } = usePlanState();

    const load = async () => {
        if (!currentCompany) {
            setIsLoading(false);
            return;
        }
        try {
            const sub = await subscriptionService.getCurrentSubscription();
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
        if (!planUsage) return false;
        if ((planStatus || 'ACTIVE') === 'BLOCKED') return false;
        const limit = planUsage.invoices.limit;
        if (limit === null) return true;
        return planUsage.invoices.used < limit;
    };

    const canAddCollaborator = () => {
        if (!planUsage) return false;
        const limit = planUsage.seats.limit;
        if (limit === null) return true;
        return planUsage.seats.used < limit;
    };

    return (
        <SubscriptionContext.Provider value={{ data, isLoading, refresh: load, hasFeature, canIssueInvoice, canAddCollaborator }}>
            {children}
        </SubscriptionContext.Provider>
    );
}
