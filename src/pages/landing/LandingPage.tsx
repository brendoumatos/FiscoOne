import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Shield, ArrowRight, Lock, TrendingUp, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const plans = [
    {
        code: "PLAN_START",
        name: "Start",
        price: "R$ 8,99 / mês",
        tag: "Essencial para começar",
        color: "bg-slate-50 border-slate-200",
        accent: "text-slate-700",
        badge: "Escudo básico",
        bullets: [
            "2 notas fiscais / mês",
            "1 acesso (owner)",
            "Dashboard básico",
            "Alertas fiscais informativos",
            "Auditoria ativa automática"
        ],
        cta: "Começar com organização",
        audience: "Autônomos e prestadores que precisam de emissão segura",
        shieldTone: "start"
    },
    {
        code: "PLAN_ESSENTIAL",
        name: "Essencial",
        price: "R$ 49 / mês",
        tag: "Mais controlado",
        color: "bg-emerald-50 border-emerald-200",
        accent: "text-emerald-800",
        badge: "Proteção em dia",
        bullets: [
            "5 notas fiscais / mês",
            "1 acesso",
            "Dashboard completo",
            "Acompanhamento de impostos",
            "Calendário tributário",
            "Alertas por e-mail e WhatsApp"
        ],
        cta: "Manter tudo em dia",
        audience: "Serviços recorrentes que não podem atrasar tributos",
        shieldTone: "essential"
    },
    {
        code: "PLAN_PROFESSIONAL",
        name: "Profissional",
        price: "R$ 149 / mês",
        tag: "Mais escolhido",
        color: "bg-purple-50 border-purple-200",
        accent: "text-purple-800",
        badge: "Escudo avançado",
        bullets: [
            "50 notas fiscais / mês",
            "3 acessos (assentos)",
            "Emissão recorrente",
            "Saúde financeira",
            "Gestão de documentos",
            "Auditoria visível"
        ],
        cta: "Crescer com segurança",
        audience: "Empresas em expansão que precisam de governança",
        shieldTone: "professional"
    },
    {
        code: "PLAN_ENTERPRISE",
        name: "Enterprise",
        price: "a partir de R$ 349",
        tag: "Sob medida",
        color: "bg-amber-50 border-amber-200",
        accent: "text-amber-800",
        badge: "Blindagem total",
        bullets: [
            "Notas ilimitadas",
            "Usuários ilimitados",
            "Contador dedicado",
            "Validações avançadas",
            "Suporte prioritário"
        ],
        cta: "Falar com especialista",
        audience: "Operações complexas que exigem SLAs e validações extras",
        shieldTone: "enterprise"
    }
];

