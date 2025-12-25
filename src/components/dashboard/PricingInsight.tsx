import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pricingService } from "@/services/pricing";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, TrendingUp } from "lucide-react";

export function PricingInsight() {
    const { data } = useQuery({
        queryKey: ['pricing-insight'],
        queryFn: () => pricingService.getInsight()
    });

    if (!data) return null;

    return (
        <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-sm text-amber-700">Sugestão de plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-amber-900">
                <div className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> {data.reason_pt_br}
                </div>
                <p className="text-xs text-amber-700">Recomendado: {data.recommended_plan_code} (confiança {data.confidence_score}%)</p>
            </CardContent>
        </Card>
    );
}
