import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { timelineService } from "@/services/timeline";
import { useAuth } from "@/contexts/AuthContext";
import { FiscalTimeline } from "@/components/dashboard/FiscalTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScreenState } from "@/components/common/ScreenState";
import { usePlanState } from "@/contexts/PlanStateContext";
import { parseApiError } from "@/lib/apiError";

export default function TimelinePage() {
    const { currentCompany } = useAuth();
    const { data: planState, status, usage, limits } = usePlanState();
    const planStatus = (status || planState?.status || 'ACTIVE').toUpperCase();
    const isBlocked = planStatus === 'BLOCKED' || planStatus === 'EXPIRED';
    const invoicesUsed = usage?.invoices.used ?? planState?.usage.invoices.used ?? 0;
    const invoicesLimit = limits?.invoices ?? planState?.usage.invoices.limit ?? null;
    const nearLimit = invoicesLimit ? invoicesUsed / invoicesLimit >= 0.8 : false;
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [search, setSearch] = useState('');

    const { data: events, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['fiscal-timeline', currentCompany?.id],
        queryFn: () => currentCompany ? timelineService.getTimeline() : [],
        enabled: !!currentCompany
    });

    const apiError = parseApiError(error);
    const tenantViolation = apiError.code === 'TENANT_VIOLATION';
    const backendError = isError && !tenantViolation;

    const filtered = useMemo(() => {
        const base = events || [];
        return base.filter((evt) => {
            const matchesType = typeFilter === 'all' || evt.type === typeFilter;
            const matchesSearch = search
                ? (evt.title?.toLowerCase().includes(search.toLowerCase()) ||
                    evt.description?.toLowerCase().includes(search.toLowerCase()) ||
                    JSON.stringify(evt.metadata || {}).toLowerCase().includes(search.toLowerCase()))
                : true;
            return matchesType && matchesSearch;
        });
    }, [events, typeFilter, search]);

    const isEmpty = !isLoading && filtered.length === 0;
    const firstUse = isEmpty && invoicesUsed === 0;

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timeline.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (tenantViolation) {
        return (
            <div className="space-y-4 pb-20">
                <ScreenState
                    state="tenant"
                    description={apiError.message || 'Contexto de empresa inválido para a linha do tempo.'}
                    action={{ label: 'Refazer login', to: '/auth/login' }}
                    secondaryAction={{ label: 'Tentar novamente', onClick: () => void refetch(), variant: 'outline' }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Linha do Tempo Fiscal</h1>
                    <p className="text-slate-500 mt-1">Histórico completo de eventos e auditoria.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={downloadJson}>
                        <Download className="w-4 h-4 mr-2" /> Exportar JSON
                    </Button>
                </div>
            </div>

            <Card className="border border-slate-200">
                <CardContent className="p-4 flex flex-wrap gap-3 items-end">
                    <div className="flex items-center gap-2 text-slate-700 text-sm">
                        <Filter className="h-4 w-4" /> Filtros rápidos
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="INVOICE_ISSUED">Notas emitidas</SelectItem>
                            <SelectItem value="TAX_CALCULATED">Cálculos fiscais</SelectItem>
                            <SelectItem value="SCORE_CHANGED">Score</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Buscar por usuário, entidade ou ação"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 min-w-[220px]"
                    />
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">{filtered.length} eventos</Badge>
                </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="px-0">
                    {planStatus === 'GRACE' && (
                        <ScreenState
                            state="near-limit"
                            inline
                            description="Plano em carência: exportações podem ser limitadas até regularizar."
                        />
                    )}
                    {nearLimit && planStatus !== 'GRACE' && (
                        <ScreenState
                            state="near-limit"
                            inline
                            description="Consumo de notas acima de 80%. Exportações podem ser limitadas se exceder."
                        />
                    )}
                    {backendError && (
                        <ScreenState
                            state="error"
                            inline
                            description={apiError.message || 'Falha ao carregar a linha do tempo.'}
                            action={{ label: 'Recarregar', onClick: () => void refetch(), variant: 'outline' }}
                        />
                    )}
                    {isBlocked ? (
                        <ScreenState
                            state="blocked"
                            inline
                            description="Plano bloqueado: linha do tempo em leitura até o desbloqueio."
                            action={{ label: 'Abrir Billing', to: '/settings/billing', variant: 'outline' }}
                        />
                    ) : isLoading ? (
                        <div>Carregando histórico...</div>
                    ) : isEmpty ? (
                        <ScreenState
                            state={firstUse ? 'first-use' : 'empty'}
                            inline
                            title={firstUse ? 'Nenhum evento ainda' : 'Nenhum evento encontrado'}
                            description={firstUse ? 'As ações passam a registrar eventos aqui.' : 'Ajuste filtros ou gere novas ações para ver eventos.'}
                        />
                    ) : (
                        <FiscalTimeline events={filtered} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
