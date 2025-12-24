
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileKey, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useCertificate } from "@/contexts/CertificateContext";
import { useToast } from "@/hooks/use-toast";

export function CertificateManager() {
    const { certificate, uploadCertificate, revokeCertificate, isLoading } = useCertificate();
    const [password, setPassword] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!password) {
            toast({
                title: "Senha Obrigatória",
                description: "Digite a senha do certificado primeiro.",
                variant: "destructive"
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        try {
            await uploadCertificate(file, password);
            toast({
                title: "Sucesso",
                description: "Certificado carregado com sucesso!",
                variant: "default"
            });
            setPassword("");
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao carregar certificado.",
                variant: "destructive"
            });
        }
    };

    return (
        <Card className="border-l-4 border-l-primary/50 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8 pt-6">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileKey className="h-5 w-5 text-primary" />
                            Certificado Digital A1
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Necessário para emissão real de NFS-e (Arquivo .pfx ou .p12).
                        </CardDescription>
                    </div>
                    {certificate ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Pendente
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="-mt-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    {certificate ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Titular</Label>
                                    <p className="font-semibold text-lg text-gray-900">{certificate.name}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Vencimento</Label>
                                    <p className="font-medium text-gray-900">{new Date(certificate.expiry).toLocaleDateString()}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Emissor / Arquivo</Label>
                                    <p className="text-sm text-gray-600">{certificate.issuer} - {(certificate.file?.size || 0) / 1024} KB</p>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={revokeCertificate}>
                                    Revogar Certificado
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Hidden Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pfx,.p12"
                                onChange={handleFileChange}
                            />

                            <div className="space-y-3 max-w-sm mx-auto">
                                <div className="space-y-1">
                                    <Label>Senha do Certificado</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Digite a senha antes de selecionar o arquivo.</p>
                                </div>

                                <div className="pt-2">
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50/50 transition-colors cursor-pointer group mb-4"
                                        onClick={handleUploadClick}
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                            <Upload className="h-5 w-5 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">Clique para selecionar arquivo</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">.pfx ou .p12</p>
                                    </div>

                                    <Button className="w-full shadow-glow-primary" onClick={handleUploadClick} disabled={isLoading || !password}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                                            </>
                                        ) : (
                                            "Carregar Certificado"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
