import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanShield } from "@/components/common/PlanShield";
import { ScreenState } from "@/components/common/ScreenState";
import { AlertTriangle, Ban, CheckCircle2, FileText, LineChart, RefreshCw, ShieldCheck, AlertCircle, Clock3, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanState } from "@/contexts/PlanStateContext";
import { parseApiError } from "@/lib/apiError";
import type { DashboardAlert, ActivityItem } from "@/types/dashboard";
import type { PlanState } from "@/services/planState";

const STATUS_TONE = {
    ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
    WARNING: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    GRACE: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    BLOCKED: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
    EXPIRED: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentCompany } = useAuth();
    const { data: planState, status: planStatus, usage, limits, isLoading: isPlanLoading } = usePlanState();

    const { data: summary, isLoading: summaryLoading, isError: summaryError, error: summaryErr, refetch: refetchSummary } = useQuery({
        queryKey: ["dashboard-summary", currentCompany?.id],
        queryFn: () => dashboardService.getStats(),
        enabled: !!currentCompany,
    });

    const { data: activity, isLoading: activityLoading } = useQuery({
        queryKey: ["dashboard-activity", currentCompany?.id],
        queryFn: () => dashboardService.getRecentActivity(),
        enabled: !!currentCompany,
    });

    const summaryApiError = parseApiError(summaryErr);
    const isTenantViolation = summaryApiError.code === "TENANT_VIOLATION";
    const backendError = summaryError && !isTenantViolation;

    const isBlocked = planStatus === "BLOCKED";
    const nearInvoicesLimit = useMemo(() => {
        const limit = usage?.invoices.limit;
        if (!limit) return false;
        return usage.invoices.used / limit >= 0.8;
    }, [usage]);

    const emptyState = !summaryLoading && summary && summary.invoicesCount === 0 && summary.taxesDue === 0 && (summary.alerts?.length ?? 0) === 0;
    const lastUpdated = summary?.lastUpdated ? new Date(summary.lastUpdated) : null;

    if (!currentCompany) {
        return (
            <Card className="mt-8">
                <CardContent className="py-8 text-center text-slate-600">Selecione ou crie uma empresa para visualizar o painel.</CardContent>
            </Card>
        );
    }

    if (isTenantViolation) {
        return (
            <div className="mt-6">
                <ScreenState
                    state="tenant"
                    description={summaryApiError.message || "Contexto de empresa inválido. Entre novamente."}
                    action={{ label: "Refazer login", to: "/auth/login" }}
                    secondaryAction={{ label: "Tentar novamente", onClick: () => void refetchSummary(), variant: "outline" }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <PlanShield />

            <PlanStateBanner
                loading={isPlanLoading}
                status={planStatus}
                planName={planState?.plan.name}
                planCode={planState?.plan.code}
                expiration={planState?.expiration}
                usage={usage}
                limits={limits}
                nearLimit={nearInvoicesLimit}
                blocked={isBlocked}
                onManage={() => navigate("/settings/billing")}
            />

            {backendError && (
                <ScreenState
                    state="error"
                    inline
                    description={summaryApiError.message || "Não foi possível carregar o resumo. Tente novamente."}
                    action={{ label: "Recarregar", onClick: () => void refetchSummary(), variant: "outline" }}
                />
            )}

            {summaryLoading ? (
                <SkeletonGrid />
            ) : emptyState ? (
                <ScreenState
                    state="first-use"
                    title="Pronto para a primeira emissão"
                    description="Sem movimentos ainda. Emita a primeira nota ou registre impostos para preencher o painel."
                    action={{ label: "Emitir Nota", onClick: () => navigate("/dashboard/invoices/issue") }}
                    secondaryAction={{ label: "Adicionar imposto", to: "/dashboard/taxes", variant: "outline" }}
                />
            ) : (
                <>
                    <KpiRow
                        blocked={isBlocked}
                        invoices={summary?.invoicesCount ?? 0}
                        blockedInvoices={summary?.invoicesBlocked ?? 0}
                        taxesDue={summary?.taxesDue ?? 0}
                        taxesOverdue={summary?.taxesOverdue ?? 0}
                        lastUpdated={lastUpdated}
                    />

                    <div className="grid gap-6 lg:grid-cols-[2fr_1.1fr]">
                        <AlertsCard alerts={summary?.alerts ?? []} />

                        <div className="space-y-4">
                            <QuickLinks blocked={isBlocked} navigate={navigate} />
                            <ActivityFeed loading={activityLoading} items={activity ?? []} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function PlanStateBanner({
    loading,
    status,
    planName,
    planCode,
    expiration,
    usage,
    limits,
    nearLimit,
    blocked,
    onManage,
}: {
    loading: boolean;
    status: string | null;
    planName?: string;
    planCode?: string;
    expiration?: string | null;
    usage: PlanState["usage"] | null;
    limits: PlanState["limits"] | null;
    nearLimit: boolean;
    blocked: boolean;
    onManage: () => void;
}) {
    const tone = STATUS_TONE[status as keyof typeof STATUS_TONE] ?? STATUS_TONE.ACTIVE;

    return (
        <Card className={`${tone.bg} ${tone.border} border shadow-sm`}>
            <CardHeader className="pb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tone.bg} ${tone.border}`}>
                        <ShieldCheck className={`h-5 w-5 ${tone.text}`} />
                    </div>
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                            {planName || "Plano"}
                            {planCode && <span className="text-xs font-semibold text-slate-500">{planCode}</span>}
                            <StatusPill status={status || "ACTIVE"} />
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600">Escudo do plano mostra limites em tempo real. Se exceder, emissões bloqueiam.</CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {expiration && <span className="text-xs text-slate-600">Renova em {new Date(expiration).toLocaleDateString("pt-BR")}</span>}
                    <Button size="sm" variant="outline" onClick={onManage}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Billing & Plans
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
                {loading ? (
                    <div className="h-16 rounded-md bg-white/60 animate-pulse" />
                ) : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <UsageRow label="Notas" used={usage?.invoices.used ?? 0} limit={limits?.invoices ?? usage?.invoices.limit ?? null} nearLimit={nearLimit} />
                        <UsageRow label="Assentos" used={usage?.seats.used ?? 0} limit={limits?.seats ?? usage?.seats.limit ?? null} />
                        <UsageRow label="Contadores" used={usage?.accountants.used ?? 0} limit={limits?.accountants ?? usage?.accountants.limit ?? null} />
                    </div>
                )}
                {blocked && (
                    <ScreenState
                        state="blocked"
                        inline
                        description="Plano bloqueado: ações são somente leitura até regularizar."
                        action={{ label: "Billing & Plans", onClick: onManage, variant: "outline" }}
                    />
                )}
                {!blocked && nearLimit && (
                    <ScreenState
                        state="near-limit"
                        inline
                        description="Consumo de notas acima de 80%. Reforce o plano para evitar bloqueio."
                        action={{ label: "Reforçar escudo", onClick: onManage }}
                        secondaryAction={{ label: "Ver limites", onClick: onManage, variant: "outline" }}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function StatusPill({ status }: { status: string }) {
    const labelMap: Record<string, string> = {
        ACTIVE: "Ativo",
        WARNING: "Atenção",
        GRACE: "Grace",
        BLOCKED: "Bloqueado",
        EXPIRED: "Expirado",
    };
    const tone = STATUS_TONE[status as keyof typeof STATUS_TONE] ?? STATUS_TONE.ACTIVE;
    return <span className={`text-xs px-2 py-1 rounded-full border ${tone.border} ${tone.text} bg-white/60`}>{labelMap[status] || status}</span>;
}

function UsageRow({ label, used, limit, nearLimit }: { label: string; used: number; limit: number | null; nearLimit?: boolean }) {
    const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const unlimited = limit === null;
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{label}</span>
                <span className={`font-semibold ${nearLimit ? "text-amber-700" : "text-slate-800"}`}>
                    {used}{unlimited ? " / ilimitado" : ` / ${limit}`}
                </span>
            </div>
            {!unlimited && (
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className={`${nearLimit ? "bg-amber-500" : "bg-emerald-500"} h-full transition-all`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function KpiRow({ blocked, invoices, blockedInvoices, taxesDue, taxesOverdue, lastUpdated }: {
    blocked: boolean;
    invoices: number;
    blockedInvoices: number;
    taxesDue: number;
    taxesOverdue: number;
    lastUpdated: Date | null;
}) {
    const tone = {
        emerald: "bg-emerald-50 text-emerald-700",
        red: "bg-red-50 text-red-700",
        amber: "bg-amber-50 text-amber-700",
    } as const;

    const kpis = [
        { label: "Notas no período", value: invoices, icon: FileText, tone: tone.emerald, description: "Emissão sob escudo" },
        { label: "Notas bloqueadas", value: blockedInvoices, icon: Ban, tone: tone.red, description: "Se exceder, emissões bloqueiam" },
        { label: "Impostos a pagar", value: taxesDue, icon: AlertTriangle, tone: tone.amber, description: taxesOverdue > 0 ? `${taxesOverdue} em atraso` : "Nenhum em atraso" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {kpis.map((kpi) => (
                <Card key={kpi.label} className="shadow-sm border-slate-200 bg-white">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm text-slate-600">{kpi.label}</CardTitle>
                        <span className={`rounded-full p-2 ${kpi.tone}`}>
                            <kpi.icon className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
                            {kpi.label.includes("Impostos") ? `R$ ${kpi.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : kpi.value}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{kpi.description}</p>
                        {blocked && kpi.label === "Notas no período" && (
                            <p className="text-xs text-red-700 mt-2">Plano bloqueado: emissão desabilitada.</p>
                        )}
                        {lastUpdated && <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><Clock3 className="h-3 w-3" /> Atualizado em {lastUpdated.toLocaleString("pt-BR")}</p>}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function AlertsCard({ alerts }: { alerts: DashboardAlert[] }) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base">Alertas e riscos</CardTitle>
                    <CardDescription className="text-sm">Salience: mostramos bloqueios e próximos vencimentos primeiro.</CardDescription>
                </div>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-sm text-slate-500">Sem alertas agora.</div>
                ) : (
                    alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
                )}
            </CardContent>
        </Card>
    );
}

function AlertItem({ alert }: { alert: DashboardAlert }) {
    const tone = alert.severity === "critical" ? "text-red-700 bg-red-50 border-red-200" : alert.severity === "warning" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-slate-700 bg-slate-50 border-slate-200";
    return (
        <div className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${tone}`}>
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div className="flex-1">
                <div className="text-sm font-semibold">{alert.message}</div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span>{new Date(alert.timestamp).toLocaleString("pt-BR")}</span>
                    {alert.source && <span className="text-slate-400">• {alert.source}</span>}
                </div>
            </div>
        </div>
    );
}

function QuickLinks({ blocked, navigate }: { blocked: boolean; navigate: (path: string) => void }) {
    const links = [
        { label: "Emitir Nota", description: "Pré-checagem e preview", icon: FileText, to: "/dashboard/invoices/issue" },
        { label: "Impostos", description: "Guias e vencimentos", icon: LineChart, to: "/dashboard/taxes" },
        { label: "Billing & Plans", description: "Reforçar escudo", icon: ShieldCheck, to: "/settings/billing" },
    ];
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Ações rápidas</CardTitle>
                <CardDescription className="text-sm">Anchoring: começamos pelo estado do plano.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
                {links.map((link) => (
                    <Button
                        key={link.label}
                        variant="outline"
                        className="h-auto justify-start gap-3 border-slate-200 bg-white"
                        onClick={() => navigate(link.to)}
                        disabled={blocked && link.to === "/dashboard/invoices/issue"}
                    >
                        <div className="p-2 rounded-md bg-emerald-50 text-emerald-700">
                            <link.icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-semibold text-slate-900">{link.label}</div>
                            <div className="text-xs text-slate-500">{blocked && link.to === "/dashboard/invoices/issue" ? "Bloqueado pelo plano" : link.description}</div>
                        </div>
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}

function ActivityFeed({ loading, items }: { loading: boolean; items: ActivityItem[] }) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Linha do tempo</CardTitle>
                <Clock3 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-md bg-slate-100 animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-slate-500">Sem movimentos ainda.</div>
                ) : (
                    items.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-start gap-3 border border-slate-100 rounded-lg px-3 py-2">
                            <span className={`mt-1 h-2 w-2 rounded-full ${item.type === "INVOICE" ? "bg-emerald-500" : item.type === "TAX" ? "bg-amber-500" : "bg-slate-400"}`} />
                            <div className="flex-1">
                                <div className="text-sm text-slate-900">{item.description}</div>
                                <div className="text-[11px] text-slate-500">{new Date(item.timestamp).toLocaleString("pt-BR")}</div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

function SkeletonGrid() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
            <div className="grid gap-4 lg:grid-cols-[2fr_1.1fr]">
                <div className="h-64 rounded-lg bg-slate-100 animate-pulse" />
                <div className="space-y-3">
                    <div className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="h-40 rounded-lg bg-slate-100 animate-pulse" />
                </div>
            </div>
        </div>
    );
}

function EmptyStateCard({ onCreate }: { onCreate: () => void }) {
    return (
        <Card className="border-dashed border-slate-300 bg-slate-50">
            <CardContent className="py-10 text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <div className="text-lg font-semibold text-slate-900">Sem movimentos ainda</div>
                <p className="text-sm text-slate-600">Emita a primeira nota ou registre impostos para preencher o painel.</p>
                <div className="flex justify-center gap-3">
                    <Button onClick={onCreate}>
                        <FileText className="h-4 w-4 mr-2" /> Emitir nota
                    </Button>
                    <Button variant="outline" onClick={onCreate}>
                        <ShieldCheck className="h-4 w-4 mr-2" /> Garantir escudo
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
