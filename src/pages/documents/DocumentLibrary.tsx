
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DocumentItem {
    id: string;
    name: string;
    description: string;
    status: 'MISSING' | 'PENDING' | 'APPROVED';
    lastUpdate?: string;
}

const REQUIRED_DOCS: DocumentItem[] = [
    { id: '1', name: 'Contrato Social', description: 'Última alteração consolidada', status: 'APPROVED', lastUpdate: '2024-01-15' },
    { id: '2', name: 'Cartão CNPJ', description: 'Emitido recentemente', status: 'APPROVED', lastUpdate: '2024-01-15' },
    { id: '3', name: 'Alvará de Funcionamento', description: 'Vigente para o ano atual', status: 'MISSING' },
    { id: '4', name: 'Comprovante de Endereço', description: 'Conta de luz ou água (max 3 meses)', status: 'PENDING', lastUpdate: '2024-05-20' },
];

export default function DocumentLibrary() {
    const { toast } = useToast();
    const [docs, setDocs] = useState<DocumentItem[]>(REQUIRED_DOCS);

    const handleUpload = (id: string) => {
        // Simulate upload
        toast({
            title: "Upload realizado",
            description: "Arquivo enviado para análise da contabilidade."
        });

        setDocs(prev => prev.map(doc =>
            doc.id === id ? { ...doc, status: 'PENDING' as const, lastUpdate: new Date().toISOString().split('T')[0] } : doc
        ));
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Documentos da Empresa</h2>
                <p className="text-muted-foreground">Mantenha a documentação da sua empresa em dia e evite pendências fiscais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                    <Card key={doc.id} className={cn(
                        "transition-all hover:shadow-md border-l-4",
                        doc.status === 'APPROVED' ? "border-l-emerald-500" :
                            doc.status === 'MISSING' ? "border-l-red-500" : "border-l-yellow-500"
                    )}>
                        <CardHeader className="pb-1">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-sm font-semibold text-gray-800">{doc.name}</CardTitle>
                                {doc.status === 'APPROVED' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                {doc.status === 'MISSING' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                {doc.status === 'PENDING' && <Clock className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <CardDescription className="text-[10px]">{doc.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant={
                                        doc.status === 'APPROVED' ? "default" :
                                            doc.status === 'MISSING' ? "destructive" : "secondary"
                                    } className={cn(
                                        "h-5 text-[10px] px-1.5",
                                        doc.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                            doc.status === 'PENDING' ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" : ""
                                    )}>
                                        {doc.status === 'APPROVED' ? 'Aprovado' :
                                            doc.status === 'MISSING' ? 'Pendente' : 'Em Análise'}
                                    </Badge>
                                    {doc.lastUpdate && (
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(doc.lastUpdate).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-1">
                                    {doc.status === 'APPROVED' ? (
                                        <Button variant="outline" size="sm" className="w-full text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 h-8 text-xs">
                                            <FileText className="mr-2 h-3 w-3" /> Visualizar
                                        </Button>
                                    ) : (
                                        <Button className="w-full h-8 text-xs" size="sm" onClick={() => handleUpload(doc.id)} variant={doc.status === 'MISSING' ? 'default' : 'outline'}>
                                            <Upload className="mr-2 h-3 w-3" />
                                            {doc.status === 'MISSING' ? 'Enviar' : 'Reenviar'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
