import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw, Info, AlertTriangle, ShieldCheck, Lock, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { pricingService, PublicPlan } from "@/services/pricing";

type FetchState = "idle" | "loading" | "error";

const formatMoney = (value: number | null) =>
    value === null ? "Sob consulta" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const formatLimitLabel = (value: number | null, label: string) => (value === null ? `${label} ilimitadas` : `${value} ${label}`);

const formatUpdated = (date: Date | null) => (date ? date.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function LandingPage() {
    const { isAuthenticated, loginAsDemo } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [plans, setPlans] = useState<PublicPlan[]>([]);
    const [state, setState] = useState<FetchState>("loading");
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [demoLoading, setDemoLoading] = useState(false);

    const fetchPlans = async () => {
        setState("loading");
        try {
            const data = await pricingService.getPublicPlans();
            setPlans(data);
            const apiTimestamps = data.map((plan) => plan.updatedAt).filter(Boolean) as string[];
            const mostRecent = apiTimestamps.length ? new Date(apiTimestamps.sort().reverse()[0]) : new Date();
            setUpdatedAt(mostRecent);
            setState("idle");
        } catch (err) {
            setState("error");
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const startPlan = useMemo(() => {
        const explicitStart = plans.find((plan) => plan.code.toUpperCase().includes("START"));
        return explicitStart ?? plans[0];
    }, [plans]);

    const primaryCtaHref = isAuthenticated ? "/dashboard" : `/auth/signup?plan=${encodeURIComponent(startPlan?.code ?? "START")}`;

    const startDemo = async () => {
        setDemoLoading(true);
        try {
            await loginAsDemo("CLIENT");
            navigate("/dashboard");
        } catch (err) {
            toast({
                title: "Demo indisponível",
                description: "Tente novamente em instantes. O modo demo não usa dados reais.",
                variant: "destructive"
            });
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="fixed top-0 w-full z-40 bg-slate-950/85 backdrop-blur border-b border-slate-800 text-white">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo-white.png" alt="FiscoOne" className="h-9 w-auto" />
                        <span className="text-lg font-bold">FiscoOne</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm text-slate-200">
                        <a href="#planos" className="hover:text-emerald-300">Planos</a>
                        <a href="#confianca" className="hover:text-emerald-300">Confiança</a>
                        <a href="#faq" className="hover:text-emerald-300">FAQ & Jurídico</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link to="/dashboard">
                                <Button className="bg-white text-slate-900 hover:bg-slate-100">Ir para o Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/auth/login" className="text-sm font-semibold text-slate-200 hover:text-emerald-300">Entrar</Link>
                                <Button
                                    variant="outline"
                                    className="border-emerald-300/60 text-emerald-100 hover:text-emerald-300"
                                    onClick={startDemo}
                                    disabled={demoLoading}
                                >
                                    {demoLoading ? "Carregando demo..." : "Ver demo"}
                                </Button>
                                <Link to={primaryCtaHref}>
                                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">Começar</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-28">
                <section className="pb-16 bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" aria-hidden />
                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} aria-hidden />

                    <div className="container mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center relative z-10">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs font-semibold">
                                <ShieldCheck className="h-3.5 w-3.5" /> Escudo Fiscal sempre ativo
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                                Planos oficiais, limites claros.
                                <br />
                                Comece no START com transparência total.
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
                                Cada plano exibe limites de notas, assentos e contadores direto do backend (/public/plans). Sem promessas vagas: tudo que você vê está coberto pelo engine de entitlements.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to={primaryCtaHref}>
                                    <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-slate-900/20">
                                        Começar no START <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-emerald-300/60 text-white hover:bg-emerald-500/10"
                                    onClick={startDemo}
                                    disabled={demoLoading}
                                >
                                    {demoLoading ? "Abrindo demo..." : "Experimentar demo"}
                                </Button>
                                <a href="#planos">
                                    <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-white/10">
                                        Ver comparação de planos
                                    </Button>
                                </a>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-300" />Planos atualizados em {formatUpdated(updatedAt)}</div>
                                <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-300" />Bloqueio ético se limite for atingido</div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" aria-hidden />
                            <div className="relative bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 backdrop-blur">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-200"><ShieldCheck className="h-6 w-6" /></div>
                                    <div>
                                        <p className="text-sm text-slate-300">Plano sugerido</p>
                                        <p className="text-lg font-semibold text-white">{startPlan?.name ?? "START"}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <InfoPill label="Notas" value={formatLimitLabel(startPlan?.invoiceLimit ?? null, "notas/mês")} status="ok" tone="dark" />
                                    <InfoPill label="Assentos" value={formatLimitLabel(startPlan?.seatLimit ?? null, "assentos")} status="ok" tone="dark" />
                                    <InfoPill label="Contadores" value={formatLimitLabel(startPlan?.accountantLimit ?? null, "contadores")} status="ok" tone="dark" />
                                </div>
                                <div className="rounded-xl border border-slate-800 p-4 bg-slate-900 flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-slate-800 text-emerald-200"><Info className="h-4 w-4" /></div>
                                    <div className="text-sm text-slate-200">
                                        A mesma tabela que bloqueia excessos no backend alimenta esta página. Chegou no limite? O app bloqueia e mostra o CTA de upgrade.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="planos" className="pt-16 pb-6 bg-white">
                    <div className="container mx-auto px-6 space-y-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Planos oficiais do contrato
                                <span className="text-xs text-slate-400">Planos atualizados em {formatUpdated(updatedAt)}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Comparação de limites e preços</h2>
                            <p className="text-slate-600 max-w-3xl">Tabela é renderizada a partir do endpoint /public/plans. Limites duros aparecem em chips contrastantes. CTA fixa para START.</p>
                            {state === "error" && (
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                                    <div className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" /> Não foi possível carregar os planos. Tente novamente.</div>
                                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-900" onClick={fetchPlans}>
                                        <RefreshCw className="h-4 w-4 mr-1" /> Recarregar
                                    </Button>
                                </div>
                            )}
                        </div>

                        <PlanComparisonGrid
                            plans={plans}
                            loading={state === "loading"}
                            isAuthenticated={isAuthenticated}
                            primaryPlanCode={startPlan?.code ?? "START"}
                            onRetry={fetchPlans}
                        />

                        <LossExplainer plans={plans} />
                    </div>
                </section>

                <section id="confianca" className="py-16 bg-slate-50 border-t border-b border-slate-200">
                    <div className="container mx-auto px-6 space-y-6">
                        <div className="max-w-3xl">
                            <h3 className="text-2xl font-bold text-slate-900">Confiança e transparência</h3>
                            <p className="text-slate-600">Nudges éticos, bloqueio explícito e logs de auditoria para cada recusa de ação sensível.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
                            <TrustItem title="Fonte única" text="Mesmos limites do backend e do app. Sem divergência entre marketing e produto." />
                            <TrustItem title="Logs de bloqueio" text="Cada ENTITLEMENT_DENIED gera registro para você e seu contador." />
                            <TrustItem title="Atualização carimbada" text={`Carimbo: ${formatUpdated(updatedAt)}. Sempre mostramos quando os planos foram sincronizados.`} />
                        </div>
                    </div>
                </section>

                <section id="faq" className="py-16 bg-white">
                    <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-10 items-start">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-slate-900">Perguntas rápidas</h3>
                            <FaqItem question="O que acontece se eu passar do limite?" answer="O app bloqueia a emissão/adição conforme entitlement. O CTA mostra o próximo plano ou contato com suporte." />
                            <FaqItem question="Posso começar no START e subir depois?" answer="Sim. O CTA principal já seleciona START e você pode fazer upgrade com um clique ao atingir 80% do limite." />
                            <FaqItem question="Como são calculados valores extras?" answer="Se o plano expuser extra_invoice_price ou extra_seat_price, mostramos aqui. Caso contrário, bloqueio é aplicado em 100%." />
                        </div>
                        <div className="space-y-3 rounded-2xl border border-slate-200 p-5 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-800 font-semibold"><Info className="h-4 w-4 text-emerald-600" />Jurídico e transparência</div>
                            <p className="text-sm text-slate-600">Links rápidos para Termos, Política de Privacidade e tratamento de dados fiscais.</p>
                            <div className="flex flex-col gap-2 text-sm">
                                <a href="/legal/terms" className="text-emerald-700 hover:underline">Termos de Uso</a>
                                <a href="/legal/privacy" className="text-emerald-700 hover:underline">Política de Privacidade</a>
                                <a href="/legal/dados-fiscais" className="text-emerald-700 hover:underline">Tratamento de Dados Fiscais</a>
                            </div>
                            <div className="text-xs text-slate-500">Base legal e limites exibidos refletem o contrato vigente e o que o backend reforça em runtime.</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function PlanComparisonGrid({ plans, loading, isAuthenticated, primaryPlanCode, onRetry }: { plans: PublicPlan[]; loading: boolean; isAuthenticated: boolean; primaryPlanCode: string; onRetry: () => void }) {
    if (loading) {
        return <LoadingGrid />;
    }

    if (!plans.length) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Planos indisponíveis, tente novamente.
                </div>
                <Button size="sm" variant="outline" onClick={onRetry}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Recarregar
                </Button>
            </div>
        );
    }

    const columns = plans.length;
    const gridTemplate = { gridTemplateColumns: `220px repeat(${columns}, minmax(220px, 1fr))` } as const;

    const ctaHref = (plan: PublicPlan) => (isAuthenticated ? "/dashboard" : `/auth/signup?plan=${encodeURIComponent(plan.code)}`);

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
            <div className="min-w-[960px]">
                <div className="grid gap-3 px-4 py-3 text-xs font-semibold uppercase text-slate-500" style={gridTemplate}>
                    <div className="pt-6">Plano</div>
                    {plans.map((plan) => (
                        <PlanColumnHeader key={plan.code} plan={plan} highlight={plan.code === primaryPlanCode} ctaHref={ctaHref(plan)} />
                    ))}
                </div>

                <div className="h-px bg-slate-200" />

                <ComparisonRow label="Preço mensal" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <div key={`${plan.code}-price-month`} className="text-lg font-semibold text-slate-900">
                            {formatMoney(plan.priceMonthly)}
                        </div>
                    ))}
                </ComparisonRow>

                <ComparisonRow label="Preço anual" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <div key={`${plan.code}-price-year`} className="text-sm text-slate-700">
                            {plan.priceYearly ? `${formatMoney(plan.priceYearly)} / ano` : "Economia será exibida se disponível"}
                        </div>
                    ))}
                </ComparisonRow>

                <ComparisonRow label="Notas fiscais / mês" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <LimitChip key={`${plan.code}-inv`} value={plan.invoiceLimit} />
                    ))}
                </ComparisonRow>

                <ComparisonRow label="Assentos" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <LimitChip key={`${plan.code}-seat`} value={plan.seatLimit} />
                    ))}
                </ComparisonRow>

                <ComparisonRow label="Contadores" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <LimitChip key={`${plan.code}-acc`} value={plan.accountantLimit} />
                    ))}
                </ComparisonRow>

                <ComparisonRow label="Cobrança extra" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <div key={`${plan.code}-extra`} className="text-sm text-slate-700">
                            {plan.extraInvoicePrice || plan.extraSeatPrice ? (
                                <>
                                    {plan.extraInvoicePrice ? `Notas extra: ${formatMoney(plan.extraInvoicePrice)}` : ""}
                                    {plan.extraInvoicePrice && plan.extraSeatPrice ? " · " : ""}
                                    {plan.extraSeatPrice ? `Assento extra: ${formatMoney(plan.extraSeatPrice)}` : ""}
                                </>
                            ) : (
                                <span className="text-slate-500">Sem cobrança extra: bloqueia ao atingir limite.</span>
                            )}
                        </div>
                    ))}
                </ComparisonRow>

                <ComparisonRow label="Features" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <FeatureList key={`${plan.code}-features`} plan={plan} />
                    ))}
                </ComparisonRow>

                <ComparisonRow label="Se bloquear" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <div key={`${plan.code}-blocked`} className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            Ao atingir {formatLimitLabel(plan.invoiceLimit, "notas")}, emissão trava e mostra CTA de upgrade. Assentos e contadores seguem a mesma regra.
                        </div>
                    ))}
                </ComparisonRow>

                <div className="h-px bg-slate-200" />

                <ComparisonRow label="Escolher" gridTemplate={gridTemplate}>
                    {plans.map((plan) => (
                        <Link key={`${plan.code}-cta`} to={ctaHref(plan)}>
                            <Button className={`w-full ${plan.code === primaryPlanCode ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"}`}>
                                {plan.code === primaryPlanCode ? "Começar no START" : `Ir de ${plan.name}`}
                            </Button>
                        </Link>
                    ))}
                </ComparisonRow>
            </div>
        </div>
    );
}

