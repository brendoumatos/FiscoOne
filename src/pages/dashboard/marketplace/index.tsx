import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplace";
import type { Service } from "@/services/marketplace";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScreenState } from "@/components/common/ScreenState";
import { Briefcase, Plus, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlanState } from "@/contexts/PlanStateContext";
import { parseApiError } from "@/lib/apiError";

export default function Marketplace() {
    const { currentCompany } = useAuth();
    const { toast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const { data: planState, status, cta, usage, limits } = usePlanState();
    const planStatus = (status || planState?.status || 'ACTIVE').toUpperCase();
    const isBlocked = planStatus === 'BLOCKED' || planStatus === 'EXPIRED';
    const invoicesUsed = usage?.invoices.used ?? planState?.usage.invoices.used ?? 0;
    const invoicesLimit = limits?.invoices ?? planState?.usage.invoices.limit ?? null;
    const nearLimit = invoicesLimit ? invoicesUsed / invoicesLimit >= 0.8 : false;

    // Fetch Services
    const { data: services, isLoading, isError, error, refetch } = useQuery<Service[]>({
        queryKey: ['marketplace-services', selectedCategory],
        queryFn: () => marketplaceService.listServices(selectedCategory)
    });

    const apiError = parseApiError(error);
    const tenantViolation = apiError.code === 'TENANT_VIOLATION';
    const backendError = isError && !tenantViolation;

    // Check my profile
    const { data: myProfile } = useQuery({
        queryKey: ['my-provider-profile', currentCompany?.id],
        queryFn: () => currentCompany ? marketplaceService.getMyProfile() : null,
        enabled: !!currentCompany
    });

    const categories = [
        { id: 'ACCOUNTING', label: 'Contabilidade' },
        { id: 'LEGAL', label: 'Jurídico' },
        { id: 'TECH', label: 'Tecnologia' },
        { id: 'MARKETING', label: 'Marketing' },
        { id: 'FINANCE', label: 'Financeiro' },
    ];

    const emptyState = useMemo(() => !isLoading && services?.length === 0, [isLoading, services]);
    const firstUse = emptyState && invoicesUsed === 0;
    const warningCopy = planStatus === 'GRACE' ? 'Plano em carência: instalações podem ser limitadas.' : undefined;

    if (tenantViolation) {
        return (
            <div className="space-y-4 pb-20">
                <ScreenState
                    state="tenant"
                    description={apiError.message || "Contexto de empresa inválido para o marketplace."}
                    action={{ label: "Refazer login", to: "/auth/login" }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Área de Parceiros</h1>
                    <p className="text-slate-500 mt-1">Conecte-se com especialistas ou ofereça seus serviços.</p>
                </div>
                {myProfile?.verified && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3 mr-1" /> Parceiro Verificado
                    </Badge>
                )}
            </div>

            {(isBlocked || nearLimit) && (
                <ScreenState
                    state={isBlocked ? 'blocked' : 'near-limit'}
                    inline
                    description={isBlocked ? 'Plano bloqueado: instale ou ofereça apps após regularizar.' : 'Consumo acima de 80%. Instalações podem ser bloqueadas se exceder.'}
                    action={{ label: 'Billing & Plans', to: '/settings/billing', variant: 'outline' }}
                    secondaryAction={!isBlocked ? { label: 'Reforçar escudo', to: '/settings/billing' } : undefined}
                />
            )}

            <Tabs defaultValue="hire" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="hire">Contratar Serviços</TabsTrigger>
                    <TabsTrigger value="offer" disabled={isBlocked}>Oferecer Serviços</TabsTrigger>
                </TabsList>

                {/* TAB: HIRE */}
                <TabsContent value="hire" className="space-y-6 mt-6">
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <Button
                            variant={!selectedCategory ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(undefined)}
                        >
                            Todos
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>

                    {/* Grid */}
                    {backendError && (
                        <ScreenState
                            state="error"
                            inline
                            description={apiError.message || "Não foi possível carregar o marketplace agora."}
                            action={{ label: "Recarregar", onClick: () => void refetch(), variant: "outline" }}
                        />
                    )}

                    {warningCopy && (
                        <ScreenState
                            state="near-limit"
                            inline
                            description={warningCopy}
                        />
                    )}

                    {isBlocked ? (
                        <ScreenState
                            state="blocked"
                            description={cta === 'UPGRADE' ? 'Plano bloqueado: faça upgrade no billing.' : 'Plano bloqueado: regularize para instalar ou oferecer serviços.'}
                            action={{ label: 'Ir para Billing', to: '/settings/billing' }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                <p>Carregando serviços...</p>
                            ) : services?.map(service => (
                                <Card key={service.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline">{service.category}</Badge>
                                        </div>
                                        <CardTitle className="mt-2 text-lg">{service.title}</CardTitle>
                                        <CardDescription>por {service.provider_name}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-600 line-clamp-3">
                                            {service.description}
                                        </p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            onClick={() => toast({ title: "Pedido enviado", description: "O parceiro receberá seu contato." })}
                                        >
                                            Entrar em Contato
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                            {emptyState && (
                                <ScreenState
                                    state={firstUse ? 'first-use' : 'empty'}
                                    className="col-span-full"
                                    title={firstUse ? 'Nenhuma instalação ainda' : 'Nenhum serviço encontrado'}
                                    description={firstUse ? 'Instale o primeiro app ou filtre por outra categoria.' : 'Tente outra categoria ou refine a busca.'}
                                    action={{ label: 'Ver todos', onClick: () => setSelectedCategory(undefined), variant: 'outline' }}
                                />
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* TAB: OFFER */}
                <TabsContent value="offer">
                    <Card>
                        <CardHeader>
                            <CardTitle>Torne-se um Parceiro</CardTitle>
                            <CardDescription>
                                Empresas com alto Score de Confiança podem oferecer serviços na plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!myProfile ? (
                                <div className="text-center py-8">
                                    <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900">Cadastre seu Perfil</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                        Preencha suas informações e especialidades para começar a receber leads qualificados.
                                    </p>
                                    <Button onClick={() => { /* Open Modal Implementation */ }}>
                                        Criar Perfil de Parceiro
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-900">Meus Serviços Ativos</h4>
                                            <p className="text-sm text-slate-500">Gerencie seus anúncios no marketplace.</p>
                                        </div>
                                        <Button size="sm">
                                            <Plus className="w-4 h-4 mr-2" /> Novo Serviço
                                        </Button>
                                    </div>
                                    {/* List my services here */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
