import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { planStateService, type PlanCTA, type PlanState, type PlanStatus } from "@/services/planState";
import { demoService } from "@/services/demo";

interface PlanStateContextType {
    data: PlanState | null;
    status: PlanStatus | null;
    usage: PlanState["usage"] | null;
    limits: PlanState["limits"] | null;
    cta: PlanCTA;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const PlanStateContext = createContext<PlanStateContextType | undefined>(undefined);

export function PlanStateProvider({ children }: { children: React.ReactNode }) {
    const { currentCompany, isDemo } = useAuth();
    const location = useLocation();

    const { data, isLoading, isFetching, refetch } = useQuery<PlanState | null>({
        queryKey: ["plan-state", currentCompany?.id, isDemo],
        queryFn: async () => {
            if (!currentCompany) return null;
            if (isDemo) return demoService.getPlanState();
            return planStateService.getPlanState();
        },
        enabled: !!currentCompany,
        staleTime: 30_000,
        gcTime: 5 * 60_000
    });

    useEffect(() => {
        if (!currentCompany) return;
        void refetch();
    }, [location.pathname, currentCompany?.id, isDemo, refetch]);

    const limits = useMemo(() => {
        if (!data) return null;
        if (data.limits) return data.limits;
        return {
            invoices: data.usage.invoices.limit,
            seats: data.usage.seats.limit,
            accountants: data.usage.accountants.limit
        };
    }, [data]);

    const value: PlanStateContextType = useMemo(() => ({
        data: data ?? null,
        status: data?.status ?? null,
        usage: data?.usage ?? null,
        limits,
        cta: data?.cta ?? null,
        isLoading: isLoading || isFetching,
        refresh: async () => { await refetch(); }
    }), [data, limits, isLoading, isFetching, refetch]);

    return (
        <PlanStateContext.Provider value={value}>
            {children}
        </PlanStateContext.Provider>
    );
}

export function usePlanState() {
    const context = useContext(PlanStateContext);
    if (context === undefined) {
        throw new Error("usePlanState must be used within a PlanStateProvider");
    }
    return context;
}
