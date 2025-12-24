
import { useQuery } from "@tanstack/react-query";
import { expenseService } from "@/services/expense";
import { type Expense } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, FileText, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ExpenseList() {
    const { toast } = useToast();
    const { data: expenses } = useQuery<Expense[]>({
        queryKey: ['expenses'],
        queryFn: expenseService.getExpenses
    });

    const totalExpenses = expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            toast({
                title: "Upload Iniciado",
                description: `Enviando ${file.name}... (Simulação)`,
            });
            // Simulate upload delay
            setTimeout(() => {
                toast({
                    title: "Sucesso",
                    description: "Comprovante anexado com sucesso.",
                });
            }, 1000);
        }
    };

    const handleExport = () => {
        if (!expenses) return;

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Data,Descrição,Categoria,Valor,Status\n"
            + expenses.map(e => `${new Date(e.date).toLocaleDateString()},${e.description},${e.category},${e.amount},${e.status}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "despesas_fiscoone.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Relatório Gerado", description: "Download iniciado." });
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gestão de Despesas</h2>
                    <p className="text-muted-foreground">Controle seus gastos e categorize notas fiscais de entrada.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar despesas..."
                            className="pl-9 w-[200px] lg:w-[300px] bg-white"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <div className="hidden md:flex relative">
                        <input
                            type="file"
                            id="upload-receipt"
                            className="hidden"
                            onChange={handleUpload}
                            accept=".pdf,.jpg,.png"
                        />
                        <Button variant="outline" onClick={() => document.getElementById('upload-receipt')?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Anexar
                        </Button>
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                    <Button variant="default" className="shadow-glow-primary" onClick={() => document.getElementById('upload-receipt')?.click()}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Despesa
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Total acumulado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">R$ {totalExpenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">
                        Neste mês
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Histórico de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Comprovante</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses?.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{new Date(expense.date).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{expense.category}</Badge>
                                    </TableCell>
                                    <TableCell>R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "h-2 w-2 rounded-full",
                                                expense.status === 'PAID' ? "bg-green-500" : "bg-yellow-500"
                                            )} />
                                            <span className="text-sm text-gray-600">
                                                {expense.status === 'PAID' ? 'Pago' : 'Pendente'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {expense.receiptUrl && (
                                            <Button variant="ghost" size="icon">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                            </Button>
                                        )}
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
