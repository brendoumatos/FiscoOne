import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, FileText, Loader2, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlanState } from "@/contexts/PlanStateContext";
import { PlanShield } from "@/components/common/PlanShield";
import { ScreenState } from "@/components/common/ScreenState";
import { useToast } from "@/hooks/use-toast";
import { invoiceService } from "@/services/invoice";
import { createDemoInvoice, previewDemoInvoice } from "@/services/demoInvoices";
import { useAuth } from "@/contexts/AuthContext";
import { parseApiError, type ApiError } from "@/lib/apiError";
import type { InvoicePreview, IssueInvoicePayload } from "@/types/invoice";

const schema = z.object({
    borrowerDoc: z.string().min(11, "Documento obrigatório"),
    borrowerName: z.string().min(3, "Nome obrigatório"),
    serviceAmount: z.coerce.number().positive("Valor deve ser maior que zero"),
    taxAmount: z.coerce.number().nonnegative().optional(),
});

export default function IssueInvoice() {
    const { data: planState, status: planStatus, usage, limits, isLoading: planLoading, refresh } = usePlanState();
    const { isDemo } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            taxAmount: 0,
        },
    });

    const [preview, setPreview] = useState<InvoicePreview | null>(null);
    const [previewError, setPreviewError] = useState<ApiError | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitApiError, setSubmitApiError] = useState<ApiError | null>(null);

    const invoicesUsed = usage?.invoices.used ?? planState?.usage.invoices.used ?? 0;
    const invoicesLimit = limits?.invoices ?? planState?.usage.invoices.limit ?? null;
    const nearLimit = invoicesLimit ? invoicesUsed / invoicesLimit >= 0.8 : false;
    const blockedByLimit = invoicesLimit ? invoicesUsed >= invoicesLimit : false;
    const blockedByStatus = (planStatus || "ACTIVE") === "BLOCKED";
    const isBlocked = blockedByLimit || blockedByStatus;
    const firstUse = invoicesUsed === 0;

    const lastRefreshed = useMemo(() => (preview ? new Date(preview.timestamp) : null), [preview]);

    const tenantViolation = (previewError?.code === "TENANT_VIOLATION") || (submitApiError?.code === "TENANT_VIOLATION");
    const backendError = !!(previewError || submitApiError) && !tenantViolation;

    const watchFields = form.watch();
    useEffect(() => {
        const controller = new AbortController();
        const fetchPreview = async () => {
            if (!watchFields.serviceAmount || watchFields.serviceAmount <= 0) {
                setPreview(null);
                setPreviewError(null);
                return;
            }
            setLoadingPreview(true);
            try {
                const data: IssueInvoicePayload = {
                    borrowerDoc: watchFields.borrowerDoc || "",
                    borrowerName: watchFields.borrowerName || "",
                    serviceAmount: Number(watchFields.serviceAmount),
                    taxAmount: Number(watchFields.taxAmount || 0),
                };
                if (isDemo) {
                    setPreview(previewDemoInvoice(data));
                    setPreviewError(null);
                } else {
                    const res = await invoiceService.previewInvoice(data);
                    setPreview(res);
                    setPreviewError(null);
                }
            } catch (err: any) {
                setPreview(null);
                setPreviewError(parseApiError(err));
            } finally {
                setLoadingPreview(false);
            }
        };
        void fetchPreview();
        return () => controller.abort();
    }, [isDemo, watchFields.borrowerDoc, watchFields.borrowerName, watchFields.serviceAmount, watchFields.taxAmount]);

    const onSubmit = async (values: z.infer<typeof schema>) => {
        if (isBlocked) {
            toast({ title: "Plano bloqueado", description: "Regularize Billing & Plans para emitir notas.", variant: "destructive" });
            return navigate("/settings/billing");
        }
        setSubmitError(null);
        setSubmitApiError(null);
        setSubmitLoading(true);
        try {
            const payload: IssueInvoicePayload = {
                borrowerDoc: values.borrowerDoc,
                borrowerName: values.borrowerName,
                serviceAmount: Number(values.serviceAmount),
                taxAmount: Number(values.taxAmount || 0),
                totalAmount: preview?.totalAmount ?? Number(values.serviceAmount) + Number(values.taxAmount || 0),
            };
            if (isDemo) {
                await createDemoInvoice(payload);
            } else {
                await invoiceService.createInvoice(payload);
            }
            toast({ title: "NFS-e emitida", description: isDemo ? "Emissão fictícia salva em cache." : "Pronta para envio." });
            await refresh();
            navigate("/dashboard/invoices");
        } catch (err: any) {
            const parsed = parseApiError(err);
            setSubmitApiError(parsed);
            setSubmitError(parsed.message || "Não foi possível emitir a nota.");
            toast({ title: "Falha na emissão", description: "Tente novamente ou revise os limites do plano.", variant: "destructive" });
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
            <header className="flex flex-col gap-2">
                <p className="text-xs uppercase text-slate-500">Emissão</p>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    Emitir NFS-e
                    <span className="text-xs font-semibold text-slate-500">Pronto para emitir</span>
                </h1>
                <p className="text-slate-600">Preview e pré-checagem antes de enviar ao fisco.</p>
            </header>

            <PlanShield className="max-w-3xl" />

            {tenantViolation && (
                <ScreenState
                    state="tenant"
                    inline
                    description={previewError?.message || submitApiError?.message || "Contexto de empresa inválido. Refaça o login."}
                    action={{ label: "Refazer login", to: "/auth/login" }}
                    secondaryAction={{ label: "Tentar novamente", onClick: () => void refresh(), variant: "outline" }}
                />
            )}

            {!tenantViolation && backendError && (
                <ScreenState
                    state="error"
                    inline
                    description={previewError?.message || submitApiError?.message || submitError || "Não foi possível carregar o preview."}
                    action={{ label: "Tentar novamente", onClick: () => void refresh(), variant: "outline" }}
                />
            )}

            {(isBlocked || nearLimit) && (
                <ScreenState
                    state={isBlocked ? "blocked" : "near-limit"}
                    inline
                    description={isBlocked ? "Plano bloqueado: emissão desativada." : "Consumo de notas acima de 80%. Se exceder, emissão bloqueia."}
                    action={{ label: "Billing & Plans", to: "/settings/billing", variant: "outline" }}
                    secondaryAction={!isBlocked ? { label: "Reforçar escudo", to: "/settings/billing" } : undefined}
                />
            )}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Dados da nota</CardTitle>
                        <CardDescription className="text-sm text-slate-500">Campos mínimos. Preview automático.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {submitError && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> {submitError}
                            </div>
                        )}
                        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-2">
                                <Label htmlFor="borrowerDoc">Documento do tomador</Label>
                                <Input id="borrowerDoc" placeholder="CNPJ/CPF" {...form.register("borrowerDoc")}
                                    className={form.formState.errors.borrowerDoc ? "border-red-300" : ""}
                                />
                                {form.formState.errors.borrowerDoc && <p className="text-xs text-red-600">{form.formState.errors.borrowerDoc.message}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="borrowerName">Nome/Razão Social</Label>
                                <Input id="borrowerName" placeholder="Cliente Exemplo" {...form.register("borrowerName")}
                                    className={form.formState.errors.borrowerName ? "border-red-300" : ""}
                                />
                                {form.formState.errors.borrowerName && <p className="text-xs text-red-600">{form.formState.errors.borrowerName.message}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="serviceAmount">Valor do serviço</Label>
                                <Input id="serviceAmount" type="number" step="0.01" placeholder="0,00" {...form.register("serviceAmount")}
                                    className={form.formState.errors.serviceAmount ? "border-red-300" : ""}
                                />
                                {form.formState.errors.serviceAmount && <p className="text-xs text-red-600">{form.formState.errors.serviceAmount.message}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="taxAmount">Impostos (opcional)</Label>
                                <Input id="taxAmount" type="number" step="0.01" placeholder="0,00" {...form.register("taxAmount")}
                                    className={form.formState.errors.taxAmount ? "border-red-300" : ""}
                                />
                                {form.formState.errors.taxAmount && <p className="text-xs text-red-600">{form.formState.errors.taxAmount.message}</p>}
                            </div>

                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Pré-flight: preview via /invoices/preview antes de emitir.
                            </div>

                            <Button type="submit" className="w-full" disabled={submitLoading || isBlocked}>
                                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Emitir NFS-e"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <PreviewCard
                    loading={loadingPreview}
                    preview={preview}
                    nearLimit={nearLimit}
                    blocked={isBlocked}
                    lastUpdated={lastRefreshed}
                    firstUse={firstUse}
                    previewError={previewError}
                    tenantViolation={tenantViolation}
                />
            </div>
        </div>
    );
}

function PreviewCard({ loading, preview, nearLimit, blocked, lastUpdated, firstUse, previewError, tenantViolation }: {
    loading: boolean;
    preview: InvoicePreview | null;
    nearLimit: boolean;
    blocked: boolean;
    lastUpdated: Date | null;
    firstUse: boolean;
    previewError: ApiError | null;
    tenantViolation: boolean;
}) {
    return (
        <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-4 w-4" /> Preview</CardTitle>
                    <CardDescription className="text-sm text-slate-500">Computed by /invoices/preview</CardDescription>
                </div>
                {nearLimit && !blocked && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">Quase no limite</span>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {loading && <div className="h-28 rounded-lg bg-slate-100 animate-pulse" />}
                {tenantViolation && (
                    <ScreenState
                        state="tenant"
                        inline
                        description={previewError?.message || "Contexto inválido para esta empresa."}
                        action={{ label: "Refazer login", to: "/auth/login" }}
                    />
                )}

                {!tenantViolation && previewError && (
                    <ScreenState
                        state="error"
                        inline
                        description={previewError.message || "Não foi possível gerar o preview."}
                    />
                )}

                {!tenantViolation && !previewError && !loading && !preview && (
                    <ScreenState
                        state={firstUse ? "first-use" : "empty"}
                        inline
                        title={firstUse ? "Primeira emissão" : "Sem preview gerado"}
                        description={firstUse ? "Preencha os campos para gerar o primeiro preview." : "Informe valores para gerar o preview."}
                    />
                )}

                {preview && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>Valor do serviço</span>
                            <span className="font-semibold text-slate-900">R$ {preview.serviceAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>Impostos</span>
                            <span className="font-semibold text-slate-900">R$ {preview.taxAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>Total</span>
                            <span className="font-semibold text-slate-900">R$ {preview.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Ready to issue — status {preview.status}
                        </div>
                        {preview.warnings && preview.warnings.length > 0 && (
                            <div className="space-y-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                {preview.warnings.map((w) => <div key={w} className="flex items-center gap-2"><AlertCircle className="h-3 w-3" /> {w}</div>)}
                            </div>
                        )}
                        {lastUpdated && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Timer className="h-3 w-3" /> Audit: {lastUpdated.toLocaleString("pt-BR")}
                            </div>
                        )}
                        {blocked && (
                            <ScreenState
                                state="blocked"
                                inline
                                description="Plano bloqueado: emissão desativada."
                            />
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
