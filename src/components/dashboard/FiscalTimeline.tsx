import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type TimelineEvent } from "@/services/timeline";
import { FileText, AlertTriangle, TrendingUp, Info } from "lucide-react";

interface FiscalTimelineProps {
    events: TimelineEvent[];
}

export function FiscalTimeline({ events }: FiscalTimelineProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'INVOICE_ISSUED': return <FileText className="h-4 w-4 text-white" />;
            case 'TAX_CALCULATED': return <AlertTriangle className="h-4 w-4 text-white" />;
            case 'SCORE_CHANGED': return <TrendingUp className="h-4 w-4 text-white" />;
            default: return <Info className="h-4 w-4 text-white" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'INVOICE_ISSUED': return "bg-blue-500";
            case 'TAX_CALCULATED': return "bg-amber-500";
            case 'SCORE_CHANGED': return "bg-purple-500";
            default: return "bg-slate-500";
        }
    };

    return (
        <div className="relative border-l border-slate-200 ml-3 space-y-6">
            {events.length === 0 && (
                <div className="text-sm text-slate-500 pl-6">Nenhum evento registrado ainda.</div>
            )}
            {events.map((event) => (
                <div key={event.id} className="mb-8 ml-6 relative">
                    <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-[45px] ring-4 ring-white ${getColor(event.type)}`}>
                        {getIcon(event.type)}
                    </span>
                    <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <time className="mb-1 text-xs font-normal text-slate-400">
                            {format(new Date(event.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </time>
                        <h3 className="text-sm font-semibold text-slate-900">
                            {event.title}
                        </h3>
                        <p className="mb-2 text-sm font-normal text-slate-500">
                            {event.description}
                        </p>
                        {event.type === 'INVOICE_ISSUED' && (
                            <a href="#" className="inline-flex items-center text-xs font-medium text-blue-600 hover:underline">
                                Ver Nota Fiscal
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
