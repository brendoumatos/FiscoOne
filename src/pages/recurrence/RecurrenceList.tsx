
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurrenceService } from "@/services/recurrence";
import { RecurrenceStatus, RecurrenceFrequency } from "@/types/recurrence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, Calendar, Mail } from "lucide-react";
import { NewRecurrenceDialog } from "@/components/recurrence/NewRecurrenceDialog";

export default function RecurrenceList() {
    const queryClient = useQueryClient();

    const { data: recurrences, isLoading } = useQuery({
        queryKey: ['recurrences'],
        queryFn: recurrenceService.getRecurrences
    });

    const toggleMutation = useMutation({
        mutationFn: recurrenceService.toggleStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        }
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Emissão Recorrente</h2>
                    <p className="text-muted-foreground">Automatize a cobrança de seus clientes mensais.</p>
                </div>
                <NewRecurrenceDialog />
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100 rounded-t-xl">
                    <CardTitle>Assinaturas Ativas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead>Cliente</TableHead>
                                <TableHead>Frequência</TableHead>
                                <TableHead>Próxima Execução</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Envio Automático</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">Carregando...</TableCell>
                                </TableRow>
                            ) : recurrences?.map((item) => (
                                <TableRow key={item.id} className="hover:bg-gray-50/50">
                                    <TableCell>
                                        <div className="font-medium">{item.borrowerName}</div>
                                        <div className="text-xs text-muted-foreground">{item.serviceDescription}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                            {item.frequency === RecurrenceFrequency.MONTHLY && "Mensal"}
                                            {item.frequency === RecurrenceFrequency.WEEKLY && "Semanal"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            {new Date(item.nextRunDate).toLocaleDateString('pt-BR')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        {item.autoSendEmail ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600">
                                                <Mail size={12} /> Sim
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                Não
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                            item.status === RecurrenceStatus.ACTIVE ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                        )}>
                                            {item.status === RecurrenceStatus.ACTIVE ? "Ativo" : "Pausado"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => toggleMutation.mutate(item.id)}
                                            className={cn("h-8 w-8 p-0", item.status === RecurrenceStatus.ACTIVE ? "text-yellow-600" : "text-green-600")}
                                        >
                                            {item.status === RecurrenceStatus.ACTIVE ? <Pause size={16} /> : <Play size={16} />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
