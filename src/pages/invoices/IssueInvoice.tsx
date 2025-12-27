
import { useState, useEffect } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceService } from "@/services/invoice";
import { companyService } from "@/services/company";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2, ChevronRight, Calculator, FileCode, ShieldAlert } from "lucide-react";
import { nfseXmlBuilder } from "@/services/xml/nfse";
import { useCertificate } from "@/contexts/CertificateContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceStatus, type Invoice } from "@/types/invoice";
import { PlanShield } from "@/components/common/PlanShield";
import { usePlanState } from "@/contexts/PlanStateContext";

// Schema for the form
const issueInvoiceSchema = z.object({
    borrower: z.object({
        document: z.string().min(11, "Documento inválido"),
        name: z.string().min(3, "Nome obrigatório"),
        email: z.string().email("Email inválido"),
        address: z.object({
            zipCode: z.string().min(8, "CEP inválido"),
            street: z.string().min(1, "Rua obrigatória"),
            number: z.string().min(1, "Número obrigatório"),
            neighborhood: z.string().min(1, "Bairro obrigatório"),
            city: z.string().min(1, "Cidade obrigatória"),
            state: z.string().length(2, "UF inválida"),
        })
    }),
    serviceItem: z.object({
        serviceCode: z.string().min(1, "Selecione um serviço"),
        description: z.string().min(5, "Descrição detalhada obrigatória"),
        amount: z.coerce.number().min(1, "Valor deve ser maior que zero")
    })
});

type IssueInvoiceFormData = z.infer<typeof issueInvoiceSchema>;