function ComparisonRow({ label, gridTemplate, children }: { label: string; gridTemplate: { gridTemplateColumns: string }; children: ReactNode }) {
    return (
        <div className="grid gap-3 px-4 py-4 items-start" style={gridTemplate}>
            <div className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                {label}
            </div>
            {children}
        </div>
    );
}

function PlanColumnHeader({ plan, highlight, ctaHref }: { plan: PublicPlan; highlight: boolean; ctaHref: string }) {
    return (
        <div className={`rounded-2xl border p-4 bg-white shadow-sm ${highlight ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"}`}>
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-xs text-slate-500">{plan.code}</p>
                    <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
                </div>
                {highlight && <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-1">START</span>}
            </div>
            <p className="text-sm text-slate-600 mt-1 line-clamp-3">{plan.description || "Plano oficial registrado em contrato."}</p>
            <Link to={ctaHref} className="inline-flex mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Começar <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </div>
    );
}

function LimitChip({ value }: { value: number | null }) {
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${value === null ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-100 text-slate-800 border-slate-200"}`}>
            {value === null ? "Ilimitado" : value}
        </div>
    );
}

function FeatureList({ plan }: { plan: PublicPlan }) {
    const hasFeatures = plan.features && plan.features.length > 0;
    const fallback = plan.entitlements.map((ent) => `${ent.key}: ${ent.limit === null ? "ilimitado" : ent.limit}`);
    const items = hasFeatures ? plan.features : fallback;

    return (
        <ul className="text-xs text-slate-700 space-y-1">
            {items.map((item, idx) => (
                <li key={`${plan.code}-feature-${idx}`} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function LossExplainer({ plans }: { plans: PublicPlan[] }) {
    const reference = plans[0];
    const invoiceLimit = reference?.invoiceLimit ?? null;
    const seatLimit = reference?.seatLimit ?? null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold"><Lock className="h-4 w-4 text-amber-600" /> O que você perde se bloquear</div>
            <div className="text-sm text-slate-700">
                Se atingir {formatLimitLabel(invoiceLimit, "notas")}, o app bloqueia emissão e mostra CTA de upgrade. Assentos ({formatLimitLabel(seatLimit, "assentos")}) e contadores seguem a mesma regra. Nenhuma cobrança surpresa: bloqueio + convite para avançar de plano.
            </div>
        </div>
    );
}

function TrustItem({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
        </div>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="border-b border-slate-200 pb-3">
            <p className="font-semibold text-slate-900">{question}</p>
            <p className="text-sm text-slate-700 mt-1">{answer}</p>
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-6 w-full bg-slate-200 rounded" />
            <div className="h-6 w-full bg-slate-200 rounded" />
            <div className="h-6 w-full bg-slate-200 rounded" />
        </div>
    );
}

function InfoPill({ label, value, status, tone = "light" }: { label: string; value: string; status: "ok" | "alert" | "warn"; tone?: "light" | "dark" }) {
    const light = {
        ok: "bg-emerald-50 text-emerald-700 border-emerald-100",
        alert: "bg-amber-50 text-amber-700 border-amber-100",
        warn: "bg-slate-50 text-slate-700 border-slate-200"
    } as const;
    const dark = {
        ok: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
        alert: "bg-amber-500/10 text-amber-200 border-amber-500/30",
        warn: "bg-slate-800 text-slate-200 border-slate-700"
    } as const;
    const palette = tone === "dark" ? dark : light;
    return (
        <div className={`rounded-xl border ${palette[status]} px-3 py-2`}>
            <p className={`text-[11px] uppercase font-semibold tracking-wide ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
            <p className={`text-sm font-semibold ${tone === "dark" ? "text-white" : "text-slate-900"}`}>{value}</p>
        </div>
    );
}
