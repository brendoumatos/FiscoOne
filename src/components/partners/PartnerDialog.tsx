import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Phone, Mail, Globe, CheckCircle } from "lucide-react";
import type { Partner } from "@/types/partner";

// Using native div for separator
function SimpleSeparator() { return <div className="h-[1px] w-full bg-gray-200 my-4" /> }

interface PartnerDialogProps {
    partner: Partner;
    trigger: React.ReactNode;
}

export function PartnerDialog({ partner, trigger }: PartnerDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-[500px] overflow-y-auto max-h-[90vh]">
                <DialogHeader className="pb-4">
                    <DialogTitle>Perfil do Parceiro</DialogTitle>
                    <DialogDescription>Detalhes completos e contatos.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center text-center space-y-3 mb-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.id}`} />
                        <AvatarFallback>{partner.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{partner.name}</h3>
                        <p className="text-sm text-gray-500">{partner.category}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-yellow-700">{partner.rating}</span>
                        <span className="text-xs text-yellow-600">({partner.reviewsCount} avaliações)</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" /> Sobre
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Especialista com mais de 10 anos de mercado, focado em ajudar pequenas e médias empresas a otimizarem seus processos fiscais e tributários.
                            Oferece atendimento personalizado e suporte 24/7 para assinantes do plano Premium do FiscoOne.
                        </p>
                    </div>

                    <SimpleSeparator />

                    <div className="space-y-3">
                        <h4 className="font-semibold mb-2">Contato & Localização</h4>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>Av. Paulista, 1000 - São Paulo, SP</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>(11) 3003-0000</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>contato@{partner.name.toLowerCase().replace(/\s/g, '').replace(/\./g, '')}.com.br</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span>www.{partner.name.toLowerCase().replace(/\s/g, '').replace(/\./g, '')}.com.br</span>
                        </div>
                    </div>

                    <SimpleSeparator />

                    <div>
                        <h4 className="font-semibold mb-3">Serviços Oferecidos</h4>
                        <div className="flex flex-wrap gap-2">
                            {["Consultoria Tributária", "Abertura de Empresa", "BPO Financeiro", "Auditoria Fiscal"].map(tag => (
                                <Badge key={tag} variant="secondary" className="font-normal">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button className="w-full h-11 text-base">
                            Solicitar Orçamento
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-2">
                            Resposta média em 2 horas úteis.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
