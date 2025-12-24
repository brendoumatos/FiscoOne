import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Credit } from "@/services/referral";
import { CheckCircle } from "lucide-react";

interface Props {
    credits: Credit[];
}

export function CreditWallet({ credits }: Props) {
    if (credits.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-slate-500">Nenhum crédito ativo no momento.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {credits.map(credit => (
                <Card key={credit.id} className="border-slate-200">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                {credit.credit_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">
                                {new Date(credit.valid_until).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-slate-900">{credit.remaining_value}</span>
                            <span className="text-sm text-slate-500">restantes</span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            Fonte: {credit.source}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
