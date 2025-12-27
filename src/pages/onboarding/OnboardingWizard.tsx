import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, ShieldCheck, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { companyService } from "@/services/company";
import { pricingService, type PublicPlan } from "@/services/pricing";
import { planStateService } from "@/services/planState";

const schema = z.object({
    cnpj: z.string().min(14, "CNPJ inválido").max(18, "CNPJ inválido"),
    legalName: z.string().min(3, "Razão Social obrigatória"),
    tradeName: z.string().min(2, "Nome Fantasia obrigatório"),
    taxRegime: z.enum(["SIMPLES", "PRESUMIDO", "REAL"], { required_error: "Escolha um regime" }),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "UF"),
});

type FormData = z.infer<typeof schema>;

type FetchState = "idle" | "loading" | "error";

const formatLimit = (value: number | null, label: string) => (value === null ? `${label} ilimitadas` : `${value} ${label}`);

export default function OnboardingWizard() {
    const { refreshCompanies, updateUser } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [plans, setPlans] = useState<PublicPlan[]>([]);
    const [planState, setPlanState] = useState<FetchState>("loading");
    const [submitState, setSubmitState] = useState<FetchState>("idle");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            taxRegime: "SIMPLES",
        },
    });

    const selectedPlanCode = useMemo(() => {
        const code = searchParams.get("plan") || "START";
        const upper = code.toUpperCase();
        if (upper.includes("START")) return "START";
        return upper;
    }, [searchParams]);

    useEffect(() => {
        const loadPlans = async () => {
            setPlanState("loading");
            try {
                const data = await pricingService.getPublicPlans();
                setPlans(data);
                setPlanState("idle");
            } catch (err) {
                setPlanState("error");
            }
        };
        loadPlans();
    }, []);

    const startPlan = useMemo(() => {
        const byCode = plans.find((p) => p.code.toUpperCase().includes("START"));
        return byCode ?? plans[0] ?? null;
    }, [plans]);

    const onSubmit = async (values: FormData) => {
        setSubmitError(null);
        setSubmitState("loading");
        try {
            const payload = {
                cnpj: values.cnpj,
                legalName: values.legalName,
                tradeName: values.tradeName,
                taxRegime: values.taxRegime,
                address: { city: values.city, state: values.state },
                planCode: selectedPlanCode || "START",
            };

            const created = await companyService.createOnboardingCompany(payload);
            const now = new Date();
            setSubmittedAt(now);

            if (created?.id) {
                updateUser({ companyId: created.id });
                await refreshCompanies(created.id);
            } else {
                await refreshCompanies();
            }

            try {
                const ps = await planStateService.getPlanState();
                if (ps.status === "BLOCKED") {
                    toast({
                        title: "Plano bloqueado",
                        description: "Seu plano START foi criado, mas está bloqueado. Revise Billing & Plans para ajustar.",
                        variant: "destructive",
                    });
                    navigate("/settings/billing");
                    return;
                }
            } catch (err) {
                // plan-state pode falhar; seguimos mesmo assim
            }

            toast({
                title: "Empresa criada",
                description: `Carimbo: ${now.toLocaleString("pt-BR")}`,
            });
            navigate("/dashboard");
        } catch (err: any) {
            setSubmitError(err?.response?.data?.message || "Não foi possível concluir. Tente novamente.");
            toast({
                title: "Erro na criação",
                description: "Valide o CNPJ e os campos obrigatórios.",
                variant: "destructive",
            });
        } finally {
            setSubmitState("idle");
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
                <div className="space-y-4">
                    <header className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs uppercase text-slate-500">Onboarding</p>
                            <h1 className="text-2xl font-bold">Criar empresa e ativar START</h1>
                        </div>
                    </header>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Dados essenciais</CardTitle>
                            <CardDescription className="text-sm text-slate-500">Apenas o mínimo para ativar o escudo START.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {submitError && (
                                <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> {submitError}
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                                <div className="grid gap-2">
                                    <Label htmlFor="cnpj">CNPJ</Label>
                                    <Input
                                        id="cnpj"
                                        placeholder="00.000.000/0000-00"
                                        {...form.register("cnpj")}
                                        onBlur={(e) => form.setValue("cnpj", e.target.value.trim())}
                                        className={form.formState.errors.cnpj ? "border-red-300" : ""}
                                    />
                                    {form.formState.errors.cnpj && <p className="text-xs text-red-600">{form.formState.errors.cnpj.message}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="legalName">Razão Social</Label>
                                    <Input
                                        id="legalName"
                                        placeholder="Empresa LTDA"
                                        {...form.register("legalName")}
                                        className={form.formState.errors.legalName ? "border-red-300" : ""}
                                    />
                                    {form.formState.errors.legalName && <p className="text-xs text-red-600">{form.formState.errors.legalName.message}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                                    <Input
                                        id="tradeName"
                                        placeholder="Minha Marca"
                                        {...form.register("tradeName")}
                                        className={form.formState.errors.tradeName ? "border-red-300" : ""}
                                    />
                                    {form.formState.errors.tradeName && <p className="text-xs text-red-600">{form.formState.errors.tradeName.message}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="taxRegime">Regime Tributário</Label>
                                    <select
                                        id="taxRegime"
                                        className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ${form.formState.errors.taxRegime ? "border-red-300" : "border-input"}`}
                                        {...form.register("taxRegime")}
                                    >
                                        <option value="SIMPLES">Simples Nacional</option>
                                        <option value="PRESUMIDO">Lucro Presumido</option>
                                        <option value="REAL">Lucro Real</option>
                                    </select>
                                    {form.formState.errors.taxRegime && <p className="text-xs text-red-600">{form.formState.errors.taxRegime.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="city">Cidade</Label>
                                        <Input
                                            id="city"
                                            placeholder="São Paulo"
                                            {...form.register("city")}
                                            className={form.formState.errors.city ? "border-red-300" : ""}
                                        />
                                        {form.formState.errors.city && <p className="text-xs text-red-600">{form.formState.errors.city.message}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="state">UF</Label>
                                        <Input
                                            id="state"
                                            placeholder="SP"
                                            maxLength={2}
                                            {...form.register("state")}
                                            className={form.formState.errors.state ? "border-red-300" : ""}
                                        />
                                        {form.formState.errors.state && <p className="text-xs text-red-600">{form.formState.errors.state.message}</p>}
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                                    <span>Progresso: 1/1</span>
                                    <span>Plano selecionado: {selectedPlanCode}</span>
                                </div>

                                <Button type="submit" className="w-full" disabled={submitState === "loading"}>
                                    {submitState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar empresa e ativar START"}
                                </Button>

                                {submittedAt && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Criado em {submittedAt.toLocaleString("pt-BR")}
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <aside className="space-y-4">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase">
                                <ShieldCheck className="h-4 w-4" /> Escudo START
                            </div>
                            <CardTitle className="text-xl">Limites do plano</CardTitle>
                            <CardDescription className="text-sm text-slate-500">Dados carregados de /public/plans</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {planState === "loading" && (
                                <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Carregando planos...</div>
                            )}
                            {planState === "error" && (
                                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    <AlertTriangle className="h-4 w-4" /> Não foi possível carregar os limites. Tente novamente.
                                </div>
                            )}
                            {startPlan && planState === "idle" && (
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-slate-800">{startPlan.name}</div>
                                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                                        <Pill label="Notas" value={formatLimit(startPlan.invoiceLimit, "notas/mês")} />
                                        <Pill label="Assentos" value={formatLimit(startPlan.seatLimit, "assentos")} />
                                        <Pill label="Contadores" value={formatLimit(startPlan.accountantLimit, "contadores")} />
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                        Se atingir o limite, o backend retorna PLAN_BLOCKED e direcionamos você para Billing & Plans.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Sem fricção</CardTitle>
                            <CardDescription className="text-sm text-slate-500">Campos mínimos, escudo ativado.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-700 space-y-2">
                            <p>Validação de CNPJ inline. Campos obrigatórios destacados em vermelho.</p>
                            <p>Progresso 1/1 mantém foco. CTA único "Criar empresa e ativar START".</p>
                            <p>Se o backend responder PLAN_BLOCKED, redirecionamos automaticamente para Billing & Plans.</p>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

function Pill({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
            <span className="text-slate-600 text-xs uppercase">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
