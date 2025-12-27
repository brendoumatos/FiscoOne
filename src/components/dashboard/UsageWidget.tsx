import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsageWidgetProps {
    current: number;
    limit: number | null;
    planName: string;
}

export function UsageWidget({ current, limit, planName }: UsageWidgetProps) {
    const isUnlimited = limit === null || limit === -1;
    const percent = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);

    return (
        <Card className="border-slate-100 shadow-sm bg-slate-50/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex justify-between">
                    <span>Meu Plano: {planName}</span>
                    <Zap className="h-3 w-3 text-amber-500" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-slate-900">
                        <span>Notas Emitidas</span>
                        <span>{current} / {isUnlimited ? '∞' : limit}</span>
                    </div>
                    {!isUnlimited && (
                        <Progress value={percent} className="h-2" />
                    )}
                    {percent >= 80 && !isUnlimited && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                            Você está consumindo todo seu limite.
                        </p>
                    )}
                    {percent >= 100 && !isUnlimited && (
                        <Button size="sm" variant="default" className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none">
                            Fazer Upgrade agora
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
