
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { QrCode, Barcode, Copy } from "lucide-react";
import { paymentService } from "@/services/payment";
import { PaymentMethod, type PaymentTransaction } from "@/types/payment";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
    invoiceId: string;
    amount: number;
    trigger?: React.ReactNode;
}

export function PaymentModal({ invoiceId, amount, trigger }: PaymentModalProps) {
    const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async (method: PaymentMethod) => {
        setLoading(true);
        try {
            const data = await paymentService.generatePayment(invoiceId, amount, method);
            setTransaction(data);
        } catch (error) {
            toast({
                title: "Erro ao gerar pagamento",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: "Código copiado para a área de transferência." });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Receber</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cobrar Fatura</DialogTitle>
                    <DialogDescription>
                        Selecione o método de pagamento para gerar a cobrança.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="pix" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pix">PIX</TabsTrigger>
                        <TabsTrigger value="boleto">Boleto</TabsTrigger>
                    </TabsList>

                    <div className="py-4">
                        <div className="flex justify-between text-sm mb-4">
                            <span className="text-gray-500">Valor a cobrar:</span>
                            <span className="font-bold">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <TabsContent value="pix" className="space-y-4">
                            {!transaction || transaction.method !== PaymentMethod.PIX ? (
                                <div className="text-center py-6">
                                    <QrCode className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <Button onClick={() => handleGenerate(PaymentMethod.PIX)} disabled={loading} className="w-full">
                                        {loading ? "Gerando..." : "Gerar QR Code PIX"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                    <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
                                        {/* Placeholder QR Code Image */}
                                        <div className="h-48 w-48 bg-white p-2 rounded shadow-sm">
                                            <img src={transaction.pixQrCodeUrl} alt="QR Code Pix" className="w-full h-full object-contain opacity-80" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input value={transaction.pixCode} readOnly className="text-xs font-mono bg-gray-50" />
                                        <Button size="icon" variant="outline" onClick={() => copyToClipboard(transaction.pixCode || '')}>
                                            <Copy size={14} />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-gray-500">O código expira em 24 horas.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="boleto">
                            {!transaction || transaction.method !== PaymentMethod.BOLETO ? (
                                <div className="text-center py-6">
                                    <Barcode className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <Button onClick={() => handleGenerate(PaymentMethod.BOLETO)} disabled={loading} className="w-full">
                                        {loading ? "Gerando..." : "Gerar Boleto Bancário"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                    <div className="p-4 border rounded-lg bg-gray-50 text-center">
                                        <Barcode className="h-16 w-full text-gray-800" />
                                        <p className="text-xs font-mono mt-2 break-all">{transaction.boletoBarcode}</p>
                                    </div>
                                    <Button className="w-full" variant="outline" onClick={() => copyToClipboard(transaction.boletoBarcode || '')}>
                                        <Copy className="mr-2 h-4 w-4" /> Copiar Código de Barras
                                    </Button>
                                    <Button className="w-full" variant="secondary">
                                        Baixar PDF
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
