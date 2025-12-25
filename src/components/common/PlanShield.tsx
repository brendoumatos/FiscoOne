import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const PLAN_STYLES: Record<string, { label: string; color: string; text: string; icon: any; accent: string }> = {
    PLAN_START: { label: "Start", color: "bg-slate-100 border-slate-200", text: "text-slate-700", icon: Shield, accent: "text-slate-500" },
    PLAN_ESSENTIAL: { label: "Essencial", color: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", icon: ShieldCheck, accent: "text-emerald-600" },
    PLAN_PROFESSIONAL: { label: "Profissional", color: "bg-purple-50 border-purple-200", text: "text-purple-800", icon: ShieldCheck, accent: "text-purple-600" },
    PLAN_ENTERPRISE: { label: "Enterprise", color: "bg-amber-50 border-amber-200", text: "text-amber-800", icon: ShieldAlert, accent: "text-amber-600" }
};

export function PlanShield({ className }: { className?: string }) {
    const { data } = useSubscription();
    if (!data) return null;

    const style = PLAN_STYLES[data.plan.code] || PLAN_STYLES.PLAN_START;
    const Icon = style.icon || Shield;

    const limit = data.plan.limit;
    const used = data.usage?.invoices ?? 0;
    const usagePercent = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

    const nextTier = {
        PLAN_START: "Essencial",
        PLAN_ESSENTIAL: "Profissional",
        PLAN_PROFESSIONAL: "Enterprise",
        PLAN_ENTERPRISE: "Enterprise"
    }[data.plan.code] || "";

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition hover:shadow-md cursor-default",
                style.color,
                className
            )}
            title={`Este é o nível de proteção fiscal da sua empresa. Próximo nível: ${nextTier}.`}
        >
            <div className={cn("p-2 rounded-lg bg-white/70", style.accent)}>
                <Icon className={cn("h-5 w-5", style.accent)} />
            </div>
            <div className="flex-1 min-w-0">
                <div className={cn("text-xs font-semibold uppercase", style.text)}>Proteção Fiscal</div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{data.plan.name}</span>
                    <span className="text-[11px] text-slate-500">{limit === -1 ? "Notas ilimitadas" : `${used}/${limit} notas`}</span>
                </div>
                {limit !== -1 && (
                    <div className="mt-2">
                        <Progress value={usagePercent} className="h-2" />
                        <p className="text-[11px] text-slate-500 mt-1">Cada nota emitida reforça seu escudo fiscal.</p>
                    </div>
                )}
                {limit === -1 && (
                    <p className="text-[11px] text-slate-600 mt-1">Escudo máximo: notas e assentos ilimitados.</p>
                )}
            </div>
            <div className="flex flex-col items-end text-right gap-1">
                <span className="text-[11px] text-slate-500">Vagas: {data.seatLimit === -1 ? "∞" : `${data.currentCollaborators ?? 0}/${data.seatLimit}`}</span>
                <span className="text-[11px] text-slate-500">Próximo: {nextTier}</span>
            </div>
        </div>
    );
}
