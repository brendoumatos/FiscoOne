import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface FiscalScoreBadgeProps {
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    explanation: Array<{ factor: string; deduction: number }>;
}

export function FiscalScoreBadge({ score, riskLevel, explanation }: FiscalScoreBadgeProps) {
    let colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
    let Icon = ShieldCheck;

    if (riskLevel === 'MEDIUM') {
        colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
        Icon = ShieldAlert;
    } else if (riskLevel === 'HIGH') {
        colorClass = "bg-red-100 text-red-800 border-red-200";
        Icon = ShieldX;
    }

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div className={`cursor-help flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClass} transition-all hover:scale-105`}>
                    <Icon className="h-4 w-4" />
                    <span className="font-bold text-sm">{score} / 100</span>
                    <span className="text-xs uppercase tracking-wide opacity-80 hidden sm:inline-block">
                        Risk: {riskLevel}
                    </span>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 shadow-xl border-slate-100">
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        <Info className="h-4 w-4 text-slate-500" />
                        Análise de Confiança Fiscal
                    </h4>

                    <div className="text-xs text-slate-600">
                        {explanation.length === 0 ? (
                            <p className="text-emerald-600 font-medium">✨ Nenhum fator negativo encontrado. Sua empresa está com excelente saúde fiscal!</p>
                        ) : (
                            <ul className="space-y-2">
                                {explanation.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                        <span>{item.factor}</span>
                                        <span className="text-red-500 font-bold">-{item.deduction}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="pt-2 border-t text-[10px] text-slate-400">
                        Calculado com base em: Pagamentos DAS, Limite MEI, Emissão de NFs.
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
