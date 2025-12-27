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
            if (isDemo) {
                const base = await demoService.getPlanState();
                const overrideCode = localStorage.getItem("fiscoone_demo_plan_override");
                if (!overrideCode) return base;
                const overrideMap: Record<string, { name: string; limits: { invoices: number | null; seats: number | null; accountants: number | null } }> = {
                    START: { name: "Start", limits: { invoices: 5, seats: 1, accountants: 0 } },
                    ESSENTIAL: { name: "Essential", limits: { invoices: 20, seats: 3, accountants: 1 } },
                    PRO: { name: "Pro", limits: { invoices: 80, seats: 8, accountants: 3 } },
                    ENTERPRISE: { name: "Enterprise", limits: { invoices: null, seats: null, accountants: null } }
                };
                const override = overrideMap[overrideCode.toUpperCase()];
                if (!override) return base;
                return {
                    ...base,
                    plan: { ...base.plan, name: override.name, code: overrideCode.toUpperCase() },
                    limits: override.limits,
                    usage: {
                        ...base.usage,
                        invoices: { ...base.usage.invoices, limit: override.limits.invoices ?? base.usage.invoices.limit },
                        seats: { ...base.usage.seats, limit: override.limits.seats ?? base.usage.seats.limit },
                        accountants: { ...base.usage.accountants, limit: override.limits.accountants ?? base.usage.accountants.limit }
                    }
                } as PlanState;
            }
            return planStateService.getPlanState();
        },
        enabled: !!currentCompany,
        staleTime: 0,
        gcTime: 60_000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: 15_000
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
