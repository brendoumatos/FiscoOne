
import { useQuery } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoice";
import { InvoiceStatus, type Invoice } from "@/types/invoice";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Download, Search, Filter, DollarSign, FileText, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PaymentModal } from "@/components/payments/PaymentModal";

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
    const styles = {
        [InvoiceStatus.ISSUED]: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        [InvoiceStatus.PROCESSING]: "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse",
        [InvoiceStatus.DRAFT]: "bg-slate-100 text-slate-600 border border-slate-200",
        [InvoiceStatus.CANCELLED]: "bg-red-50 text-red-700 border border-red-200",
        [InvoiceStatus.ERROR]: "bg-red-100 text-red-800 border border-red-200",
    };

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase transition-colors inline-flex items-center gap-1.5", styles[status])}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === InvoiceStatus.ISSUED ? "bg-emerald-500" :
                status === InvoiceStatus.PROCESSING ? "bg-blue-500" :
                    status === InvoiceStatus.DRAFT ? "bg-slate-400" : "bg-red-500"
                }`} />
            {status === InvoiceStatus.ISSUED && "Autorizada"}
            {status === InvoiceStatus.PROCESSING && "Processando"}
            {status === InvoiceStatus.DRAFT && "Rascunho"}
            {status === InvoiceStatus.CANCELLED && "Cancelada"}
            {status === InvoiceStatus.ERROR && "Falha"}
        </span>
    );
};

import { useAuth } from "@/contexts/AuthContext";

export default function InvoiceList() {
    const { currentCompany } = useAuth();

    const { data: invoices, isLoading } = useQuery<Invoice[]>({
        queryKey: ['invoices', currentCompany?.id],
        queryFn: () => {
            if (!currentCompany) return Promise.resolve([]);
            return invoiceService.getInvoices(currentCompany.id);
        },
        enabled: !!currentCompany
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header with Comfort Spacing */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notas Fiscais</h1>
                    <p className="text-slate-500 mt-1">Gerencie, emita e acompanhe todas as suas notas fiscais.</p>
                </div>
                <Link to="/dashboard/invoices/issue">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 px-6 rounded-lg transition-all hover:scale-105 active:scale-95">
                        <Plus className="mr-2 h-4 w-4" /> Emitir Nova Nota
                    </Button>
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                        placeholder="Buscar por cliente, CNPJ ou número..."
                        className="pl-10 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl shadow-sm transition-all"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg">
                        <Filter className="h-4 w-4 mr-2" /> Filtros
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg">
                        <Download className="h-4 w-4 mr-2" /> Exportar
                    </Button>
                </div>
            </div>

            {/* Premium Table Card */}
            <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="py-4 pl-6 font-semibold text-xs text-slate-500 uppercase tracking-wider">Número</TableHead>
                                <TableHead className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Tomador / Cliente</TableHead>
                                <TableHead className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Valor Total</TableHead>
                                <TableHead className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</TableHead>
                                <TableHead className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Emissão</TableHead>
                                <TableHead className="text-right pr-6 font-semibold text-xs text-slate-500 uppercase tracking-wider">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : invoices?.map((invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-slate-50/50 transition-colors border-slate-50 group cursor-pointer">
                                    <TableCell className="pl-6 font-mono text-xs font-medium text-slate-500 group-hover:text-emerald-600 transition-colors">
                                        #{invoice.number?.toString().padStart(6, '0') || '---'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{invoice.borrower.name}</span>
                                            <span className="text-xs text-slate-400">{invoice.borrower.document || 'CPF/CNPJ não informado'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">
                                        R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={invoice.status} />
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(invoice.issueDate).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {invoice.status === InvoiceStatus.ISSUED && (
                                                <PaymentModal
                                                    invoiceId={invoice.id}
                                                    amount={invoice.amount}
                                                    trigger={
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                            <DollarSign className="mr-1 h-3 w-3" /> Cobrar
                                                        </Button>
                                                    }
                                                />
                                            )}
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {invoices && invoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 rounded-full bg-slate-50">
                                                <FileText className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-900">Nenhuma nota encontrada</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto">
                                                Parece que você ainda não emitiu nenhuma nota fiscal. Comece agora mesmo para ver sua operação decolar.
                                            </p>
                                            <Link to="/dashboard/invoices/new" className="mt-4">
                                                <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                                    Emitir Primeira Nota
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
