import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketplaceService, type Service } from "@/services/marketplace";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, CheckCircle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

export default function Marketplace() {
    const { currentCompany } = useAuth();
    // const { toast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

    // Fetch Services
    const { data: services, isLoading } = useQuery<Service[]>({
        queryKey: ['marketplace-services', selectedCategory],
        queryFn: () => marketplaceService.listServices(selectedCategory)
    });

    // Check my profile
    const { data: myProfile } = useQuery({
        queryKey: ['my-provider-profile', currentCompany?.id],
        queryFn: () => currentCompany ? marketplaceService.getMyProfile(currentCompany.id) : null,
        enabled: !!currentCompany
    });

    const categories = [
        { id: 'ACCOUNTING', label: 'Contabilidade' },
        { id: 'LEGAL', label: 'Jurídico' },
        { id: 'TECH', label: 'Tecnologia' },
        { id: 'MARKETING', label: 'Marketing' },
        { id: 'FINANCE', label: 'Financeiro' },
    ];

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

            <Tabs defaultValue="hire" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="hire">Contratar Serviços</TabsTrigger>
                    <TabsTrigger value="offer">Oferecer Serviços</TabsTrigger>
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
                                    <Button className="w-full">Entrar em Contato</Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {services?.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                Nenhum serviço encontrado nesta categoria.
                            </div>
                        )}
                    </div>
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
