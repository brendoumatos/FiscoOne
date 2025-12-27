import { useQuery } from "@tanstack/react-query";
import { pricingService, type PricingInsight } from "@/services/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function PricingInsightWidget() {
    const navigate = useNavigate();
    const { currentCompany } = useAuth();
    const { data: insight, isLoading } = useQuery<PricingInsight | null>({
        queryKey: ['pricing-insight', currentCompany?.id],
        queryFn: () => pricingService.getInsight(),
        enabled: !!currentCompany?.id
    });

    if (isLoading || !insight) return null;

    return (
        <Card className="bg-indigo-50 border-indigo-100 mb-6">
            <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <TrendingUp className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-indigo-900 text-sm mb-1 flex items-center gap-2">
                        Insight de Crescimento
                        <span className="text-[10px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                            {insight.confidence_score}% Confiança
                        </span>
                    </h4>
                    <p className="text-sm text-indigo-700 mb-3">
                        {insight.reason_pt_br} <br />
                        Com base no seu crescimento recente, um plano superior pode oferecer mais previsibilidade.
                    </p>
                    <div className="flex gap-2">
                        <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-xs h-8" onClick={() => navigate('/settings')}>
                            Ver opções de plano
                        </Button>
                        <Button size="sm" variant="ghost" className="text-indigo-600 hover:bg-indigo-100 text-xs h-8">
                            Agora não
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
