
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ChevronRight, AlertTriangle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { taxService } from "@/services/tax";

interface FiscalHealthWidgetProps {
    financials?: {
        revenue: number;
        debts: number;
        annualRevenue: number;
    };
}

export function FiscalHealthWidget({ financials }: FiscalHealthWidgetProps) {
    const { data: summary } = useQuery({
        queryKey: ['tax-summary'],
        queryFn: taxService.getSummary
    });

    // Score Calculation Logic
    // Base 100
    // -30 for overdue taxes (Compliance)
    // -10 for pending taxes (Compliance warning)
    // -20 if Debt/Revenue > 50% (Financial Solvency)
    // -10 if Debt/Revenue > 20% (Financial Warning)

    let score = 100;
    const issues = [];
    let debtRatio = 0;

    // 1. Compliance Check
    if (summary) {
        if (summary.overdueAmount > 0) {
            score -= 30;
            issues.push({
                id: 'overdue_tax',
                title: 'Impostos em Atraso',
                severity: 'critical',
                action: 'Regularizar'
            });
        }
        if (summary.totalPending > 0 && summary.overdueAmount === 0) {
            score -= 5;
            issues.push({
                id: 'pending_tax',
                title: 'Guias em Aberto',
                severity: 'warning',
                action: 'Pagar'
            });
        }
    }

    // 2. Financial Solvency Check
    if (financials && financials.revenue > 0) {
        debtRatio = (financials.debts / financials.revenue) * 100;

        if (debtRatio > 50) {
            score -= 20;
            issues.push({
                id: 'high_debt',
                title: 'Alto Comprometimento',
                severity: 'critical',
                action: 'Analisar'
            });
        } else if (debtRatio > 20) {
            score -= 10;
            issues.push({
                id: 'mod_debt',
                title: 'Atenção Financeira',
                severity: 'warning',
                action: 'Fluxo'
            });
        }
    }

    // Cap score
    score = Math.max(0, Math.min(100, score));

    // Colors & Definitions
    const isHealthy = score >= 90;
    const isWarning = score >= 70 && score < 90;

    // Gradient definitions for SVG
    const gradientId = "health-gradient";
    const startColor = isHealthy ? "#22c55e" : isWarning ? "#eab308" : "#ef4444"; // green-500 : yellow-500 : red-500
    const endColor = isHealthy ? "#16a34a" : isWarning ? "#ca8a04" : "#dc2626"; // green-600 : yellow-600 : red-600

    const healthTextColor = isHealthy ? "text-green-600" : isWarning ? "text-yellow-600" : "text-red-600";
    const HealthIcon = isHealthy ? ShieldCheck : ShieldAlert;

    // SVG Circle consts
    const radius = 32; // Slightly smaller ring
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // REGIME LOGIC (For MEI example)
    const MEI_LIMIT = 81000;
    const currentRevenue = financials?.annualRevenue || 0;
    const regimeProgress = Math.min((currentRevenue / MEI_LIMIT) * 100, 100);
    const isApproachingLimit = regimeProgress > 80;

    return (
        <Card className="border-none shadow-sm overflow-hidden relative bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm group hover:shadow-md transition-all duration-300">
            {/* Subtle top accents instead of full side bar */}
            <div className={cn("absolute top-0 left-0 right-0 h-0.5 opacity-50", isHealthy ? "bg-green-500" : isWarning ? "bg-yellow-500" : "bg-red-500")} />

            <CardContent className="p-4 pt-5">
                <div className="flex items-start gap-4">
                    {/* Ring Chart - Premium Look */}
                    <div className="relative h-20 w-20 flex items-center justify-center shrink-0 mt-1">
                        <svg className="transform -rotate-90 w-20 h-20 drop-shadow-sm">
                            <defs>
                                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={startColor} />
                                    <stop offset="100%" stopColor={endColor} />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="40"
                                cy="40"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r={radius}
                                stroke={`url(#${gradientId})`}
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-2xl font-bold tracking-tighter", healthTextColor)}>{score}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className={cn("p-1 rounded-full bg-opacity-10", isHealthy ? "bg-green-500" : isWarning ? "bg-yellow-500" : "bg-red-500")}>
                                    <HealthIcon className={cn("h-3.5 w-3.5", healthTextColor)} />
                                </div>
                                <h3 className="font-semibold text-gray-900 text-sm tracking-tight">Saúde Fiscal</h3>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-gray-400 hover:text-gray-600">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Financial Rate Indicator - Compact */}
                        {financials && (
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3" /> Compromisso
                                    </span>
                                    <span className={cn("font-semibold font-mono", debtRatio > 30 ? "text-red-600" : "text-gray-700")}>
                                        {debtRatio.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-700 rounded-full", isApproachingLimit ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-blue-400 to-blue-500")}
                                        style={{ width: `${regimeProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-400">Receita Anual</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{currentRevenue.toLocaleString()} / 81k (MEI)</span>
                                </div>
                            </div>
                        )}

                        {issues.length === 0 && !financials ? (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Tudo em dia! Você não possui pendências urgentes.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {issues.slice(0, 2).map(issue => (
                                    <div key={issue.id} className="flex items-center justify-between py-1 px-2 bg-red-50/50 rounded border border-red-100/50">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <AlertTriangle className={cn("h-3 w-3 shrink-0", issue.severity === 'critical' ? "text-red-500" : "text-yellow-500")} />
                                            <span className="text-xs text-gray-700 truncate">{issue.title}</span>
                                        </div>
                                        <span className="text-[10px] font-medium text-red-600 cursor-pointer hover:underline shrink-0 ml-2">
                                            {issue.action}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
