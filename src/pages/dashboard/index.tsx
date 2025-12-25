import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Activity, ArrowUpRight, AlertCircle, DollarSign } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
import { FiscalHealthWidget } from "@/components/dashboard/FiscalHealthWidget";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { FiscalScoreBadge } from "@/components/dashboard/FiscalScoreBadge";
import { scoreService } from "@/services/score";
import { useAuth } from "@/contexts/AuthContext";

import { FinancialReadinessWidget } from "@/components/dashboard/FinancialReadinessWidget";
import { readinessService } from "@/services/readiness";
import { PlanBadge } from "@/components/dashboard/PlanBadge";
import { PlanShield } from "@/components/common/PlanShield";
import { UsageWidget } from "@/components/dashboard/UsageWidget";
import { AnnualUpsell } from "@/components/dashboard/AnnualUpsell";
import { PricingInsight } from "@/components/dashboard/PricingInsight";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentCompany } = useAuth();
    const { data: subscription } = useSubscription();

    // Queries
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats', currentCompany?.id],
        queryFn: () => dashboardService.getStats(), // Removed arg
        enabled: !!currentCompany
    });

    const { data: scoreData } = useQuery({
        queryKey: ['fiscal-score', currentCompany?.id],
        queryFn: () => currentCompany ? scoreService.getScore(currentCompany.id) : null,
        enabled: !!currentCompany
    });

    const { data: readiness } = useQuery({
        queryKey: ['financial-readiness', currentCompany?.id],
        queryFn: () => currentCompany ? readinessService.getReadiness(currentCompany.id) : null,
        enabled: !!currentCompany
    });

    const quickActions = [
        { label: "Emitir Nota", description: "Gerar nova NF-e/NFS-e", icon: FileText, color: "bg-blue-500", onClick: () => navigate('/dashboard/invoices/issue') },
        { label: "Ver Impostos", description: "Guia DAS e Darf", icon: AlertCircle, color: "bg-amber-500", onClick: () => navigate('/dashboard/taxes') },
        { label: "Conciliar", description: "Importar extrato OFX", icon: Activity, color: "bg-emerald-500", onClick: () => navigate('/dashboard/finance') },
    ];

    const usageNearLimit = subscription && subscription.plan.limit > 0
        ? subscription.usage.invoices / subscription.plan.limit >= 0.75
        : false;

    const chartData = [
        { name: 'Jan', receita: 4000, despesas: 2400 },
        { name: 'Fev', receita: 3000, despesas: 1398 },
        { name: 'Mar', receita: 2000, despesas: 9800 },
        { name: 'Abr', receita: 2780, despesas: 3908 },
        { name: 'Mai', receita: 1890, despesas: 4800 },
        { name: 'Jun', receita: 2390, despesas: 3800 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 w-full">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                Visão Geral
                                {subscription && <PlanBadge planCode={subscription.plan.code} planName={subscription.plan.name} />}
                            </h2>
                            <p className="text-slate-500">Bem-vindo de volta, {currentCompany?.tradeName || "Empresa"}.</p>
                        </div>
                        <div className="min-w-[260px]">
                            <PlanShield />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {scoreData && (
                        <FiscalScoreBadge
                            score={scoreData.score}
                            riskLevel={scoreData.riskLevel}
                            explanation={scoreData.explanation || []}
                        />
                    )}
                    <Button onClick={() => navigate('/dashboard/invoices/issue')}>
                        <FileText className="mr-2 h-4 w-4" /> Nova Nota
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <FiscalHealthWidget
                        financials={stats ? { revenue: stats.monthlyRevenue, debts: stats.pendingTaxes, annualRevenue: stats.annualRevenue } : undefined}
                    />
                </div>
                <div className="md:col-span-1 space-y-6">
                    {subscription && (
                        <UsageWidget
                            current={subscription.usage.invoices}
                            limit={subscription.plan.limit}
                            planName={subscription.plan.name}
                        />
                    )}

                    <PricingInsight />

                    {usageNearLimit && (
                        <Card className="border-emerald-200 bg-emerald-50/60">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-emerald-800">Proteção quase no limite</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-emerald-900">
                                <p className="text-sm">Seu escudo fiscal está em {Math.round((subscription!.usage.invoices / subscription!.plan.limit) * 100)}% do limite de notas.</p>
                                <Button size="sm" onClick={() => navigate('/dashboard/settings?tab=billing')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Reforçar escudo (upgrade)
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {readiness && (
                        <FinancialReadinessWidget
                            status={readiness.status}
                            explanation={readiness.explanation}
                            avgRevenue={readiness.summary.avgMonthlyRevenue}
                            score={readiness.summary.fiscalScore}
                        />
                    )}
                </div>
            </div>

            {/* Metrics Cards ... */}

            {/* Annual Plan Upsell */}
            {!subscription?.plan.cycle || subscription.plan.cycle === 'MONTHLY' ? (
                <div className="mb-6">
                    <AnnualUpsell />
                </div>
            ) : null}

            {/* Metrics Cards - "Safety & Sophistication" */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-white border-l-4 border-l-emerald-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <DollarSign className="h-12 w-12 text-emerald-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Receita Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">R$ {stats?.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +12.5% <span className="text-slate-400 font-normal ml-1">vs mês anterior</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-white border-l-4 border-l-blue-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <FileText className="h-12 w-12 text-blue-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Notas Emitidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.invoicesIssued}</div>
                        <p className="text-xs text-slate-500 font-medium flex items-center mt-1">
                            <span className="text-blue-600 flex items-center mr-1"><ArrowUpRight className="h-3 w-3" /> +8%</span>
                            <span className="text-slate-400">vs mês anterior</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-white border-l-4 border-l-amber-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <AlertCircle className="h-12 w-12 text-amber-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Impostos a Pagar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">R$ {stats?.pendingTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Vencimento em <span className="text-amber-600 font-bold">5 dias</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-white border-l-4 border-l-emerald-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Activity className="h-12 w-12 text-emerald-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Lucro Líquido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">R$ {((stats?.monthlyRevenue || 0) - (stats?.pendingTaxes || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-emerald-600 font-medium mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1 inline-block" />
                            Margem Saudável
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Row */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" /> Ações Rápidas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {quickActions.map((action, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className="h-auto py-4 px-4 flex flex-col items-start gap-3 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group border-slate-200 bg-white shadow-sm rounded-xl"
                            onClick={action.onClick}
                        >
                            <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform shadow-md`}>
                                <action.icon className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-slate-900 text-sm">{action.label}</div>
                                <div className="text-[11px] text-slate-500">{action.description}</div>
                            </div>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Charts Section - "Breathing Room" */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2 border-slate-100 shadow-sm rounded-xl bg-white border-none ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-900">Receita x Despesas</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }} formatter={(value: any) => [`R$ ${value.toLocaleString()}`, '']} />
                                    <Area type="monotone" dataKey="receita" name="Receita" stroke="#10B981" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#3B82F6" fillOpacity={1} fill="url(#colorDespesas)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-slate-100 shadow-sm rounded-xl bg-white border-none ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-900">Próximos Vencimentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:bg-white hover:border-emerald-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                                            DAS
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">DAS - Novembro</div>
                                            <div className="text-xs text-slate-500">Vence em 5 dias</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">R$ 150,00</div>
                                </div>
                            ))}
                        </div>
                        <Button variant="link" className="w-full mt-4 text-emerald-600 hover:text-emerald-700" onClick={() => navigate('/dashboard/taxes')}>
                            Ver todos os vencimentos
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
