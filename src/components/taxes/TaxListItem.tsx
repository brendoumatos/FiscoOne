
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaxGuide } from "@/types/tax"; // Import type correctly based on lint feedback

interface TaxListItemProps {
    tax: TaxGuide;
    onPay: (id: string) => void;
    onDownload: (id: string) => void;
}

export function TaxListItem({ tax, onPay, onDownload }: TaxListItemProps) {
    // Helper to get friendly name
    const getTaxName = (type: string) => {
        const types: Record<string, string> = {
            'DAS': 'DAS - Simples Nacional',
            'GPS': 'INSS - Previdência',
            'ISS': 'ISS - Serviços',
            'DARF_IR': 'DARF - IRPJ',
            'DARF_CSLL': 'DARF - CSLL'
        };
        return types[type] || type;
    };

    // Helper to get color classes
    const getTaxColor = (type: string) => {
        if (type === 'DAS') return "border-emerald-500 text-emerald-700 bg-emerald-50";
        if (type === 'ISS') return "border-blue-500 text-blue-700 bg-blue-50";
        if (type === 'GPS') return "border-cyan-500 text-cyan-700 bg-cyan-50";
        return "border-gray-500 text-gray-700 bg-gray-50";
    };

    const taxName = getTaxName(tax.type);
    const taxColor = getTaxColor(tax.type);
    // Extract border color for left border
    const borderColorClass = taxColor.split(' ')[0];
    // Extract bg color for badge/icon
    const badgeColorClass = taxColor.replace('border-', 'bg-').replace('text-', '');

    const isOverdue = tax.status === 'OVERDUE';
    const isPaid = tax.status === 'PAID';

    // Calculate days overdue
    const daysOverdue = isOverdue ? Math.floor((new Date().getTime() - new Date(tax.dueDate).getTime()) / (1000 * 3600 * 24)) : 0;

    return (
        <div className={cn(
            "flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md",
            "border-l-4",
            borderColorClass
        )}>
            {/* Left: Icon/Badge & Info */}
            <div className="flex items-start gap-4 mb-4 md:mb-0">
                <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner",
                    badgeColorClass
                )}>
                    {tax.type.substring(0, 3)}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900">{taxName} - {tax.period}</h4>
                    <p className="text-sm text-gray-500">{tax.description || "Imposto mensal recorrente"}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>Vencimento: {new Date(tax.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>

            {/* Right: Amount & Actions */}
            <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                <div className="flex items-center justify-between md:justify-end gap-3 w-full">
                    <span className="text-lg font-bold text-gray-900">
                        R$ {tax.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Badge variant={isPaid ? "default" : isOverdue ? "destructive" : "secondary"} className={cn(
                        "font-normal",
                        isPaid ? "bg-green-100 text-green-700 hover:bg-green-100" :
                            !isOverdue ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" : ""
                    )}>
                        {isPaid && <CheckCircle className="w-3 h-3 mr-1" />}
                        {isOverdue && <AlertCircle className="w-3 h-3 mr-1" />}
                        {!isPaid && !isOverdue && <Clock className="w-3 h-3 mr-1" />}
                        {isPaid ? "Pago" : isOverdue ? "Vencido" : "Pendente"}
                    </Badge>
                </div>

                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <Button variant="outline" size="sm" onClick={() => onDownload(tax.id)} className="flex-1 md:flex-none">
                        <Download className="h-4 w-4 mr-2" /> Baixar
                    </Button>

                    {isOverdue ? (
                        <Button variant="destructive" size="sm" onClick={() => onPay(tax.id)} className="flex-1 md:flex-none">
                            <AlertCircle className="h-4 w-4 mr-2" /> Regularizar (+Multa)
                        </Button>
                    ) : !isPaid ? (
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 md:flex-none" size="sm" onClick={() => onPay(tax.id)}>
                            <CreditCard className="h-4 w-4 mr-2" /> Pagar
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" disabled className="flex-1 md:flex-none text-green-600 opacity-100">
                            Recibo Disponível
                        </Button>
                    )}
                </div>

                {isOverdue && (
                    <span className="text-[10px] text-red-500 font-medium self-end flex items-center bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3 mr-1" /> Vencido há {Math.max(1, daysOverdue)} dias
                    </span>
                )}
            </div>
        </div>
    );
}
