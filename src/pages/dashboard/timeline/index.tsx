import { useQuery } from "@tanstack/react-query";
import { timelineService } from "@/services/timeline";
import { useAuth } from "@/contexts/AuthContext";
import { FiscalTimeline } from "@/components/dashboard/FiscalTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function TimelinePage() {
    const { currentCompany } = useAuth();

    const { data: events, isLoading } = useQuery({
        queryKey: ['fiscal-timeline', currentCompany?.id],
        queryFn: () => currentCompany ? timelineService.getTimeline(currentCompany.id) : [],
        enabled: !!currentCompany
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Linha do Tempo Fiscal</h1>
                    <p className="text-slate-500 mt-1">Histórico completo de eventos e auditoria.</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Exportar PDF
                </Button>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="px-0">
                    {isLoading ? (
                        <div>Carregando histórico...</div>
                    ) : (
                        <FiscalTimeline events={events || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
