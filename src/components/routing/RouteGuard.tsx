import { createContext, useContext, useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanState } from "@/contexts/PlanStateContext";
import { resolveRouteAccess } from "@/components/routing/RouteAccessMatrix";
import { PlanBlockDialog } from "@/components/common/PlanBlockDialog";
import { AlertTriangle, Shield } from "lucide-react";

export type RouteMode = "active" | "warning" | "read-only" | "blocked";

interface RouteGuardContextValue {
    mode: RouteMode;
    isDemo: boolean;
    planStatus: string;
}

const RouteGuardContext = createContext<RouteGuardContextValue | undefined>(undefined);

export function useRouteGuard() {
    const ctx = useContext(RouteGuardContext);
    if (!ctx) throw new Error("useRouteGuard must be used within RouteGuard");
    return ctx;
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { isAuthenticated, currentCompany, user, isDemo } = useAuth();
    const { status, data, isLoading } = usePlanState();

    // Authentication and tenant guard
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
    const companyId = currentCompany?.id || user?.companyId;
    if (!companyId) return <Navigate to="/onboarding" replace />;

    // Fetch plan-state gate
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen text-slate-500">Validando plano...</div>;
    }

    const planStatus = (status || data?.status || "ACTIVE").toUpperCase();
    const { readOnlyOnBlocked } = resolveRouteAccess(location.pathname);

    let mode: RouteMode = "active";
    if (planStatus === "BLOCKED" || planStatus === "EXPIRED") {
        mode = readOnlyOnBlocked ? "read-only" : "blocked";
    } else if (planStatus === "GRACE" || planStatus === "WARNING") {
        mode = "warning";
    } else {
        mode = "active";
    }

    // Trigger block dialog for hard blocks
    useEffect(() => {
        if (mode === "blocked") {
            window.dispatchEvent(new CustomEvent("plan-blocked", { detail: { error: "PLAN_BLOCKED", reason: data?.reason, cta: data?.cta } }));
        }
    }, [mode, data?.reason, data?.cta]);

    if (mode === "blocked") {
        return (
            <RouteGuardContext.Provider value={{ mode, isDemo, planStatus }}>
                <PlanBlockDialog />
                <Navigate to="/dashboard/settings/billing" replace />
            </RouteGuardContext.Provider>
        );
    }

    return (
        <RouteGuardContext.Provider value={{ mode, isDemo, planStatus }}>
            {mode === "warning" && (
                <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Plano em carência ou próximo ao limite. Ações permitidas com cautela.
                </div>
            )}
            {isDemo && (
                <div className="w-full bg-slate-900 text-white text-sm px-4 py-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Modo demonstração: ações não persistem e usam adaptadores locais.
                </div>
            )}
            {children}
        </RouteGuardContext.Provider>
    );
}