export default function IssueInvoice() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serviceCodes, setServiceCodes] = useState<any[]>([]);
    const [calculatedTaxes, setCalculatedTaxes] = useState<any>(null);
    const [xmlPreview, setXmlPreview] = useState<string>("");
    const navigate = useNavigate();
    const { certificate } = useCertificate();

    const { register, handleSubmit, formState: { errors }, trigger, watch, getValues, setValue } = useForm<IssueInvoiceFormData>({
        resolver: zodResolver(issueInvoiceSchema) as any,
        defaultValues: {
            borrower: {
                address: { state: "SP" }
            },
            serviceItem: {
                amount: 0
            }
        } as DefaultValues<IssueInvoiceFormData>
    });

    // State for borrower lookup
    const [isSearchingBorrower, setIsSearchingBorrower] = useState(false);
    const [borrowerFound, setBorrowerFound] = useState(false);

    // Borrower CNPJ Lookup
    const handleBorrowerCNPJChange = async (value: string) => {
        const cleanVal = value.replace(/[^\d]/g, '');
        if (cleanVal.length === 14) {
            setIsSearchingBorrower(true);
            try {
                // We reuse the companyService for CNPJ lookup as it's the same API
                const data = await companyService.searchCNPJ(cleanVal);
                if (data) {
                    // Map API data to Borrower fields
                    setValue("borrower.name", data.legalName || data.tradeName || "", { shouldValidate: true });

                    if (data.address) {
                        setValue("borrower.address.zipCode", data.address.zipCode || "");
                        setValue("borrower.address.street", data.address.street || "");
                        setValue("borrower.address.number", data.address.number || "");
                        setValue("borrower.address.neighborhood", data.address.neighborhood || "");
                        setValue("borrower.address.city", data.address.city || "");
                        setValue("borrower.address.state", data.address.state || "");
                    }
                    setBorrowerFound(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearchingBorrower(false);
            }
        } else {
            setBorrowerFound(false);
        }
    };

    // Load service codes on mount
    useEffect(() => {
        invoiceService.getServiceCodes().then(setServiceCodes);
    }, []);

    // Watch amount to calculate taxes live
    const amount = watch("serviceItem.amount");
    useEffect(() => {
        if (amount > 0) {
            setCalculatedTaxes(invoiceService.calculateTaxes(amount));
        } else {
            setCalculatedTaxes(null);
        }
    }, [amount]);

    const nextStep = async () => {
        let valid = false;
        if (step === 1) {
            valid = await trigger("borrower");
        }
        if (valid) setStep(2);
    };

    const generateXmlPreview = () => {
        const data = getValues();
        // Construct a temporary invoice object for preview
        const tempInvoice: Invoice = {
            id: 'preview',
            number: 0,
            issueDate: new Date().toISOString(),
            status: InvoiceStatus.DRAFT,
            borrower: data.borrower,
            items: [{
                serviceCode: data.serviceItem.serviceCode,
                description: data.serviceItem.description,
                amount: data.serviceItem.amount
            }],
            amount: data.serviceItem.amount,
            taxes: calculatedTaxes || { iss: 0, pis: 0, cofins: 0, csll: 0, ir: 0, total: 0 }
        };

        const xml = nfseXmlBuilder.buildRps(tempInvoice, certificate ? `Signed by ${certificate.name}` : undefined);
        setXmlPreview(xml);
    };

    const { currentCompany } = useAuth();
    const { data: planState, usage, status, refresh } = usePlanState();
    const [blocked, setBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState<string | null>(null);

    const invoicesUsed = usage?.invoices.used ?? planState?.usage.invoices.used ?? 0;
    const invoicesLimit = planState?.usage.invoices.limit ?? null;
    const blockedByStatus = (status || 'ACTIVE') === 'BLOCKED';
    const blockedByLimit = invoicesLimit ? invoicesUsed >= invoicesLimit : false;
    const isBlocked = blockedByStatus || blockedByLimit;

    useEffect(() => {
        if (isBlocked) {
            setBlocked(true);
            setBlockReason(planState?.reason || 'Limite do plano atingido. Faça upgrade para continuar emitindo.');
        }
    }, [isBlocked, planState?.reason]);

    const onSubmit = async (data: IssueInvoiceFormData) => {
        if (!currentCompany) return;
        if (isBlocked) {
            setBlocked(true);
            setBlockReason(planState?.reason || 'Seu plano atual não permite emitir novas notas. Faça upgrade ou compre créditos.');
            return;
        }
        setIsSubmitting(true);
        try {
            await invoiceService.createInvoice({
                amount: data.serviceItem.amount,
                borrower: {
                    ...data.borrower,
                    // Ensure address matches Borrower type if necessary, or let implicit typing work
                } as any, // Cast to avoid strict type mismatch on deep address objects if slightly different
                items: [{
                    serviceCode: data.serviceItem.serviceCode,
                    description: data.serviceItem.description,
                    amount: data.serviceItem.amount
                }]
            });
            navigate("/dashboard/invoices");
        } catch (error) {
            console.error("Failed to issue invoice", error);
            setBlocked(true);
            setBlockReason('Não foi possível emitir a nota. Verifique limites do plano ou tente novamente.');
        } finally {
            setIsSubmitting(false);
            await refresh();
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Premium Header */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/invoices')} className="text-slate-500 hover:text-slate-900 -ml-2">
                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Voltar
                    </Button>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Emitir Nova <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Nota Fiscal</span>
                </h2>
                <p className="text-slate-500 mt-1 text-lg">Preencha os dados abaixo para gerar sua NFS-e com segurança.</p>
                <div className="mt-4 max-w-md">
                    <PlanShield />
                </div>
                {blocked && (
                    <div className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm flex gap-3">
                        <ShieldAlert className="h-4 w-4 mt-0.5" />
                        <div className="space-y-2">
                            <div className="font-semibold">Emissão bloqueada</div>
                            <div>{blockReason}</div>
                            <div className="mt-2 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/pricing')}>Ver planos</Button>
                                <Button size="sm" variant="default" onClick={() => navigate('/dashboard/settings?tab=billing')}>Gerenciar assinatura</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Wizard Steps */}
            <div className="flex items-center justify-between relative mb-12 max-w-2xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>

                {/* Step 1 */}
                <div className={`flex flex-col items-center gap-2 bg-white px-4 z-10 ${step >= 1 ? "opacity-100" : "opacity-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= 1 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-110" : "bg-slate-100 text-slate-400"
                        }`}>
                        1
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${step >= 1 ? "text-emerald-700" : "text-slate-400"}`}>Tomador</span>
                </div>

                {/* Step 2 */}
                <div className={`flex flex-col items-center gap-2 bg-white px-4 z-10 ${step >= 2 ? "opacity-100" : "opacity-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= 2 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-110" : "bg-slate-100 text-slate-400"
                        }`}>
                        2
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${step >= 2 ? "text-emerald-700" : "text-slate-400"}`}>Serviço</span>
                </div>

                {/* Step 3 (Confirmation/Review - Implicit for now) */}
                <div className="flex flex-col items-center gap-2 bg-white px-4 z-10 opacity-50">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-400">
                        3
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Emissão</span>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <form onSubmit={handleSubmit(onSubmit as any)}>
                    {step === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle>Dados do Tomador</CardTitle>
                                <CardDescription>Quem está contratando o serviço?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label>CPF/CNPJ</Label>
                                        <div className="relative">
                                            <Input
                                                {...register("borrower.document")}
                                                placeholder="00.000.000/0000-00"
                                                className="pr-10"
                                                onChange={(e) => {
                                                    register("borrower.document").onChange(e);
                                                    handleBorrowerCNPJChange(e.target.value);
                                                }}
                                            />
                                            {isSearchingBorrower && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                                </div>
                                            )}
                                            {!isSearchingBorrower && borrowerFound && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                </div>
                                            )}
                                        </div>
                                        {isSearchingBorrower && <span className="text-xs text-emerald-600 animate-pulse">Buscando dados...</span>}
                                        {errors.borrower?.document && <span className="text-red-500 text-xs">{errors.borrower.document.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nome / Razão Social</Label>
                                        <Input {...register("borrower.name")} />
                                        {errors.borrower?.name && <span className="text-red-500 text-xs">{errors.borrower.name.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>E-mail</Label>
                                        <Input {...register("borrower.email")} type="email" />
                                        {errors.borrower?.email && <span className="text-red-500 text-xs">{errors.borrower.email.message}</span>}
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t">
                                    <h4 className="font-medium text-sm">Endereço</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>CEP</Label>
                                            <Input {...register("borrower.address.zipCode")} />
                                            {errors.borrower?.address?.zipCode && <span className="text-red-500 text-xs">{errors.borrower.address.zipCode.message}</span>}
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Rua</Label>
                                            <Input {...register("borrower.address.street")} />
                                            {errors.borrower?.address?.street && <span className="text-red-500 text-xs">{errors.borrower.address.street.message}</span>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Número</Label>
                                            <Input {...register("borrower.address.number")} />
                                            {errors.borrower?.address?.number && <span className="text-red-500 text-xs">{errors.borrower.address.number.message}</span>}
                                        </div>
                                        <div className="space-y-2 bg-col-span-2">
                                            <Label>Bairro</Label>
                                            <Input {...register("borrower.address.neighborhood")} />
                                            {errors.borrower?.address?.neighborhood && <span className="text-red-500 text-xs">{errors.borrower.address.neighborhood.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Cidade</Label>
                                            <Input {...register("borrower.address.city")} />
                                            {errors.borrower?.address?.city && <span className="text-red-500 text-xs">{errors.borrower.address.city.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>UF</Label>
                                            <Input {...register("borrower.address.state")} maxLength={2} />
                                            {errors.borrower?.address?.state && <span className="text-red-500 text-xs">{errors.borrower.address.state.message}</span>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end border-t pt-6">
                                <Button type="button" onClick={nextStep}>
                                    Continuar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <CardHeader>
                                <CardTitle>Serviço Prestado</CardTitle>
                                <CardDescription>Detalhes do serviço e valor da nota.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Código do Serviço (LC 116)</Label>
                                    <select
                                        {...register("serviceItem.serviceCode")}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {serviceCodes.map((sc) => (
                                            <option key={sc.code} value={sc.code}>
                                                {sc.code} - {sc.description} ({sc.taxRate}%)
                                            </option>
                                        ))}
                                    </select>
                                    {errors.serviceItem?.serviceCode && <span className="text-red-500 text-xs">{errors.serviceItem.serviceCode.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Discriminação dos Serviços</Label>
                                    <textarea
                                        {...register("serviceItem.description")}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Descreva detalhadamente o serviço prestado..."
                                    />
                                    {errors.serviceItem?.description && <span className="text-red-500 text-xs">{errors.serviceItem.description.message}</span>}
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-100">
                                    <div className="space-y-2">
                                        <Label className="text-base">Valor do Serviço (R$)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...register("serviceItem.amount")}
                                            className="text-lg font-semibold"
                                        />
                                        {errors.serviceItem?.amount && <span className="text-red-500 text-xs">{errors.serviceItem.amount.message}</span>}
                                    </div>

                                    {calculatedTaxes && (
                                        <div className="pt-2 border-t border-gray-200 mt-4">
                                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-700">
                                                <Calculator size={14} /> Estimativa de Impostos
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                                                <div className="flex justify-between p-2 bg-white rounded">
                                                    <span>ISS ({serviceCodes.find(c => c.code === watch("serviceItem.serviceCode"))?.taxRate || 2}%)</span>
                                                    <span className="font-mono">R$ {calculatedTaxes.iss.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-white rounded">
                                                    <span>PIS (0.65%)</span>
                                                    <span className="font-mono">R$ {calculatedTaxes.pis.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-white rounded">
                                                    <span>COFINS (3%)</span>
                                                    <span className="font-mono">R$ {calculatedTaxes.cofins.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between mt-2 pt-2 border-t border-dashed font-semibold text-sm">
                                                <span>Total Estimado</span>
                                                <span>R$ {calculatedTaxes.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6 gap-2">
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                    Voltar
                                </Button>
                                <div className="flex gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="secondary" onClick={generateXmlPreview}>
                                                <FileCode className="mr-2 h-4 w-4" /> Preview XML
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Preview do XML (RPS)</DialogTitle>
                                                <DialogDescription>
                                                    Este é o payload XML padrão ABRASF que seria enviado para a prefeitura.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <pre className="p-4 bg-slate-950 text-slate-50 rounded-md overflow-auto max-h-[400px] text-xs font-mono">
                                                {xmlPreview || "Preencha os dados e clique em Preview..."}
                                            </pre>
                                            {!certificate && (
                                                <p className="text-yellow-600 text-sm mt-2 flex items-center">
                                                    ⚠️ Nenhum certificado A1 carregado. O XML não será assinado.
                                                </p>
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                        Emitir Nota Fiscal
                                    </Button>
                                </div>
                            </CardFooter>
                        </>
                    )}
                </form>
            </Card>
        </div>
    );
}
