import { useState } from "react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Partner {
    id: string;
    name: string;
    description: string;
    category: string;
    logo: string;
    rating: number;
    connected?: boolean;
}

const PARTNERS: Partner[] = [
    {
        id: '1',
        name: 'ContaAzul',
        description: 'Integração completa para gestão financeira e conciliação bancária automática.',
        category: 'ERP',
        logo: 'CA',
        rating: 4.8,
        connected: true
    },
    {
        id: '2',
        name: 'NuBank PJ',
        description: 'Sincronize seu extrato bancário em tempo real para controle de fluxo de caixa.',
        category: 'Banco',
        logo: 'NU',
        rating: 4.9,
        connected: false
    },
    {
        id: '3',
        name: 'CertiSign',
        description: 'Renovação e gestão de certificados digitais com desconto exclusivo.',
        category: 'Serviços',
        logo: 'CS',
        rating: 4.5,
        connected: false
    },
    {
        id: '4',
        name: 'Omie',
        description: 'ERP robusto para empresas em crescimento. Emissão de NFe e boleto integrado.',
        category: 'ERP',
        logo: 'OM',
        rating: 4.7,
        connected: false
    },
    {
        id: '5',
        name: 'Stone',
        description: 'Soluções de pagamento e maquininha com taxas especiais para parceiros.',
        category: 'Financeiro',
        logo: 'ST',
        rating: 4.6,
        connected: false
    },
    {
        id: '6',
        name: 'Google Workspace',
        description: 'Email profissional e ferramentas de colaboração para sua equipe.',
        category: 'Produtividade',
        logo: 'GW',
        rating: 4.9,
        connected: false
    }
];

export default function PartnerMarketplace() {
    const [partners, setPartners] = useState<Partner[]>(PARTNERS);
    const { toast } = useToast();

    const toggleConnection = (id: string) => {
        setPartners(prev => prev.map(p => {
            if (p.id === id) {
                const newState = !p.connected;
                toast({
                    title: newState ? "Integração Conectada" : "Integração Removida",
                    description: newState ? `Você conectou o ${p.name} com sucesso.` : `A conexão com ${p.name} foi encerrada.`,
                    variant: newState ? "default" : "destructive"
                });
                return { ...p, connected: newState };
            }
            return p;
        }));
    };

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Marketplace de Parceiros</h2>
                <p className="text-muted-foreground">Conecte ferramentas e serviços para potenciar sua gestão.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                    <Card key={partner.id} className="flex flex-col border-none shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl select-none">
                                    {partner.logo}
                                </div>
                                <Badge variant={partner.connected ? "default" : "outline"} className={partner.connected ? "bg-green-600 hover:bg-green-700" : ""}>
                                    {partner.category}
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <CardTitle className="text-lg">{partner.name}</CardTitle>
                                <div className="flex items-center gap-1 mt-1">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium text-gray-700">{partner.rating}</span>
                                </div>
                            </div>
                            <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-2">
                                {partner.description}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="mt-auto pt-4">
                            <Button
                                variant={partner.connected ? "outline" : "default"}
                                className={partner.connected ? "w-full border-green-200 text-green-700 hover:text-green-800 hover:bg-green-50" : "w-full"}
                                onClick={() => toggleConnection(partner.id)}
                            >
                                {partner.connected ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" /> Conectado
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" /> Conectar
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
