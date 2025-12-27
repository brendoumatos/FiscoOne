import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import api from "@/services/api";
import { usePlanState } from "@/contexts/PlanStateContext";

export function AnnualUpsell() {
    const { refresh } = usePlanState();

    const handleUpgrade = async () => {
        if (confirm("Deseja simular o upgrade para o plano PRO ANUAL e ganhar os benefícios?")) {
            try {
                await api.post('/subscriptions/upgrade', { planCode: 'PRO', cycle: 'ANNUAL' });
                alert("Plano Atualizado! Créditos adicionados à sua carteira.");
                await refresh();
            } catch (e) {
                alert("Erro ao atualizar plano.");
            }
        }
    };

    return (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="h-32 w-32" />
            </div>

            <CardContent className="p-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                            <Zap className="h-3 w-3" />
                            Plano Anual — Benefícios Estendidos
                        </div>
                        <h3 className="text-xl font-bold">Mais previsibilidade, menos interrupções fiscais.</h3>
                        <p className="text-slate-300 text-sm max-w-lg">
                            No plano anual, você recebe o <span className="text-white font-bold">dobro de benefícios operacionais</span>. Garanta estabilidade para sua operação.
                        </p>

                        <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-slate-300">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> +20 Notas Extras
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-300">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Prioridade
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleUpgrade} className="bg-white text-slate-900 hover:bg-slate-100 font-semibold whitespace-nowrap shadow-lg">
                        Mudar para Anual
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
