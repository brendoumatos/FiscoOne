import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlanState } from "@/contexts/PlanStateContext";

const CTA_LABEL: Record<string, string> = {
    UPGRADE: "Fazer upgrade",
    BUY_CREDITS: "Comprar créditos",
    CONTACT_SUPPORT: "Falar com suporte"
};

const CTA_ROUTE: Record<string, string> = {
    UPGRADE: "/dashboard/settings/billing",
    BUY_CREDITS: "/dashboard/settings/billing",
    CONTACT_SUPPORT: "/dashboard/settings/support"
};

export function PlanBlockDialog() {
    const { status, data, cta, refresh } = usePlanState();
    const [open, setOpen] = useState(false);
    const [eventReason, setEventReason] = useState<string | null>(null);

    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent;
            const detail = custom.detail as any;
            setEventReason(detail?.reason || detail?.message || data?.reason || "Ação bloqueada pelo plano.");
            setOpen(true);
            void refresh();
        };
        window.addEventListener("plan-blocked", handler as EventListener);
        return () => window.removeEventListener("plan-blocked", handler as EventListener);
    }, [refresh, data?.reason]);

    useEffect(() => {
        if ((status || "ACTIVE") === "BLOCKED") {
            setOpen(true);
            if (!eventReason) setEventReason(data?.reason || "Seu plano foi bloqueado.");
        } else if (!eventReason) {
            setOpen(false);
        }
    }, [status, data?.reason, eventReason]);

    const reason = useMemo(() => {
        return eventReason || data?.reason || "Seu plano atual bloqueou esta ação.";
    }, [eventReason, data?.reason]);

    const ctaLabel = CTA_LABEL[cta || "UPGRADE"] || "Ver opções";
    const ctaRoute = CTA_ROUTE[cta || "UPGRADE"] || "/dashboard/settings";

    return (
        <Dialog open={open} onOpenChange={(next) => setOpen((status || "ACTIVE") === "BLOCKED" ? true : next)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                        <ShieldAlert className="h-5 w-5" />
                        Plano bloqueado
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        {reason}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        {data?.plan.name ? `Plano atual: ${data.plan.name}` : "Plano indefinido"}
                    </div>
                    <div className="text-slate-500 text-xs">
                        A operação foi bloqueada pelo backend (403 PLAN_BLOCKED). Regularize seu plano para voltar a emitir e usar os recursos.
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button className="flex-1" onClick={() => { window.location.href = ctaRoute; }}>
                            {ctaLabel}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setOpen(false);
                                setEventReason(null);
                            }}
                            disabled={(status || "ACTIVE") === "BLOCKED"}
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
