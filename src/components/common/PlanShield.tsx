import { useMemo } from "react";
import { ShieldCheck, ShieldAlert, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePlanState } from "@/contexts/PlanStateContext";

type ShieldTone = "ACTIVE" | "WARNING" | "BLOCKED" | "GRACE";

const TONE_META: Record<ShieldTone, { bg: string; border: string; text: string; accent: string; label: string; icon: any }> = {
    ACTIVE: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", accent: "text-emerald-600", label: "Plano ativo", icon: ShieldCheck },
    WARNING: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", accent: "text-amber-600", label: "Aproximando do limite", icon: ShieldAlert },
    GRACE: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", accent: "text-orange-600", label: "Pagamento pendente", icon: AlertTriangle },
    BLOCKED: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", accent: "text-red-600", label: "Ação bloqueada", icon: ShieldAlert }
};

const CTA_LABEL: Record<string, string> = {
    UPGRADE: "Fazer upgrade",
    BUY_CREDITS: "Comprar créditos",
    CONTACT_SUPPORT: "Falar com suporte"
};

const CTA_ROUTE: Record<string, string> = {
    UPGRADE: "/dashboard/settings/billing",
    BUY_CREDITS: "/dashboard/settings/billing",
    CONTACT_SUPPORT: "/dashboard/settings/billing"
};

export function PlanShield({ className }: { className?: string }) {
    const { data, status, usage, limits, cta, isLoading } = usePlanState();

    const tone: ShieldTone = useMemo(() => {
        const st = (data?.status || status || "ACTIVE").toUpperCase() as ShieldTone;
        if (st === "WARNING" || st === "BLOCKED" || st === "GRACE" || st === "ACTIVE") return st;
        return "ACTIVE";
    }, [data?.status, status]);

    const meta = TONE_META[tone];
    const Icon = meta.icon || Shield;
    const isLocked = tone === "BLOCKED" || tone === "GRACE";

    const invoicesLimit = usage?.invoices.limit ?? limits?.invoices ?? null;
    const invoicesUsed = usage?.invoices.used ?? 0;
    const seatsLimit = usage?.seats.limit ?? limits?.seats ?? null;
    const seatsUsed = usage?.seats.used ?? 0;
    const accountantsLimit = usage?.accountants?.limit ?? limits?.accountants ?? null;
    const accountantsUsed = usage?.accountants?.used ?? 0;

    return (
        <div className={cn("w-full", className)} data-testid="plan-shield" data-plan-status={tone} data-plan-locked={isLocked}>
            <div
                className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm transition-colors",
                    meta.bg,
                    meta.border,
                    isLoading ? "opacity-70" : ""
                )}
            >
                <div className={cn("p-2 rounded-md bg-white/80", meta.accent)}>
                    <Icon className={cn("h-4 w-4", meta.accent)} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className={cn("text-xs font-semibold uppercase", meta.text)} data-testid="plan-shield-status">{meta.label}</div>
                    <div className="text-sm text-gray-700 truncate" data-testid="plan-shield-plan">{data?.plan.name ?? "Carregando plano..."}</div>
                    <div className="text-[11px] text-gray-500 flex gap-4 mt-1 flex-wrap">
                        <span data-testid="plan-shield-invoices">Notas: {invoicesLimit === null ? "∞" : `${invoicesUsed}/${invoicesLimit}`}</span>
                        <span data-testid="plan-shield-seats">Seats: {seatsLimit === null ? "∞" : `${seatsUsed}/${seatsLimit}`}</span>
                        {accountantsLimit !== undefined && (
                            <span data-testid="plan-shield-accountants">Contadores: {accountantsLimit === null ? "∞" : `${accountantsUsed}/${accountantsLimit}`}</span>
                        )}
                    </div>
                </div>
                {cta && (
                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={isLocked && tone === "BLOCKED"}
                        onClick={() => {
                            const target = CTA_ROUTE[cta] || "/dashboard/settings/billing";
                            window.location.href = target;
                        }}
                        className="text-xs"
                    >
                        {CTA_LABEL[cta] || "Ver opções"}
                    </Button>
                )}
            </div>
        </div>
    );
}
