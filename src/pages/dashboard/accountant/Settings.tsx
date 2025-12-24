import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountantService, type BrandingSettings } from "@/services/accountant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Upload, Save, Globe } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountantSettings() {
    const { currentCompany } = useAuth();
    // const { toast } = useToast();
    const queryClient = useQueryClient();

    // Mocking retrieving the accountant ID related to this user/company
    // In a real scenario, we'd have a separate context or role check.
    // For MVP, we assume the currentCompany IS the accountant firm.
    const accountantId = currentCompany?.id;

    const { data: branding } = useQuery({
        queryKey: ['branding-settings', accountantId],
        queryFn: () => accountantId ? accountantService.getPublicBranding('mock-domain') : null, // ideally fetch by ID
        enabled: !!accountantId
    });

    const { register, handleSubmit, setValue, watch } = useForm<BrandingSettings>({
        defaultValues: {
            primary_color: '#10B981',
            secondary_color: '#0F172A',
            company_name_display: '',
            logo_url: ''
        }
    });

    useEffect(() => {
        if (branding) {
            setValue('primary_color', branding.primary_color);
            setValue('secondary_color', branding.secondary_color);
            setValue('company_name_display', branding.company_name_display);
            setValue('logo_url', branding.logo_url);
        }
    }, [branding, setValue]);

    const mutation = useMutation({
        mutationFn: (data: BrandingSettings) => accountantService.updateBranding({ ...data, accountantId }),
        onSuccess: () => {
            // toast({ title: "Configurações salvas", description: "O branding foi atualizado com sucesso." });
            queryClient.invalidateQueries({ queryKey: ['branding-settings'] });
        },
        onError: () => {
            // toast({ title: "Erro", description: "Falha ao salvar configurações.", variant: "destructive" });
        }
    });

    const onSubmit = (data: BrandingSettings) => {
        if (accountantId) {
            mutation.mutate(data);
        }
    };

    // Live Preview State
    const primaryColor = watch('primary_color');
    const secondaryColor = watch('secondary_color');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações White-Label</h1>
                <p className="text-slate-500 mt-1">Personalize a aparência do sistema para seus clientes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" /> Identidade Visual
                        </CardTitle>
                        <CardDescription>Defina as cores e logo exibidos no portal do cliente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_name_display">Nome de Exibição</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input id="company_name_display" className="pl-9" placeholder="Ex: Contabilidade Silva" {...register('company_name_display')} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primary_color">Cor Primária</Label>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-10 rounded border shadow-sm" style={{ backgroundColor: primaryColor }}></div>
                                        <Input id="primary_color" {...register('primary_color')} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondary_color">Cor Secundária</Label>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-10 rounded border shadow-sm" style={{ backgroundColor: secondaryColor }}></div>
                                        <Input id="secondary_color" {...register('secondary_color')} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="logo_url">URL do Logo</Label>
                                <div className="relative">
                                    <Upload className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input id="logo_url" className="pl-9" placeholder="https://..." {...register('logo_url')} />
                                </div>
                                <p className="text-[10px] text-slate-500">Recomendado: PNG transparente, 200x50px.</p>
                            </div>

                            <Button type="submit" className="w-full" disabled={mutation.isPending}>
                                <Save className="w-4 h-4 mr-2" />
                                {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Preview Box */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-900">Pré-visualização</h3>
                    <div className="border rounded-xl shadow-lg overflow-hidden bg-slate-50">
                        {/* Mock Login Page Header */}
                        <div className="h-16 flex items-center justify-between px-6 bg-white border-b">
                            <div className="font-bold text-xl" style={{ color: primaryColor }}>
                                {watch('logo_url') ? (
                                    <img src={watch('logo_url')} alt="Logo" className="h-8 object-contain" />
                                ) : (
                                    watch('company_name_display') || "Sua Marca"
                                )}
                            </div>
                            <div className="text-sm font-medium opacity-70">Entrar</div>
                        </div>

                        {/* Mock Content */}
                        <div className="p-8 space-y-4 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-full max-w-xs space-y-4 p-6 bg-white rounded-lg shadow-sm border">
                                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse"></div>
                                <div className="h-10 w-full rounded" style={{ backgroundColor: primaryColor, opacity: 0.1 }}></div>
                                <div className="h-10 w-full rounded text-white flex items-center justify-center font-medium shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                                    Botão Personalizado
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Powered by FiscoOne</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
