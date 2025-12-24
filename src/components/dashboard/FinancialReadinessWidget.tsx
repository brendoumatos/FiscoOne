import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, FileCheck, Lock } from "lucide-react";

interface ReadinessProps {
    status: 'READY' | 'ATTENTION' | 'NOT_READY';
    explanation: string;
    avgRevenue: number;
    score: number;
}

export function FinancialReadinessWidget({ status, explanation, avgRevenue, score }: ReadinessProps) {
    let bgColor = 'bg-slate-50';
    let borderColor = 'border-slate-200';
    let icon = <Lock className="h-5 w-5 text-slate-400" />;

    if (status === 'READY') {
        bgColor = 'bg-emerald-50';
        borderColor = 'border-emerald-200';
        icon = <TrendingUp className="h-5 w-5 text-emerald-600" />;
    } else if (status === 'ATTENTION') {
        bgColor = 'bg-amber-50';
        borderColor = 'border-amber-200';
        icon = <AlertTriangle className="h-5 w-5 text-amber-600" />;
        // title removed
    } else {
        bgColor = 'bg-slate-100';
        borderColor = 'border-slate-200';
        // title removed
    }

    return (
        <Card className={`border ${borderColor} ${bgColor} shadow-sm`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        {icon}
                        Prontidão
                    </span>
                    {status === 'READY' && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">APROVADO</span>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        {explanation}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white/50 p-2 rounded">
                            <div className="text-slate-500">Média Mensal</div>
                            <div className="font-semibold text-slate-900">R$ {avgRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-white/50 p-2 rounded">
                            <div className="text-slate-500">Score Fiscal</div>
                            <div className="font-semibold text-slate-900">{score} / 100</div>
                        </div>
                    </div>

                    <div className="pt-2">
                        {status === 'READY' ? (
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                <FileCheck className="mr-2 h-4 w-4" /> Gerar Relatório de Prontidão
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full border-slate-300 text-slate-600" disabled>
                                <Lock className="mr-2 h-4 w-4" /> Relatório Bloqueado
                            </Button>
                        )}
                        <p className="text-[10px] text-center text-slate-400 mt-2">
                            A geração do relatório requer consentimento explícito.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
