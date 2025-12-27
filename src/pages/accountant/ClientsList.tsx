
import { useQuery } from "@tanstack/react-query";
import { accountantService } from "@/services/accountant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ClientsList() {
    const { toast } = useToast();
    type Client = {
        id: string;
        name: string;
        cnpj: string;
        ownerName: string;
        taxRegime: string;
        status: string;
        pendingIssues: number;
    };

    const { data: clients = [], isLoading } = useQuery<Client[]>({
        queryKey: ['accountant-clients'],
        queryFn: () => accountantService.getClients()
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Meus Clientes</h2>
                    <p className="text-muted-foreground">Gerencie as empresas vinculadas ao seu escritório.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input placeholder="Buscar empresa..." className="pl-9" />
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100 rounded-t-xl">
                    <CardTitle>Carteira de Clientes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead>Empresa</TableHead>
                                <TableHead>Regime</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Pendências</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell>
                                </TableRow>
                            ) : clients.map((client) => (
                                <TableRow key={client.id} className="hover:bg-gray-50/50">
                                    <TableCell>
                                        <div className="font-medium">{client.name}</div>
                                        <div className="text-xs text-muted-foreground">{client.cnpj} • {client.ownerName}</div>
                                    </TableCell>
                                    <TableCell>{client.taxRegime}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                            client.status === 'ACTIVE' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                        )}>
                                            {client.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {client.pendingIssues > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                {client.pendingIssues} pendências
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Regular</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => toast({ title: "Acesso em breve", description: "Funcionalidade de acesso ao cliente." })}>Acessar</Button>
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