export default function LandingPage() {
    const { isAuthenticated, loginAsDemo } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [demoLoading, setDemoLoading] = useState(false);
    const primaryCtaHref = isAuthenticated ? "/dashboard" : "/auth/signup?plan=PLAN_START";

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
            <header className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur border-b border-slate-800 text-white">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo-white.png" alt="FiscoOne" className="h-9 w-auto" />
                        <span className="text-lg font-bold">FiscoOne</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm text-slate-200">
                        <a href="#como-funciona" className="hover:text-emerald-300">Como funciona</a>
                        <a href="#shield" className="hover:text-emerald-300">Escudo Fiscal</a>
                        <a href="#pricing" className="hover:text-emerald-300">Planos</a>
                        <a href="#confianca" className="hover:text-emerald-300">Confiança</a>
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

            {/* Hero alinhado à identidade do signup (fundo escuro, gradientes e trama) */}
            <section className="pt-32 pb-24 bg-slate-950 text-white relative overflow-hidden" id="hero">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" aria-hidden />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-900/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" aria-hidden />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/60 to-slate-950/90" aria-hidden />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} aria-hidden />

                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs font-semibold">
                            <ShieldCheck className="h-3.5 w-3.5" /> Fiscal Operating System
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Seu negócio organizado.</span><br />
                            Seus impostos sob controle.
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            A mesma identidade visual do signup: fundos escuros premium, gradientes sutis e clareza absoluta. Emita notas, acompanhe impostos e cresça com segurança.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to={primaryCtaHref}>
                                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-slate-900/20">
                                    Começar com Proteção Fiscal <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-emerald-300/60 text-white hover:bg-emerald-500/10"
                                onClick={startDemo}
                                disabled={demoLoading}
                            >
                                {demoLoading ? "Abrindo demo..." : "Experimentar demo agora"}
                            </Button>
                            <a href="#pricing">
                                <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-white/10">
                                    Ver planos e proteção
                                </Button>
                            </a>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-300" />Escudo Fiscal ativo desde o primeiro acesso</div>
                            <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-300" />Auditoria e isolamento por empresa</div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" aria-hidden />
                        <div className="relative bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-200"><ShieldCheck className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-sm text-slate-300">Escudo Fiscal Ativo</p>
                                    <p className="text-lg font-semibold text-white">Plano Essencial</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <InfoPill label="Notas" value="2 / 5" status="ok" tone="dark" />
                                <InfoPill label="Assentos" value="1 / 1" status="ok" tone="dark" />
                                <InfoPill label="Recorrência" value="Disponível" status="alert" tone="dark" />
                            </div>
                            <div className="rounded-xl border border-slate-800 p-4 bg-slate-900 flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-slate-800 text-emerald-200"><TrendingUp className="h-4 w-4" /></div>
                                <div className="text-sm text-slate-200">
                                    O sistema monitora seu uso e sugere o upgrade ideal antes de chegar ao limite.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Onboarding Preview (mesmas boas práticas do produto) */}
            <section id="onboarding-preview" className="pb-24 bg-white">
                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-slate-900">Onboarding guiado em 5 passos</h2>
                        <p className="text-lg text-slate-600">
                            A mesma experiência clara do app: barra de progresso, validação em cada passo, preenchimento automático de CNPJ e explicação de limites antes de você começar a emitir.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />Progresso e status visíveis para evitar fricção.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />Validação incremental: cada etapa confirma dados antes de avançar.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />Educação contextual: avisos de limites (notas, assentos) já no fluxo.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />Finalização com resumo e ativação imediata do Escudo Fiscal.</li>
                        </ul>
                    </div>
                    <OnboardingPreview currentStep={3} />
                </div>
            </section>

            {/* Como funciona */}
            <section id="como-funciona" className="py-24 bg-white border-t border-b border-slate-100">
                <div className="container mx-auto px-6 space-y-12">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl font-bold text-slate-900">Como o FiscoOne trabalha por você</h2>
                        <p className="text-lg text-slate-600 mt-3">Três passos claros que unem UI, backend e compliance.</p>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6">
                        <StepCard
                            number="1️⃣"
                            title="Emitir"
                            text="Emita suas notas fiscais com validação automática e registro auditável."
                            mapping="UI: formulário guiado | Backend: checkEntitlement(ISSUE_INVOICE) | Compliance: logs imutáveis"
                        />
                        <StepCard
                            number="2️⃣"
                            title="Acompanhar"
                            text="Acompanhe faturamento, impostos e obrigações em um painel claro e confiável."
                            mapping="UI: dashboard | Backend: ACCESS_DASHBOARD | Compliance: isolamento por empresa"
                        />
                        <StepCard
                            number="3️⃣"
                            title="Crescer com Segurança"
                            text="O sistema analisa uso e avisa quando é hora de mudar de plano ou regime, sem surpresas."
                            mapping="UI: nudges de upgrade | Backend: limites e créditos | Compliance: alertas auditados"
                        />
                    </div>
                </div>
            </section>

            {/* Escudo Fiscal */}
            <section id="shield" className="py-24 bg-slate-50 border-b border-slate-100">
                <div className="container mx-auto px-6 space-y-12">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl font-bold text-slate-900">O que é um Escudo de Proteção Fiscal?</h2>
                        <p className="text-lg text-slate-600 mt-3">
                            No FiscoOne, cada plano representa um nível de proteção fiscal. Quanto maior o seu negócio, maior deve ser a proteção. O escudo controla acesso, previne risco e evolui junto com sua operação.
                        </p>
                    </div>
                    <div className="grid lg:grid-cols-4 gap-6">
                        <ShieldCard tone="start" title="Start" desc="Organização inicial e alertas informativos." />
                        <ShieldCard tone="essential" title="Essencial" desc="Cobertura completa de impostos e calendário tributário." />
                        <ShieldCard tone="professional" title="Profissional" desc="Governança com recorrência, documentos e saúde financeira." />
                        <ShieldCard tone="enterprise" title="Enterprise" desc="Blindagem total com contador dedicado e validações avançadas." />
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-24 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" aria-hidden />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} aria-hidden />

                <div className="container mx-auto px-6 space-y-12 relative z-10">
                    <div className="max-w-3xl text-left">
                        <h2 className="text-3xl font-bold text-white">Planos oficiais e protegidos</h2>
                        <p className="text-lg text-slate-200 mt-3">Todos os planos são aplicados no backend via entitlement engine. Sem promessas não cumpridas.</p>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-6">
                        {plans.map((plan) => (
                            <PricingCard key={plan.code} plan={plan} isAuthenticated={isAuthenticated} />
                        ))}
                    </div>

                    <div className="rounded-2xl border border-slate-800 p-6 bg-slate-900/70 backdrop-blur">
                        <h3 className="text-xl font-semibold text-white mb-2">Upgrade ético e previsível</h3>
                        <p className="text-slate-300 text-sm mb-3">Essencial recebe destaque de "Mais escolhido"; Profissional é recomendado para crescimento. Economias anuais são mostradas apenas quando reais. Sem dark patterns.</p>
                        <ul className="text-slate-300 text-sm list-disc ml-5 space-y-1">
                            <li>CTA de cada plano inicia cadastro com o plano já selecionado e ativa o Escudo Fiscal imediatamente.</li>
                            <li>Onboarding explica limites e o que acontece ao atingir 75% de uso (nudge) ou 100% (bloqueio com sugestão de upgrade).</li>
                            <li>Enterprise direciona para conversa com especialista para configurar SLAs e validações avançadas.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Confiança e Compliance */}
            <section id="confianca" className="py-24 bg-slate-900 text-white">
                <div className="container mx-auto px-6 space-y-10">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl font-bold">Confiança e conformidade, por padrão</h2>
                        <p className="text-lg text-slate-200 mt-3">Auditoria imutável, isolamento por empresa e aderência fiscal para evitar riscos.</p>
                    </div>
                    <div className="grid lg:grid-cols-4 gap-6 text-sm text-slate-100">
                        <TrustItem title="Auditoria imutável" text="Logs assinados e ENTITLEMENT_DENIED registrado para cada bloqueio sensível." />
                        <TrustItem title="Isolamento por empresa" text="Multi-tenant com ensureCompanyAccess e RBAC por role e firma contábil." />
                        <TrustItem title="Conformidade fiscal" text="Limites, features e validações mapeadas direto no engine de plano." />
                        <TrustItem title="Contador parceiro" text="Acesso delegado auditável; ações de contador são diferenciadas." />
                    </div>
                </div>
            </section>

            {/* CTA final */}
            <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" aria-hidden />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} aria-hidden />
                <div className="container mx-auto px-6 text-center space-y-6 relative z-10">
                    <h3 className="text-3xl font-bold text-white">Ative seu Escudo Fiscal hoje</h3>
                    <p className="text-lg text-slate-200">Escolha um plano, ative o escudo e continue tranquilo. O backend já protege suas ações.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to={primaryCtaHref}>
                            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-slate-900/20">Começar com Proteção Fiscal</Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-emerald-300/60 text-white hover:bg-emerald-500/10"
                            onClick={startDemo}
                            disabled={demoLoading}
                        >
                            {demoLoading ? "Abrindo demo..." : "Acessar demo sem cadastro"}
                        </Button>
                        <a href="#pricing">
                            <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-white/10">Comparar planos</Button>
                        </a>
                    </div>
                    <p className="text-xs text-slate-400">Landing, Pricing e Produto totalmente alinhados. Nenhuma feature é exibida sem cobertura no backend.</p>
                </div>
            </section>
        </div>
    );
}

