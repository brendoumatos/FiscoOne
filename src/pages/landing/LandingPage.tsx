import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, ShieldCheck, Zap, Globe, CheckCircle2, ChevronDown, Rocket, Building2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";


export default function LandingPage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-emerald-500/30">
            {/* Header / Nav */}
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo-white.png" alt="FiscoOne Logo" className="h-10 w-auto invert brightness-0" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">FiscoOne</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-emerald-600 transition-colors">Plataforma</a>
                        <a href="#scalability" className="hover:text-emerald-600 transition-colors">Infraestrutura</a>
                        <a href="#pricing" className="hover:text-emerald-600 transition-colors">Planos</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Link to="/dashboard">
                                <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6">
                                    Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors px-4">
                                    Login
                                </Link>
                                <Link to="/auth/signup">
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105">
                                        Começar Agora
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section - High Scale & Authority */}
            <section className="pt-40 pb-32 lg:pt-52 lg:pb-40 relative overflow-hidden bg-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/40 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Tecnologia Fiscal de Alta Performance
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Maximize sua <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500">Margem e Eficiência.</span>
                    </h1>

                    <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Pare de perder tempo com burocracia manual. O FiscoOne é a infraestrutura definitiva para empresas que buscam
                        <span className="font-semibold text-slate-900"> automação total</span>,
                        <span className="font-semibold text-slate-900"> compliance garantido</span> e
                        <span className="font-semibold text-slate-900"> escala ilimitada</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Link to="/auth/signup">
                            <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-slate-900 hover:bg-slate-800 shadow-xl hover:shadow-2xl transition-all">
                                Criar Conta Gratuita
                            </Button>
                        </Link>
                        <a href="#scalability" className="text-sm font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                            Entenda a Infraestrutura <ChevronDown className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Authority Metrics */}
                    <div className="mt-24 pt-12 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="font-bold text-2xl text-slate-900 text-center">
                            +10k <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Empresas Ativas</span>
                        </div>
                        <div className="font-bold text-2xl text-slate-900 text-center">
                            R$ 2Bi <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Processados/Mês</span>
                        </div>
                        <div className="font-bold text-2xl text-slate-900 text-center">
                            99.99% <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Uptime Garantido</span>
                        </div>
                        <div className="font-bold text-2xl text-slate-900 text-center">
                            SOC2 <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Ready Security</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features - Value Driven */}
            <section id="features" className="py-32 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-20">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Por que líderes do setor escolhem o FiscoOne?</h2>
                        <p className="text-lg text-slate-600">
                            Não oferecemos apenas "emissão de notas". Oferecemos uma suíte completa de inteligência fiscal
                            desenhada para reduzir custos operacionais e mitigar riscos tributários.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Automação Zero-Touch",
                                desc: "Configure regras de emissão recorrente e esqueça. O sistema emite, valida e envia notas fiscais automaticamente."
                            },
                            {
                                icon: ShieldCheck,
                                title: "Blindagem Fiscal",
                                desc: "Algoritmos que validam alíquotas e regras de retenção em tempo real, evitando multas e passivos trabalhistas."
                            },
                            {
                                icon: Globe,
                                title: "Multi-CNPJ Nativo",
                                desc: "Gerencie Holdings, Franquias ou Filiais em um único painel centralizado. Visão consolidada de caixa e impostos."
                            },
                            {
                                icon: BarChart3,
                                title: "Inteligência Financeira",
                                desc: "Dashboards que cruzam dados fiscais com fluxo de caixa, permitindo previsibilidade de impostos a pagar."
                            },
                            {
                                icon: Lock,
                                title: "Segurança Bancária",
                                desc: "Criptografia de ponta a ponta, logs de auditoria imutáveis e controle de acesso granular baseado em roles."
                            },
                            {
                                icon: Rocket,
                                title: "API-First Architecture",
                                desc: "Documentação completa para desenvolvedores. Integre ao seu ERP ou CRM em minutos, não meses."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group bg-white p-10 rounded-3xl border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mb-8 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Scalability - Dark Section (High Tech) */}
            <section id="scalability" className="py-32 bg-[#0A0F1C] text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-[#0A0F1C] to-[#0A0F1C]" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2">
                            <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6 rounded">
                                STATUS_SISTEMA: ESCALANDO
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                                Sua operação cresce.<br />
                                <span className="text-emerald-500">Nossa infraestrutura aguenta.</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                                Projetado para volume massivo. Seja para Black Friday ou crescimento exponencial,
                                o FiscoOne escala horizontalmente para garantir que sua emissão nunca pare.
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { label: "Latência de API", val: "< 100ms" },
                                    { label: "Disponibilidade", val: "99.99%" },
                                    { label: "Backups", val: "Automáticos " },
                                    { label: "Suporte", val: "24/7 Nível 2" },
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="text-2xl font-bold text-white mb-1">{stat.val}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-1/2 w-full">
                            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1">
                                <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 blur-3xl -z-10" />
                                <div className="rounded-xl bg-[#0F1629] p-6 font-mono text-sm overflow-hidden">
                                    <div className="flex gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                                    </div>
                                    <div className="space-y-2 text-slate-300">
                                        <p><span className="text-purple-400">const</span> <span className="text-blue-400">invoice</span> = <span className="text-purple-400">await</span> fiscoone.invoices.<span className="text-yellow-300">create</span>({`{`}</p>
                                        <p className="pl-4"><span className="text-emerald-300">amount</span>: <span className="text-orange-300">500000</span>,</p>
                                        <p className="pl-4"><span className="text-emerald-300">recipient</span>: {`{`}</p>
                                        <p className="pl-8"><span className="text-emerald-300">taxId</span>: <span className="text-green-300">"00.000.000/0001-91"</span>,</p>
                                        <p className="pl-8"><span className="text-emerald-300">email</span>: <span className="text-green-300">"financeiro@enterprise.com"</span></p>
                                        <p className="pl-4">{'}'},</p>
                                        <p className="pl-4"><span className="text-emerald-300">webhooks</span>: [<span className="text-green-300">"https://api.erp.com/callback"</span>]</p>
                                        <p>{'}'});</p>
                                        <p className="mt-4 text-emerald-500/80">// Saída: Nota Fiscal Emitida via Fila Assíncrona</p>
                                        <p><span className="text-blue-400">console</span>.<span className="text-yellow-300">log</span>(invoice.<span className="text-emerald-300">status</span>); <span className="text-slate-500">// "PROCESSANDO"</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section - Strategic */}
            <section id="pricing" className="py-32 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Investimento Transparente</h2>
                        <p className="text-lg text-slate-500">
                            Sem taxas ocultas, sem contratos de fidelidade abusivos. Escolha o plano que se adapta ao seu momento.
                        </p>
                    </div>

                    {/* 3 Column Grid */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">

                        {/* 1. Teste Grátis (Scarcity: Testing only) */}
                        <div className="relative p-8 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Plano de Teste</h3>
                                <p className="text-sm text-slate-500 mt-2">Para validar a plataforma.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-slate-900">R$ 0</span>
                                <span className="text-slate-400 font-medium">/sempre</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Até <strong>2 Notas Fiscais</strong> por CNPJ (Vitalício)</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Acesso Básico ao Dashboard</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Suporte via Email</span>
                                </li>
                            </ul>
                            <Link to="/auth/signup" className="mt-auto">
                                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-900 font-semibold">
                                    Criar Conta Teste
                                </Button>
                            </Link>
                        </div>

                        {/* 2. Inicial (Basic) */}
                        <div className="relative p-8 rounded-3xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Inicial</h3>
                                <p className="text-sm text-slate-500 mt-2">Pequenos negócios e prestadores.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-slate-900">R$ 69</span>
                                <span className="text-slate-400 font-medium">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Até <strong>5 Notas Fiscais</strong>/mês</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Armazenamento XML por 5 anos</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Envio automático por Email</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-400">
                                    <span className="text-xs mt-0.5 border border-slate-200 rounded px-1.5 py-0.5">Extra</span>
                                    <span>R$ 1,50 por nota adicional</span>
                                </li>
                            </ul>
                            <Link to="/auth/signup" className="mt-auto">
                                <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                                    Assinar Inicial
                                </Button>
                            </Link>
                        </div>

                        {/* 3. Profissional (Hero/Featured) */}
                        <div className="relative p-8 rounded-3xl border-2 border-emerald-500 bg-white shadow-2xl scale-105 z-10 flex flex-col">
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                                Recomendado
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-emerald-700">Profissional</h3>
                                <p className="text-sm text-slate-500 mt-2">Automação total e sem limites.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-slate-900">R$ 149</span>
                                <span className="text-slate-400 font-medium">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-900 font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Notas Fiscais <strong>Ilimitadas</strong></span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Inteligência Artificial Fiscal</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Até 3 Usuários</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Certificado Digital A1 Grátis</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Suporte Prioritário</span>
                                </li>
                            </ul>
                            <Link to="/auth/signup" className="mt-auto">
                                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20">
                                    Começar Teste Grátis
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Enterprise / Need More? Section */}
                    <div className="max-w-4xl mx-auto mt-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col items-center">
                            <span className="text-slate-400 mb-4 animate-bounce"><ArrowRight className="rotate-90 w-6 h-6" /></span>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Precisa de mais vantagens?</h3>
                            <p className="text-slate-600 mb-8 max-w-xl">
                                Para grandes volumes, operações de BPO, Holdings ou necessidades de API dedicada com SLA agressivo.
                            </p>

                            <div className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between text-left gap-8">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Building2 className="w-6 h-6 text-indigo-600" />
                                        Plano Enterprise & Partners
                                    </h4>
                                    <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                                        <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> API Dedicada</li>
                                        <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Gestor de Conta</li>
                                        <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> SSO / SAML</li>
                                        <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Custom Features</li>
                                        <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Múltiplos CNPJs (+10)</li>
                                        <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> White-label opcional</li>
                                    </ul>
                                </div>
                                <div className="shrink-0">
                                    <Button className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20">
                                        Falar com Especialistas
                                    </Button>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 mt-6 max-w-screen-md">
                                * Custos de uso excedente: SMS (R$ 0,10/envio), Armazenamento Extra (R$ 0,05/GB). Os valores dos planos podem sofrer reajuste anual pelo IPCA.
                                A garantia de uptime de 99.99% se aplica aos planos Enterprise.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer className="bg-white py-12 border-t border-slate-100">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <img src="/logo-white.png" alt="FiscoOne Logo" className="h-6 w-auto invert brightness-0" />
                        FiscoOne
                    </div>
                    <div className="text-sm text-slate-500">
                        &copy; 2024 FiscoOne Tecnologia. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
