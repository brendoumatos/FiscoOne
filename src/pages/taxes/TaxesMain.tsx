
import { useQuery } from "@tanstack/react-query";
import { taxService } from "@/services/tax";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, CheckCircle, Clock, LayoutList, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxCalendar } from "@/components/taxes/TaxCalendar";
import { TaxListItem } from "@/components/taxes/TaxListItem";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { TaxSummary, TaxGuide } from "@/types/tax";

export default function TaxesMain() {
    const { toast } = useToast();
    const { data: summary } = useQuery<TaxSummary>({
        queryKey: ['tax-summary'],
        queryFn: taxService.getSummary
    });

    // We need the full list of guides here too, not just summary
    const { data: guides } = useQuery<TaxGuide[]>({
        queryKey: ['tax-guides'],
        queryFn: taxService.getGuides
    });

    return (
        <div className="space-y-4 pb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Impostos e Obrigações</h2>
                    <p className="text-sm text-muted-foreground">Acompanhe seus tributos e vencimentos em tempo real.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs uppercase font-bold tracking-widest">
                            Busca...
                        </span>
                        <input className="pl-16 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
                            placeholder="" />
                    </div>
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => toast({ title: "Em breve", description: "Criação manual de guia." })}>
                        <Plus className="mr-2 h-4 w-4" /> Novo
                    </Button>
                </div>
            </div>

            {/* KPI Cards (Health Status) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-yellow-400 shadow-sm bg-yellow-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-medium text-gray-600">Total a Pagar</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-gray-900">R$ {summary?.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Acúmulo do mês vigente</p>
                    </CardContent>
                </Card>
                <Card className={cn("border-l-4 shadow-sm", summary?.overdueAmount && summary?.overdueAmount > 0 ? "border-l-red-500 bg-red-50/30" : "border-l-green-500 bg-green-50/30")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-medium text-gray-600">Guias Vencidas</CardTitle>
                        <AlertCircle className={cn("h-4 w-4", summary?.overdueAmount && summary?.overdueAmount > 0 ? "text-red-500" : "text-green-500")} />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-xl font-bold", summary?.overdueAmount && summary?.overdueAmount > 0 ? "text-red-600" : "text-green-600")}>
                            {summary?.overdueAmount && summary?.overdueAmount > 0 ? `1` : `0`} {/* Mocking count based on amount presence */}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{summary?.overdueAmount && summary?.overdueAmount > 0 ? "Requer atenção imediata" : "Tudo em dia!"}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-emerald-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-medium text-gray-600">Taxa de Conformidade</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-emerald-700">94%</div>
                        <p className="text-[10px] text-emerald-600 mt-0.5">Empresa saudável</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="list" className="w-full">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <TabsList>
                        <TabsTrigger value="list"><LayoutList className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
                        <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4" /> Calendário</TabsTrigger>
                    </TabsList>
                    <Button variant="outline" className="bg-white border-emerald-500 text-emerald-700 hover:bg-emerald-50">
                        <Download className="mr-2 h-4 w-4" /> Gerar Guias do Mês
                    </Button>
                </div>

                <TabsContent value="list" className="space-y-4">
                    {/* Render Tax Items */}
                    {guides?.map((guide) => (
                        <TaxListItem
                            key={guide.id}
                            tax={guide}
                            onPay={() => toast({ title: "Pagamento", description: "Iniciando pagamento..." })}
                            onDownload={() => toast({ title: "Download", description: "Baixando guia..." })}
                        />
                    ))}
                    {!guides?.length && (
                        <div className="text-center py-10 text-muted-foreground">
                            Nenhuma guia encontrada.
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="calendar">
                    <TaxCalendar />
                </TabsContent>
            </Tabs>
        </div>
    );
}