function InfoPill({ label, value, status, tone = "light" }: { label: string; value: string; status: "ok" | "alert" | "warn"; tone?: "light" | "dark" }) {
    const light = {
        ok: "bg-emerald-50 text-emerald-700 border-emerald-100",
        alert: "bg-amber-50 text-amber-700 border-amber-100",
        warn: "bg-slate-50 text-slate-700 border-slate-200"
    };
    const dark = {
        ok: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
        alert: "bg-amber-500/10 text-amber-200 border-amber-500/30",
        warn: "bg-slate-800 text-slate-200 border-slate-700"
    };
    const palette = tone === "dark" ? dark : light;
    return (
        <div className={`rounded-xl border ${palette[status]} px-3 py-2`}>
            <p className={`text-[11px] uppercase font-semibold tracking-wide ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
            <p className={`text-sm font-semibold ${tone === "dark" ? "text-white" : "text-slate-900"}`}>{value}</p>
        </div>
    );
}

function StepCard({ number, title, text, mapping }: { number: string; title: string; text: string; mapping: string }) {
    return (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="text-sm font-bold text-emerald-700">{number}</div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">{mapping}</div>
        </div>
    );
}

function OnboardingPreview({ currentStep = 3 }: { currentStep?: number }) {
    const steps = ["Identidade", "Perfil", "Endereço", "Financeiro", "Ativação"];
    const totalSteps = steps.length;
    const percentage = Math.round((currentStep / totalSteps) * 100);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Onboarding do app</p>
                    <p className="text-lg font-semibold text-slate-900">Preparação fiscal guiada</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Passo {currentStep} de {totalSteps}</span>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>

            <div className="grid grid-cols-5 gap-2 text-[11px] font-semibold text-slate-500">
                {steps.map((label, index) => {
                    const isCurrent = index + 1 === currentStep;
                    const isDone = index + 1 < currentStep;
                    return (
                        <div key={label} className={`rounded-xl border px-2.5 py-2 flex items-center gap-2 ${isCurrent ? "border-emerald-200 bg-emerald-50 text-emerald-700" : isDone ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"}`}>
                            <div className={`h-5 w-5 rounded-lg flex items-center justify-center text-[11px] ${isCurrent ? "bg-emerald-100 text-emerald-700" : isDone ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-500"}`}>
                                {index + 1}
                            </div>
                            <span className="truncate">{label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-white text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
                <div className="space-y-1">
                    <p className="font-semibold text-slate-900">Validação incremental</p>
                    <p className="text-sm text-slate-600">Cada passo confirma os dados e explica limites de notas, assentos e recorrência antes de ativar o escudo.</p>
                </div>
            </div>
        </div>
    );
}

type ShieldTone = "start" | "essential" | "professional" | "enterprise";

function ShieldCard({ tone, title, desc }: { tone: ShieldTone; title: string; desc: string }) {
    const toneMap: Record<ShieldTone, { bg: string; text: string; iconColor: string }> = {
        start: { bg: "bg-slate-50 border-slate-200", text: "text-slate-800", iconColor: "text-slate-500" },
        essential: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", iconColor: "text-emerald-600" },
        professional: { bg: "bg-purple-50 border-purple-200", text: "text-purple-800", iconColor: "text-purple-600" },
        enterprise: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", iconColor: "text-amber-600" }
    };
    const toneData = toneMap[tone];
    return (
        <div className={`p-5 rounded-2xl border ${toneData.bg} space-y-3`}>
            <div className={`p-2 rounded-lg bg-white/60 inline-flex ${toneData.iconColor}`}>
                <Shield className="h-5 w-5" />
            </div>
            <h4 className={`text-lg font-semibold ${toneData.text}`}>{title}</h4>
            <p className="text-sm text-slate-600">{desc}</p>
            <ul className="text-xs text-slate-500 space-y-1">
                <li>Controle de acesso por plano</li>
                <li>Prevenção de risco fiscal</li>
                <li>Evolução contínua conforme crescimento</li>
            </ul>
        </div>
    );
}

function PricingCard({ plan, isAuthenticated }: { plan: typeof plans[number]; isAuthenticated: boolean }) {
    const shieldColors: Record<ShieldTone, string> = {
        start: "bg-slate-800 text-slate-200",
        essential: "bg-emerald-500/20 text-emerald-100 border border-emerald-500/40",
        professional: "bg-purple-500/20 text-purple-100 border border-purple-500/40",
        enterprise: "bg-amber-500/20 text-amber-100 border border-amber-500/40"
    };
    const tone = plan.shieldTone as ShieldTone;
    const href = isAuthenticated ? `/dashboard/settings?plan=${plan.code}` : `/auth/signup?plan=${plan.code}`;
    const isFeatured = plan.tag.includes("Mais escolhido");
    const buttonClass = tone === "enterprise"
        ? "w-full border-slate-600 text-white bg-slate-800 hover:bg-slate-700"
        : "w-full bg-white text-slate-900 hover:bg-slate-100";

    return (
        <div className={`p-6 rounded-2xl border ${isFeatured ? "border-emerald-400/70" : "border-slate-800"} ${isFeatured ? "bg-slate-900/80" : "bg-slate-900/60"} shadow-xl flex flex-col gap-4 relative overflow-hidden backdrop-blur`}
            style={isFeatured ? { boxShadow: "0 20px 60px rgba(16, 185, 129, 0.25)" } : undefined}>
            {isFeatured && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400" aria-hidden />
            )}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className={`text-xs font-semibold uppercase ${isFeatured ? "text-emerald-200" : "text-slate-400"}`}>{plan.tag}</p>
                    <h3 className={`text-xl font-bold ${isFeatured ? "text-white" : plan.accent}`}>{plan.name}</h3>
                    <p className="text-sm text-slate-300">{plan.audience}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isFeatured ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40" : shieldColors[tone]}`}>Escudo</span>
            </div>
            <div>
                <p className={`text-3xl font-extrabold ${isFeatured ? "text-white" : "text-slate-100"}`}>{plan.price}</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-200">
                {plan.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 ${isFeatured ? "text-emerald-300" : "text-emerald-500"}`} />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
            <Link to={href} className="mt-auto">
                <Button className={buttonClass} variant={tone === "enterprise" ? "outline" : "default"}>
                    {plan.cta}
                </Button>
            </Link>
            <div className="text-xs text-slate-400">
                Upgrade imediato e auditável. A seleção do plano ativa o Escudo Fiscal no backend (subscriptions + entitlements).
            </div>
        </div>
    );
}

function TrustItem({ title, text }: { title: string; text: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm"><Lock className="h-4 w-4" />{title}</div>
            <p className="text-slate-200 text-sm leading-relaxed">{text}</p>
        </div>
    );
}
