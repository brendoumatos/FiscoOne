
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";

interface UpcomingTax {
    id: string;
    description: string;
    dueDate: string;
    amount: number;
    status: 'PENDING' | 'OVERDUE';
}

// Mock Data
const upcomingTaxes: UpcomingTax[] = [
    { id: '1', description: 'DAS - Simples Nacional', dueDate: '2024-11-20', amount: 350.00, status: 'PENDING' },
    { id: '2', description: 'ISS - Competência 10/24', dueDate: '2024-11-15', amount: 120.50, status: 'OVERDUE' },
    { id: '3', description: 'INSS Pró-labore', dueDate: '2024-11-20', amount: 280.00, status: 'PENDING' },
    { id: '4', description: 'IRPJ - Trimestral', dueDate: '2024-11-30', amount: 1500.00, status: 'PENDING' },
    { id: '5', description: 'CSLL - Trimestral', dueDate: '2024-11-30', amount: 800.00, status: 'PENDING' },
];

export function UpcomingTaxList() {
    return (
        <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Próximos Vencimentos
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-primary">Ver todos</Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <div className="h-full overflow-y-auto px-6 pb-4 space-y-3">
                    {upcomingTaxes.map((tax) => (
                        <div key={tax.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors group">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">{tax.description}</h4>
                                    {tax.status === 'OVERDUE' && (
                                        <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Atrasado</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Vence em: <span className="font-semibold text-gray-700">{new Date(tax.dueDate).toLocaleDateString('pt-BR')}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-gray-900">R$ {tax.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Pagar Agora <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
