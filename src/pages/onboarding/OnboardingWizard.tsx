
import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyData } from "@/types/company";
import { companyService } from "@/services/company";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowRight, LineChart, Building2, MapPin, Wallet } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshCompanies, updateUser, isDemo, currentCompany } = useAuth();
    const { toast } = useToast();

    const selectedPlanCode = useMemo(() => {
        const code = searchParams.get("plan") || "BASIC";
        return code.toUpperCase();
    }, [searchParams]);

    const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
    const [cnpjFound, setCnpjFound] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors }, trigger, getValues } = useForm<CompanyData>({
        resolver: zodResolver(companySchema),
        mode: "onChange",
        defaultValues: {
            address: { state: "SP" },
            bankInfo: { accountType: "CHECKING" },
            invoiceFrequency: "MONTHLY",
            taxManagement: "NONE"
        }
    });

    const handleCNPJChange = async (value: string) => {
        const cleanVal = value.replace(/[^\d]/g, '');
        if (cleanVal.length === 14) {
            setIsSearchingCNPJ(true);
            try {
                const data = await companyService.searchCNPJ(cleanVal);
                if (data) {
                    setValue("legalName", data.legalName || "", { shouldValidate: true });
                    setValue("tradeName", data.tradeName || "", { shouldValidate: true });

                    if (data.address) {
                        setValue("address.zipCode", data.address.zipCode || "");
                        setValue("address.street", data.address.street || "");
                        setValue("address.number", data.address.number || "");
                        setValue("address.neighborhood", data.address.neighborhood || "");
                        setValue("address.city", data.address.city || "");
                        setValue("address.state", data.address.state || "");
                    }
                    setCnpjFound(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearchingCNPJ(false);
            }
        } else {
            setCnpjFound(false);
        }
    };

    const nextStep = async () => {
        let valid = false;
        if (step === 1) {
            valid = await trigger(["cnpj", "legalName", "tradeName", "taxRegime"]);
        } else if (step === 2) {
            // New Profile Step
            valid = await trigger(["invoiceFrequency", "taxManagement", "averageMonthlyRevenue"]);
        } else if (step === 3) {
            valid = await trigger([
                "address.zipCode",
                "address.street",
                "address.number",
                "address.neighborhood",
                "address.city",
                "address.state"
            ]);
        } else if (step === 4) {
            valid = await trigger([
                "bankInfo.bankName",
                "bankInfo.agency",
                "bankInfo.account"
            ]);
        }

        if (valid) {
            setStep(s => s + 1);
        }
    };

    const prevStep = () => setStep(s => s - 1);

    const onSubmit: SubmitHandler<CompanyData> = async (data) => {
        setIsSubmitting(true);
        try {
            if (isDemo) {
                // Em modo demo, não persistimos no backend. Apenas simulamos sucesso e cache local.
                if (currentCompany?.id) {
                    updateUser({ companyId: currentCompany.id });
                }
                toast({
                    title: "Ambiente Demo",
                    description: "Ativação simulada sem gravar dados.",
                });
                navigate("/dashboard");
                return;
            }

            const createdCompany = await companyService.createCompany({ ...data, planCode: selectedPlanCode });

            if (createdCompany.id) {
                updateUser({ companyId: createdCompany.id });
                await refreshCompanies(createdCompany.id);
            } else {
                await refreshCompanies();
            }

            toast({
                title: "Ambiente Preparado",
                description: "Sua inteligência fiscal foi ativada com sucesso.",
            });

            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to create company", error);
            toast({
                title: "Erro na ativação",
                description: "Verifique os dados e tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSteps = 5;

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-white text-gray-900 overflow-x-hidden">
            {/* Left Side - Context */}
            <div className="hidden lg:flex relative flex-col justify-between p-12 bg-slate-900 overflow-hidden text-white h-screen fixed w-1/2 left-0 top-0">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/60 to-slate-950/90 z-10"></div>
                </div>

                {/* Logo */}
                <div className="relative z-20">
                    <div className="flex items-center gap-3">
                        <img src="/logo-white.png" alt="FiscoOne Logo" className="h-8 w-auto invert brightness-0" />
                        <span className="text-xl font-bold tracking-tight">FiscoOne</span>
                    </div>
                </div>

                {/* Text Content */}
                <div className="relative z-20 max-w-lg mb-auto mt-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-6">
                        <Loader2 size={14} className={isSubmitting ? "animate-spin" : ""} />
                        <span>Setup Inicial &bull; Passo {step} de {totalSteps}</span>
                    </div>

                    <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                        {step === 1 && <>Identidade Corporativa <br /><span className="text-emerald-400">Sólida e Confiável.</span></>}
                        {step === 2 && <>Perfil Operacional <br /><span className="text-emerald-400">Inteligência Adaptativa.</span></>}
                        {step === 3 && <>Localização Estratégica <br /><span className="text-emerald-400">Sua Base de Operações.</span></>}
                        {step === 4 && <>Fluxo Financeiro <br /><span className="text-emerald-400">Caixa Integrado.</span></>}
                        {step === 5 && <>Tudo Pronto <br /><span className="text-emerald-400">Ative seu Sistema.</span></>}
                    </h2>

                    <p className="text-slate-400 text-lg leading-relaxed">
                        {step === 1 && "Configure os dados fiscais para garantir compliance automático."}
                        {step === 2 && "Entender seu volume nos permite calibrar os alertas de risco fiscal."}
                        {step === 3 && "Defina o endereço fiscal para cálculo preciso de impostos regionais (ISS/ICMS)."}
                        {step === 4 && "Conecte seus dados para automação futura de recebíveis."}
                        {step === 5 && "Revise e confirme. Estamos prontos para iniciar o monitoramento 24/7."}
                    </p>
                </div>

                {/* Copyright */}
                <div className="relative z-20 mt-12 text-sm text-slate-500">
                    &copy; 2024 FiscoOne Tecnologia.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col items-center justify-center min-h-screen p-6 lg:p-12 lg:col-start-2 overflow-y-auto bg-slate-50">
                <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Progress Bar */}
                    <div className="mb-8 relative px-1">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Passo {step} de {totalSteps}
                                </span>
                                <span className="text-sm font-medium text-slate-700">
                                    {step === 1 && "Identidade"}
                                    {step === 2 && "Perfil"}
                                    {step === 3 && "Endereço"}
                                    {step === 4 && "Financeiro"}
                                    {step === 5 && "Ativação"}
                                </span>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex items-center relative">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
                        <form onSubmit={handleSubmit(onSubmit)}>

                            {/* STEP 1: IDENTITY */}
                            {step === 1 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-2">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-xl">Dados da Empresa</CardTitle>
                                        <CardDescription>CNPJ e Razão Social.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 pt-6">
                                        <div className="grid gap-2 relative">
                                            <Label htmlFor="cnpj">CNPJ</Label>
                                            <div className="relative">
                                                <Input
                                                    id="cnpj"
                                                    placeholder="00.000.000/0000-00"
                                                    {...register("cnpj")}
                                                    className="pr-10 bg-slate-50"
                                                    onChange={(e) => {
                                                        register("cnpj").onChange(e);
                                                        handleCNPJChange(e.target.value);
                                                    }}
                                                />
                                                {isSearchingCNPJ && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-emerald-500" /></div>
                                                )}
                                                {!isSearchingCNPJ && cnpjFound && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
                                                )}
                                            </div>
                                            {errors.cnpj && <span className="text-red-500 text-sm">{errors.cnpj.message}</span>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Razão Social</Label>
                                            <Input {...register("legalName")} className="bg-slate-50" readOnly={cnpjFound} />
                                            {errors.legalName && <span className="text-red-500 text-sm">{errors.legalName.message}</span>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Nome Fantasia</Label>
                                            <Input {...register("tradeName")} className="bg-slate-50" readOnly={cnpjFound} />
                                            {errors.tradeName && <span className="text-red-500 text-sm">{errors.tradeName.message}</span>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Regime Tributário</Label>
                                            <select className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm" {...register("taxRegime")}>
                                                <option value="">Selecione...</option>
                                                <option value="SIMPLES">Simples Nacional</option>
                                                <option value="PRESUMIDO">Lucro Presumido</option>
                                                <option value="REAL">Lucro Real</option>
                                            </select>
                                            {errors.taxRegime && <span className="text-red-500 text-sm">{errors.taxRegime.message}</span>}
                                        </div>
                                    </CardContent>
                                </>
                            )}

                            {/* STEP 2: PROFILE (NEW) */}
                            {step === 2 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-2">
                                            <LineChart className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-xl">Perfil Operacional</CardTitle>
                                        <CardDescription>Calibragem dos alertas de inteligência.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid gap-2">
                                            <Label>Frequência de Emissão</Label>
                                            <select className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm" {...register("invoiceFrequency")}>
                                                <option value="DAILY">Diária</option>
                                                <option value="WEEKLY">Semanal</option>
                                                <option value="MONTHLY">Mensal</option>
                                                <option value="SPORADIC">Esporádica</option>
                                            </select>
                                            <p className="text-xs text-slate-500">Usado para detectar anomalias de faturamento.</p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Faturamento Médio Mensal (Estimado)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-9 bg-slate-50"
                                                    placeholder="0,00"
                                                    {...register("averageMonthlyRevenue", { valueAsNumber: true })}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500">Para projeção de impostos e alertas de limite MEI.</p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Gestão Fiscal Atual</Label>
                                            <select className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm" {...register("taxManagement")}>
                                                <option value="NONE">Nenhuma (Manual)</option>
                                                <option value="SPREADSHEET">Planilhas</option>
                                                <option value="ACCOUNTANT">Contador Externo</option>
                                                <option value="ERP">Outro Software</option>
                                            </select>
                                        </div>
                                    </CardContent>
                                </>
                            )}

                            {/* STEP 3: ADDRESS */}
                            {step === 3 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-2">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-xl">Endereço Fiscal</CardTitle>
                                        <CardDescription>Onde sua operação está baseada.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 pt-6">
                                        <div className="grid gap-2">
                                            <Label>CEP</Label>
                                            <Input {...register("address.zipCode")} className="bg-slate-50" />
                                            {errors.address?.zipCode && <span className="text-red-500 text-sm">{errors.address.zipCode.message}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Rua</Label>
                                                <Input {...register("address.street")} className="bg-slate-50" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Número</Label>
                                                <Input {...register("address.number")} className="bg-slate-50" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Bairro</Label>
                                                <Input {...register("address.neighborhood")} className="bg-slate-50" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Cidade</Label>
                                                <Input {...register("address.city")} className="bg-slate-50" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </>
                            )}

                            {/* STEP 4: BANK INFO */}
                            {step === 4 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-2">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-xl">Dados Bancários</CardTitle>
                                        <CardDescription>Para automação de pagamentos (Opcional).</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 pt-6">
                                        <div className="grid gap-2">
                                            <Label>Banco Principal</Label>
                                            <Input placeholder="ex: Nubank" {...register("bankInfo.bankName")} className="bg-slate-50" />
                                            {errors.bankInfo?.bankName && <span className="text-red-500 text-sm">{errors.bankInfo.bankName.message}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Agência</Label>
                                                <Input {...register("bankInfo.agency")} className="bg-slate-50" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Conta</Label>
                                                <Input {...register("bankInfo.account")} className="bg-slate-50" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </>
                            )}

                            {/* STEP 5: REVIEW */}
                            {step === 5 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <CardTitle className="text-xl">Ativar Operação</CardTitle>
                                        <CardDescription>Confirme os dados para iniciar o monitoramento.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl space-y-4 text-sm">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-slate-500 font-medium">Empresa</span>
                                                <span className="font-semibold text-slate-900">{getValues("legalName")}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-slate-500 font-medium">CNPJ</span>
                                                <span className="font-mono text-slate-700">{getValues("cnpj")}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-slate-500 font-medium">Regime</span>
                                                <span className="font-semibold text-slate-900">{getValues("taxRegime")}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 font-medium">Perfil</span>
                                                <span className="font-semibold text-slate-900">
                                                    {getValues("invoiceFrequency")} / {getValues("averageMonthlyRevenue")?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-slate-500 font-medium">Plano</span>
                                                <span className="font-semibold text-slate-900">{selectedPlanCode}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-slate-500 font-medium">Limites</span>
                                                <span className="font-semibold text-slate-900">Aplicados pelo backend conforme plano selecionado</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-slate-500 font-medium">Regras</span>
                                                <span className="font-semibold text-slate-900">Bloqueio ao exceder limite, Upgrade imediato via billing</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-start gap-3 p-4 bg-emerald-50 rounded-lg text-sm text-emerald-800 border border-emerald-100">
                                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Primeiro Insight Ativado</p>
                                                <p>O monitoramento de limite MEI e Risco Fiscal será ativado imediatamente após a confirmação.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </>
                            )}

                            <CardFooter className="flex justify-between pt-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                {step > 1 ? (
                                    <Button type="button" variant="ghost" onClick={prevStep}>Voltar</Button>
                                ) : (
                                    <div></div>
                                )}

                                {step < totalSteps ? (
                                    <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800">
                                        Continuar <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6 font-bold"
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Monitoramento"}
                                    </Button>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
