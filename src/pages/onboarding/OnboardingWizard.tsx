
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyData } from "@/types/company";
import { companyService } from "@/services/company";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowRight, DoorOpen } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate(); // Restored
    const { refreshCompanies, updateUser } = useAuth();

    // Restore useForm
    const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
    const [cnpjFound, setCnpjFound] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors }, trigger, getValues } = useForm<CompanyData>({
        resolver: zodResolver(companySchema),
        mode: "onChange",
        defaultValues: {
            address: { state: "SP" },
            bankInfo: { accountType: "CHECKING" }
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
            valid = await trigger([
                "address.zipCode",
                "address.street",
                "address.number",
                "address.neighborhood",
                "address.city",
                "address.state"
            ]);
        } else if (step === 3) {
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
            const createdCompany = await companyService.createCompany(data);

            // Updated: Pass the new ID to refreshCompanies so it selects it immediately
            // Note: We need to update AuthContext signature first, assume I will do that next.
            // If I can't update AuthContext signature in the same step, I'll do it sequentially.
            // For now, I'll assume refreshCompanies handles it or I'll use a specific logic.
            // Let's rely on the plan to update AuthContext.
            if (createdCompany.id) {
                // IMPORTANT: Update user state so ProtectedRoute knows they are onboarded
                updateUser({ companyId: createdCompany.id });

                await refreshCompanies(createdCompany.id);
            } else {
                await refreshCompanies();
            }

            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to create company", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-white text-gray-900 overflow-x-hidden">
            {/* Left Side - Artistic/Premium & Context */}
            <div className="hidden lg:flex relative flex-col justify-between p-12 bg-slate-900 overflow-hidden text-white h-screen fixed w-1/2 left-0 top-0">
                {/* Abstract Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/60 to-slate-950/90 z-10"></div>
                    <div className="absolute inset-0 opacity-[0.03] z-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>

                {/* Header / Logo */}
                <div className="relative z-20">
                    <div className="flex items-center gap-3">
                        <img src="/logo-white.png" alt="FiscoOne Logo" className="h-8 w-auto invert brightness-0" />
                        <span className="text-xl font-bold tracking-tight">FiscoOne</span>
                    </div>
                </div>

                {/* Dynamic Context per Step */}
                <div className="relative z-20 max-w-lg mb-auto mt-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium uppercase tracking-wider mb-6">
                        <Loader2 size={14} className={isSubmitting ? "animate-spin" : ""} />
                        <span>Setup Inicial &bull; Passo {step} de 4</span>
                    </div>

                    <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                        {step === 1 && <>Identidade Corporativa <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Sólida e Confiável.</span></>}
                        {step === 2 && <>Localização Estratégica <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Sua Base de Operações.</span></>}
                        {step === 3 && <>Fluxo Financeiro <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Inteligente e Integrado.</span></>}
                        {step === 4 && <>Pronto para Decolar <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Sua Infraestrutura Está Pronta.</span></>}
                    </h2>

                    <p className="text-slate-400 text-lg leading-relaxed">
                        {step === 1 && "Configure os dados fiscais da sua organização para garantir compliance automático desde o primeiro dia."}
                        {step === 2 && "Defina o endereço fiscal para emissão correta de notas e cálculo preciso de impostos regionais."}
                        {step === 3 && "Conecte seus dados bancários para automatizar a conciliação e ter visibilidade total do caixa."}
                        {step === 4 && "Revise as informações cruciais. Estamos prestes a ativar seu ambiente de alta performance."}
                    </p>
                </div>

                {/* Footer Copy */}
                <div className="relative z-20 mt-12">
                    <p className="text-sm text-slate-500">
                        &copy; 2024 FiscoOne Tecnologia. <br />
                        Sua melhor versão de gestão começa aqui.
                    </p>
                </div>
            </div>

            {/* Right Side - Form (Scrollable) */}
            <div className="flex flex-col items-center justify-center min-h-screen p-6 lg:p-12 lg:col-start-2 overflow-y-auto bg-slate-50">
                <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <img src="/logo-white.png" alt="FiscoOne Logo" className="h-10 w-auto invert brightness-0 mb-4" />
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Setup de Conta</span>
                    </div>

                    {/* Progress Bar - Door Opening Metaphor */}
                    <div className="mb-8 relative px-1">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Passo {step} de 4
                                </span>
                                <span className="text-sm font-medium text-slate-700">
                                    {step === 1 && "Iniciando a Jornada"}
                                    {step === 2 && "Definindo a Base"}
                                    {step === 3 && "Conectando Finanças"}
                                    {step === 4 && "A Porta do Sucesso"}
                                </span>
                            </div>
                            <div className={`transition-all duration-500 ${step === 4 ? "text-emerald-600 scale-110" : "text-slate-300"}`}>
                                <DoorOpen
                                    className={`h-6 w-6 transition-all duration-1000 ${step === 4 ? "drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] fill-emerald-100" : "opacity-50"
                                        }`}
                                    strokeWidth={step === 4 ? 2.5 : 1.5}
                                />
                            </div>
                        </div>

                        {/* The Track */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex items-center relative shadow-inner">
                            {/* The Light Beam */}
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out relative z-10"
                                style={{ width: `${(step / 4) * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-emerald-400 z-20"></div>
                            </div>

                            {/* Door Opening Hints (Tick marks) */}
                            <div className="absolute inset-0 flex justify-between px-[12.5%] pointer-events-none z-0">
                                <div className={`w-0.5 h-full ${step > 1 ? "bg-emerald-200" : "bg-slate-200"}`}></div>
                                <div className={`w-0.5 h-full ${step > 2 ? "bg-emerald-200" : "bg-slate-200"}`}></div>
                                <div className={`w-0.5 h-full ${step > 3 ? "bg-emerald-200" : "bg-slate-200"}`}></div>
                            </div>
                        </div>

                        {/* Motivational & Steps Remaining Copy */}
                        <div className="mt-3 flex justify-between items-start">
                            <p className="text-xs text-slate-500 font-medium italic max-w-[80%]">
                                {step === 1 && "Apenas 3 etapas separam você da excelência operacional..."}
                                {step === 2 && "Mais 2 passos para concluir sua infraestrutura..."}
                                {step === 3 && "Só falta 1 passo para ativar sua inteligência fiscal..."}
                                {step === 4 && <span className="text-emerald-600 font-bold">A porta está aberta. Entre para o sucesso.</span>}
                            </p>
                        </div>
                    </div>

                    <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
                        <form onSubmit={handleSubmit(onSubmit, (e) => console.log(e))}>
                            {step === 1 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <CardTitle className="text-xl">Dados da Empresa</CardTitle>
                                        <CardDescription>CNPJ e Razão Social para emissão fiscal.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 pt-6">
                                        <div className="grid gap-2 relative">
                                            <Label htmlFor="cnpj" className="text-slate-700">CNPJ</Label>
                                            <div className="relative">
                                                <Input
                                                    id="cnpj"
                                                    placeholder="00.000.000/0000-00"
                                                    {...register("cnpj")}
                                                    className="bg-slate-50 pr-10"
                                                    onChange={(e) => {
                                                        register("cnpj").onChange(e);
                                                        handleCNPJChange(e.target.value);
                                                    }}
                                                />
                                                {isSearchingCNPJ && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                                    </div>
                                                )}
                                                {!isSearchingCNPJ && cnpjFound && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    </div>
                                                )}
                                            </div>
                                            {isSearchingCNPJ && <span className="text-xs text-emerald-600 animate-pulse">Buscando dados na Receita Federal...</span>}
                                            {errors.cnpj && <span className="text-red-500 text-sm">{errors.cnpj.message}</span>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="legalName">Razão Social</Label>
                                            <Input id="legalName" {...register("legalName")} className="bg-slate-50" />
                                            {errors.legalName && <span className="text-red-500 text-sm">{errors.legalName.message}</span>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tradeName">Nome Fantasia</Label>
                                            <Input id="tradeName" {...register("tradeName")} className="bg-slate-50" />
                                            {errors.tradeName && <span className="text-red-500 text-sm">{errors.tradeName.message}</span>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="taxRegime">Regime Tributário</Label>
                                            <select
                                                id="taxRegime"
                                                className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                {...register("taxRegime")}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="SIMPLES">Simples Nacional</option>
                                                <option value="PRESUMIDO">Lucro Presumido</option>
                                                <option value="REAL">Lucro Real</option>
                                            </select>
                                            {errors.taxRegime && <span className="text-red-500 text-sm">{errors.taxRegime.message}</span>}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end pt-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                        <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800">Próximo <ArrowRight className="ml-2 w-4 h-4" /></Button>
                                    </CardFooter>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <CardTitle className="text-xl">Endereço Fiscal</CardTitle>
                                        <CardDescription>Onde sua operação está baseada.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 pt-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="zipCode">CEP</Label>
                                            <Input id="zipCode" {...register("address.zipCode")} className="bg-slate-50" />
                                            {errors.address?.zipCode && <span className="text-red-500 text-sm">{errors.address.zipCode.message}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="street">Rua</Label>
                                                <Input id="street" {...register("address.street")} className="bg-slate-50" />
                                                {errors.address?.street && <span className="text-red-500 text-sm">{errors.address.street.message}</span>}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="number">Número</Label>
                                                <Input id="number" {...register("address.number")} className="bg-slate-50" />
                                                {errors.address?.number && <span className="text-red-500 text-sm">{errors.address.number.message}</span>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="neighborhood">Bairro</Label>
                                                <Input id="neighborhood" {...register("address.neighborhood")} className="bg-slate-50" />
                                                {errors.address?.neighborhood && <span className="text-red-500 text-sm">{errors.address.neighborhood.message}</span>}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="city">Cidade</Label>
                                                <Input id="city" {...register("address.city")} className="bg-slate-50" />
                                                {errors.address?.city && <span className="text-red-500 text-sm">{errors.address.city.message}</span>}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between pt-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                        <Button type="button" variant="ghost" onClick={prevStep}>Voltar</Button>
                                        <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800">Próximo <ArrowRight className="ml-2 w-4 h-4" /></Button>
                                    </CardFooter>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <CardTitle className="text-xl">Dados Bancários</CardTitle>
                                        <CardDescription>Para automação de pagamentos e recebíveis.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 pt-6">
                                        <input type="hidden" {...register("bankInfo.accountType")} value="CHECKING" />
                                        <div className="grid gap-2">
                                            <Label htmlFor="bankName">Banco Principal</Label>
                                            <Input id="bankName" placeholder="ex: Nubank, Inter, Itaú" {...register("bankInfo.bankName")} className="bg-slate-50" />
                                            {errors.bankInfo?.bankName && <span className="text-red-500 text-sm">{errors.bankInfo.bankName.message}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="agency">Agência</Label>
                                                <Input id="agency" {...register("bankInfo.agency")} className="bg-slate-50" />
                                                {errors.bankInfo?.agency && <span className="text-red-500 text-sm">{errors.bankInfo.agency.message}</span>}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="account">Conta Corrente</Label>
                                                <Input id="account" {...register("bankInfo.account")} className="bg-slate-50" />
                                                {errors.bankInfo?.account && <span className="text-red-500 text-sm">{errors.bankInfo.account.message}</span>}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between pt-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                        <Button type="button" variant="ghost" onClick={prevStep}>Voltar</Button>
                                        <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800">Próximo <ArrowRight className="ml-2 w-4 h-4" /></Button>
                                    </CardFooter>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <CardHeader className="pb-4 border-b border-slate-100">
                                        <CardTitle className="text-xl">Revisão Final</CardTitle>
                                        <CardDescription>Confirme os dados para ativar sua instância.</CardDescription>
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
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 font-medium">Banco</span>
                                                <span className="font-semibold text-slate-900">{getValues("bankInfo.bankName")}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-4 pt-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                        <div className="flex justify-between w-full">
                                            <Button type="button" variant="ghost" onClick={prevStep}>Voltar</Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-8 text-base font-bold tracking-wide transition-all hover:scale-105"
                                            >
                                                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                                {isSubmitting ? "Ativando Sucesso..." : "Iniciar Jornada de Sucesso"}
                                            </Button>
                                        </div>
                                        {Object.keys(errors).length > 0 && (
                                            <div className="w-full text-center p-2 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
                                                Existem campos inválidos. Por favor, revise os passos anteriores.
                                                <br />
                                                {JSON.stringify(Object.keys(errors))}
                                            </div>
                                        )}
                                    </CardFooter>
                                </>
                            )}
                        </form>
                    </Card>

                </div>
            </div>
        </div >
    );
}
