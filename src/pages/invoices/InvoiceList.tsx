import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Filter, Plus, RefreshCw, Search } from "lucide-react";
import { invoiceService } from "@/services/invoice";
import { getDemoInvoices } from "@/services/demoInvoices";
import { InvoiceStatus, type Invoice } from "@/types/invoice";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanState } from "@/contexts/PlanStateContext";
import { PlanShield } from "@/components/common/PlanShield";
import { ScreenState } from "@/components/common/ScreenState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/lib/apiError";

const statusLabels: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: "Rascunho",
    [InvoiceStatus.ISSUED]: "Autorizada",
    [InvoiceStatus.PROCESSING]: "Processando",
    [InvoiceStatus.CANCELLED]: "Cancelada",
    [InvoiceStatus.ERROR]: "Falha",
};

export default function InvoiceList() {
    const { currentCompany, isDemo } = useAuth();
    const { data: planState, usage, limits, status: planStatus } = usePlanState();

    const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
    const [monthFilter, setMonthFilter] = useState(currentMonth);
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");

    const invoicesUsed = usage?.invoices.used ?? planState?.usage.invoices.used ?? 0;
    const invoicesLimit = limits?.invoices ?? planState?.usage.invoices.limit ?? null;
    const nearLimit = invoicesLimit ? invoicesUsed / invoicesLimit >= 0.8 : false;
    const blockedByLimit = invoicesLimit ? invoicesUsed >= invoicesLimit : false;
    const blockedByStatus = (planStatus || "ACTIVE") === "BLOCKED";
    const isBlocked = blockedByLimit || blockedByStatus;

    const { data: invoices, isLoading, isError, error, refetch } = useQuery<Invoice[]>({
        queryKey: ["invoices", currentCompany?.id, monthFilter, statusFilter, isDemo],
        queryFn: () => {
            if (!currentCompany) return Promise.resolve([] as Invoice[]);
            if (isDemo) return getDemoInvoices();
            return invoiceService.getInvoices({
                month: monthFilter || undefined,
                status: statusFilter === "ALL" ? undefined : statusFilter,
            });
        },
        enabled: !!currentCompany,
    });

    const apiError = parseApiError(error);
    const tenantViolation = apiError.code === "TENANT_VIOLATION";
    const backendError = isError && !tenantViolation;

    const totalAmount = useMemo(() => invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) ?? 0, [invoices]);
    const missingXmlCount = useMemo(() => invoices?.filter((inv) => inv.status === InvoiceStatus.ISSUED && !inv.xmlUrl).length ?? 0, [invoices]);

    const firstUse = (invoicesUsed === 0) && !isLoading;
    const empty = !isLoading && (invoices?.length ?? 0) === 0;

    if (tenantViolation) {
        return (
            <div className="space-y-4 pb-16">
                <ScreenState
                    state="tenant"
                    description={apiError.message || "Contexto de empresa inválido. Refaça o login ou selecione a empresa novamente."}
                    action={{ label: "Refazer login", to: "/auth/login" }}
                    secondaryAction={{ label: "Tentar novamente", onClick: () => void refetch(), variant: "outline" }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-16">
            <header className="flex flex-col gap-2">
                <p className="text-xs uppercase text-slate-500">Operação</p>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Notas Fiscais</h1>
                        <p className="text-slate-600">Visão mensal com status e downloads. Se exceder, emissões bloqueiam.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/dashboard/invoices/issue">
                            <Button className="bg-slate-900 text-white hover:bg-slate-800" disabled={isBlocked}>
                                <Plus className="h-4 w-4 mr-2" /> Emitir Nota
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={() => void refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                        </Button>
                    </div>
                </div>
            </header>

            <PlanShield className="max-w-5xl" />

            {(isBlocked || nearLimit) && (
                <ScreenState
                    state={isBlocked ? "blocked" : "near-limit"}
                    inline
                    description={isBlocked ? "Plano bloqueado: emissão e downloads podem ser restritos." : "Consumo de notas acima de 80%. Se exceder, emissões bloqueiam."}
                    action={{ label: "Billing & Plans", to: "/settings/billing", variant: "outline" }}
                    secondaryAction={!isBlocked ? { label: "Reforçar escudo", to: "/settings/billing" } : undefined}
                />
            )}

            <Filters
                month={monthFilter}
                onMonthChange={setMonthFilter}
                onResetMonth={() => setMonthFilter(currentMonth)}
                status={statusFilter}
                onStatusChange={setStatusFilter}
            />

            <SummaryRow totalAmount={totalAmount} missingXml={missingXmlCount} blocked={isBlocked} month={monthFilter} />

            {backendError && (
                <ScreenState
                    state="error"
                    inline
                    description={apiError.message || "Falha ao carregar notas."}
                    action={{ label: "Tentar novamente", onClick: () => void refetch(), variant: "outline" }}
                />
            )}

            {isLoading ? (
                <SkeletonTable />
            ) : empty ? (
                <ScreenState
                    state={firstUse ? "first-use" : "empty"}
                    title={firstUse ? "Emita sua primeira NFS-e" : "Sem notas para este filtro"}
                    description={firstUse ? "Nenhuma nota emitida ainda. Use o atalho abaixo para começar." : "Nenhum resultado para o período. Emita uma nova nota ou troque o mês."}
                    action={{ label: "Emitir Nota", to: "/dashboard/invoices/issue", disabled: isBlocked }}
                    secondaryAction={{ label: "Abrir Billing", to: "/settings/billing", variant: "outline" }}
                />
            ) : (
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/60">
                                <TableRow className="border-slate-100">
                                    <TableHead className="pl-6">Status</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Emissão</TableHead>
                                    <TableHead>Arquivos</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices?.map((invoice) => {
                                    const isWarning = invoice.status === InvoiceStatus.ERROR || (invoice.status === InvoiceStatus.ISSUED && !invoice.xmlUrl);
                                    return (
                                        <TableRow key={invoice.id} className={cn("border-slate-50", isWarning ? "bg-amber-50/50" : "hover:bg-slate-50/50") }>
                                            <TableCell className="pl-6">
                                                <StatusChip status={invoice.status} />
                                                {invoice.status === InvoiceStatus.ISSUED && !invoice.xmlUrl && (
                                                    <div className="mt-1 text-[11px] text-amber-700">XML pendente</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-900">R$ {invoice.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900">{invoice.borrower?.name || "Cliente"}</span>
                                                    <span className="text-xs text-slate-500">{invoice.borrower?.document || "Doc não informado"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("pt-BR") : "--"}</TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <DownloadLink href={invoice.pdfUrl} label="PDF" blocked={isBlocked} />
                                                    <DownloadLink href={invoice.xmlUrl} label="XML" blocked={isBlocked} warnMissing={invoice.status === InvoiceStatus.ISSUED && !invoice.xmlUrl} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" className="h-8 px-2" disabled={isBlocked}>
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function StatusChip({ status }: { status: InvoiceStatus }) {
    const tone = status === InvoiceStatus.ISSUED ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
        status === InvoiceStatus.PROCESSING ? "bg-blue-50 text-blue-700 border-blue-200" :
        status === InvoiceStatus.DRAFT ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-red-50 text-red-700 border-red-200";
    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1", tone)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabels[status]}
        </span>
    );
}

function Filters({ month, onMonthChange, onResetMonth, status, onStatusChange }: {
    month: string;
    onMonthChange: (m: string) => void;
    onResetMonth: () => void;
    status: InvoiceStatus | "ALL";
    onStatusChange: (s: InvoiceStatus | "ALL") => void;
}) {
    return (
        <Card className="border-slate-200">
            <CardContent className="py-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input className="pl-9" placeholder="Filtrar por cliente ou número" disabled />
                    </div>
                    <Button variant="outline" className="border-slate-200 text-slate-600" disabled>
                        <Filter className="h-4 w-4 mr-2" /> Filtros avançados
                    </Button>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex flex-col text-xs text-slate-500">
                        <span>Mês</span>
                        <Input type="month" value={month} onChange={(e) => onMonthChange(e.target.value)} className="h-10" />
                    </div>
                    <div className="flex flex-col text-xs text-slate-500">
                        <span>Status</span>
                        <select
                            className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                            value={status}
                            onChange={(e) => onStatusChange(e.target.value as InvoiceStatus | "ALL")}
                        >
                            <option value="ALL">Todos</option>
                            {Object.values(InvoiceStatus).map((s) => (
                                <option key={s} value={s}>{statusLabels[s as InvoiceStatus]}</option>
                            ))}
                        </select>
                    </div>
                    <Button variant="outline" onClick={onResetMonth}>Este mês</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function SummaryRow({ totalAmount, missingXml, blocked, month }: { totalAmount: number; missingXml: number; blocked: boolean; month: string; }) {
    return (
        <Card className="border-slate-200">
            <CardContent className="py-3 grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                    <div className="text-xs text-slate-500">Total do mês ({month})</div>
                    <div className="text-xl font-semibold text-slate-900">R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500">XMLs faltando</div>
                    <div className="text-lg font-semibold text-amber-700">{missingXml}</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500">Plano</div>
                    <div className={cn("text-sm font-semibold", blocked ? "text-red-700" : "text-emerald-700")}>{blocked ? "Bloqueado" : "Operacional"}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function DownloadLink({ href, label, blocked, warnMissing }: { href?: string; label: string; blocked: boolean; warnMissing?: boolean; }) {
    if (!href) {
        return <span className={cn("text-xs", warnMissing ? "text-amber-700" : "text-slate-400")}>{warnMissing ? `${label} pendente` : "N/D"}</span>;
    }
    return (
        <a href={href} target="_blank" rel="noreferrer" className={cn("text-xs font-semibold underline", blocked ? "pointer-events-none text-slate-400" : "text-emerald-700 hover:text-emerald-800")}>{label}</a>
    );
}

function SkeletonTable() {
    return (
        <Card className="border-slate-100">
            <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-md bg-slate-100 animate-pulse" />)}
            </CardContent>
        </Card>
    );
}

