import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Building, Users, CreditCard, Bell, Code, Plus, Trash2, Copy, FileKey, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/services/team";
import { developerService } from "@/services/developer";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CertificateManager } from "@/components/settings/CertificateManager";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, User } from "lucide-react";
import { UserProfileSettings } from "@/components/settings/UserProfileSettings";
import { PlanShield } from "@/components/common/PlanShield";
import { usePlanState } from "@/contexts/PlanStateContext";

export default function Settings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [inviteEmail, setInviteEmail] = useState("");
    const [isEditingFiscal, setIsEditingFiscal] = useState(false);

    const { data: planState, usage, limits, status, cta, isLoading: isPlanLoading } = usePlanState();

    // Team Queries
    const { data: members } = useQuery({
        queryKey: ['team-members'],
        queryFn: teamService.getMembers
    });

    const inviteMutation = useMutation({
        mutationFn: (email: string) => teamService.inviteMember(email, 'MEMBER'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            toast({ title: "Convite Enviado", description: `Enviamos um email para ${inviteEmail}` });
            setInviteEmail("");
        }
    });

    // Developer Queries
    const { data: apiKeys } = useQuery({
        queryKey: ['api-keys'],
        queryFn: developerService.getKeys
    });

    const generateKeyMutation = useMutation({
        mutationFn: () => developerService.generateKey("Nova Chave " + new Date().toLocaleDateString()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast({ title: "Chave Gerada", description: "Sua nova chave de API está pronta." });
        }
    });

    const invoicesUsed = usage?.invoices.used ?? planState?.usage.invoices.used ?? 0;
    const invoicesLimit = limits?.invoices ?? planState?.usage.invoices.limit ?? null;
    const seatsUsed = usage?.seats.used ?? planState?.usage.seats.used ?? 0;
    const seatsLimit = limits?.seats ?? planState?.usage.seats.limit ?? null;
    const accountantsUsed = usage?.accountants?.used ?? planState?.usage.accountants?.used ?? 0;
    const accountantsLimit = limits?.accountants ?? planState?.usage.accountants?.limit ?? null;

    const invoicePercent = invoicesLimit ? Math.min(100, (invoicesUsed / invoicesLimit) * 100) : 0;
    const seatPercent = seatsLimit ? Math.min(100, (seatsUsed / seatsLimit) * 100) : 0;
    const accountantsPercent = accountantsLimit ? Math.min(100, (accountantsUsed / accountantsLimit) * 100) : 0;
    const seatBlocked = seatsLimit ? seatsUsed >= seatsLimit : false;

    const statusMeta: Record<string, { label: string; className: string }> = {
        ACTIVE: { label: "Ativo", className: "bg-emerald-100 text-emerald-700" },
        WARNING: { label: "Atenção", className: "bg-amber-100 text-amber-700" },
        GRACE: { label: "Pagamento pendente", className: "bg-orange-100 text-orange-700" },
        BLOCKED: { label: "Bloqueado", className: "bg-red-100 text-red-700" },
        EXPIRED: { label: "Expirado", className: "bg-gray-100 text-gray-600" }
    };

    const CTA_LABEL: Record<string, string> = {
        UPGRADE: "Fazer upgrade",
        BUY_CREDITS: "Comprar créditos",
        CONTACT_SUPPORT: "Falar com suporte"
    };

    const CTA_ROUTE: Record<string, string> = {
        UPGRADE: "/dashboard/settings/billing",
        BUY_CREDITS: "/dashboard/settings/billing",
        CONTACT_SUPPORT: "/dashboard/settings/support"
    };

    const activeStatus = (status || planState?.status || 'ACTIVE').toUpperCase();
    const isBlocked = activeStatus === 'BLOCKED' || activeStatus === 'EXPIRED';
    const nearInvoices = invoicesLimit ? invoicesUsed / invoicesLimit >= 0.8 && invoicesUsed < invoicesLimit : false;
    const nearSeats = seatsLimit ? seatsUsed / seatsLimit >= 0.8 && seatsUsed < seatsLimit : false;
    const nearAccountants = accountantsLimit ? accountantsUsed / accountantsLimit >= 0.8 && accountantsUsed < accountantsLimit : false;
    const statusBadge = statusMeta[activeStatus] || statusMeta.ACTIVE;
    const ctaValue = cta || 'UPGRADE';
    const renewalLabel = planState?.expiration ? `Renova em ${new Date(planState.expiration).toLocaleDateString()}` : "Renovação automática";

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Configurações</h2>
                    <p className="text-muted-foreground">Gerencie sua empresa, time e integrações.</p>
                </div>
                <div className="min-w-[260px]">
                    <PlanShield />
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
                    <TabsTrigger value="user" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><User className="mr-2 h-4 w-4" /> Meu Perfil</TabsTrigger>
                    <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><Building className="mr-2 h-4 w-4" /> Empresa</TabsTrigger>
                    <TabsTrigger value="certificate" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><FileKey className="mr-2 h-4 w-4" /> Certificado</TabsTrigger>
                    <TabsTrigger value="fiscal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><FileSpreadsheet className="mr-2 h-4 w-4" /> Fiscal</TabsTrigger>
                    <TabsTrigger value="team" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><Users className="mr-2 h-4 w-4" /> Time</TabsTrigger>
                    <TabsTrigger value="developer" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><Code className="mr-2 h-4 w-4" /> Desenvolvedor</TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><Bell className="mr-2 h-4 w-4" /> Notificações</TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><CreditCard className="mr-2 h-4 w-4" /> Cobrança</TabsTrigger>
                    <TabsTrigger value="appearance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><Moon className="mr-2 h-4 w-4" /> Aparência</TabsTrigger>
                </TabsList>

                <TabsContent value="user" className="space-y-4">
                    <UserProfileSettings />
                </TabsContent>

                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Cadastrais</CardTitle>
                            <CardDescription>Informações visíveis nas suas notas fiscais.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Razão Social</Label>
                                    <Input defaultValue="Tech Solutions Ltda" />
                                </div>
                                <div className="space-y-1">
                                    <Label>CNPJ</Label>
                                    <Input defaultValue="12.345.678/0001-90" disabled className="bg-gray-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Email Corporativo</Label>
                                    <Input defaultValue="contato@techsolutions.com.br" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Telefone</Label>
                                    <Input defaultValue="(11) 99999-9999" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Salvar Alterações</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="certificate" className="space-y-4">
                    <CertificateManager />
                </TabsContent>

                <TabsContent value="fiscal" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <CardTitle>Perfil Fiscal</CardTitle>
                                    <CardDescription>Resumo das configurações fiscais auditáveis.</CardDescription>
                                </div>
                                <Badge variant="outline" className="text-slate-700">{isBlocked ? "Somente leitura" : "Em edição"}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1">
                                    <Label>Regime Tributário</Label>
                                    <Input defaultValue="Simples Nacional" disabled={!isEditingFiscal || isBlocked} className={!isEditingFiscal || isBlocked ? "bg-gray-50" : ""} />
                                </div>
                                <div className="space-y-1">
                                    <Label>CNAE Principal</Label>
                                    <Input defaultValue="6201-5/01 - Desenvolvimento de software" disabled={!isEditingFiscal || isBlocked} className={!isEditingFiscal || isBlocked ? "bg-gray-50" : ""} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Inscrição Estadual</Label>
                                    <Input defaultValue="Isento" disabled={!isEditingFiscal || isBlocked} className={!isEditingFiscal || isBlocked ? "bg-gray-50" : ""} />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label>Inscrição Municipal</Label>
                                    <Input defaultValue="45123678" disabled={!isEditingFiscal || isBlocked} className={!isEditingFiscal || isBlocked ? "bg-gray-50" : ""} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Ambiente</Label>
                                    <Input defaultValue="Produção" disabled className="bg-gray-50" />
                                </div>
                            </div>

                            {isBlocked && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    <ShieldAlert className="h-4 w-4 mt-0.5" />
                                    <span>Plano bloqueado: alterações fiscais ficam em modo somente leitura.</span>
                                </div>
                            )}

                            {!isBlocked && (
                                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                                    <span>Alterações são registradas na auditoria e podem gerar fechamento de período fiscal.</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <span>Última revisão: {new Date().toLocaleString()}</span>
                                <span>Responsável: Financeiro</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditingFiscal((prev) => !prev)} disabled={isBlocked}>
                                {isEditingFiscal ? "Cancelar" : "Editar"}
                            </Button>
                            <Button disabled={isBlocked || !isEditingFiscal}>Salvar alterações</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Gestão de Time</CardTitle>
                                    <CardDescription>Gerencie quem tem acesso à sua conta.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1 max-w-sm">
                                    <Label>Convidar por Email</Label>
                                    <Input
                                        placeholder="colega@empresa.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    {seatBlocked && (
                                        <p className="text-xs text-amber-700">Limite de assentos atingido. Faça upgrade para adicionar mais membros.</p>
                                    )}
                                </div>
                                <Button onClick={() => inviteMutation.mutate(inviteEmail)} disabled={!inviteEmail || inviteMutation.isPending || seatBlocked}>
                                    <Plus className="mr-2 h-4 w-4" /> Convidar
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Membro</TableHead>
                                        <TableHead>Função</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members?.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="flex items-center gap-3 font-medium">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div>{member.name}</div>
                                                    <div className="text-xs text-muted-foreground">{member.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{member.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {member.status === 'ACTIVE' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Ativo</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Pendente</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {member.role !== 'ADMIN' && (
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="developer" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Chaves de API</CardTitle>
                                    <CardDescription>Gerencie suas chaves para integração via API.</CardDescription>
                                </div>
                                <Button onClick={() => generateKeyMutation.mutate()} disabled={generateKeyMutation.isPending}>
                                    <Plus className="mr-2 h-4 w-4" /> Nova Chave
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Prefixo</TableHead>
                                        <TableHead>Criado em</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys?.map((key) => (
                                        <TableRow key={key.id}>
                                            <TableCell className="font-medium">{key.name}</TableCell>
                                            <TableCell className="font-mono text-xs bg-gray-50 p-1 rounded w-fit">{key.prefix}...</TableCell>
                                            <TableCell className="text-gray-500">{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => toast({ title: "Copiado", description: "Chave copiada para área de transferência." })}>
                                                        <Copy className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 prose prose-blue">
                                <h4 className="font-semibold mb-2">Documentação da API</h4>
                                <p>Acesse nossa documentação completa para aprender como integrar o FiscoOne ao seu sistema.</p>
                                <a
                                    href="https://docs.fiscoone.com.br/api"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold hover:underline"
                                >
                                    Ver Documentação &rarr;
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferências de Alerta</CardTitle>
                            <CardDescription>Escolha como você quer ser notificado.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="n-email" className="flex flex-col space-y-1">
                                    <span>Notificações por Email</span>
                                    <span className="font-normal text-xs text-muted-foreground">Receba resumos semanais e alertas de impostos.</span>
                                </Label>
                                <Switch id="n-email" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="n-push" className="flex flex-col space-y-1">
                                    <span>Notificações Push</span>
                                    <span className="font-normal text-xs text-muted-foreground">Alertas em tempo real no dashboard.</span>
                                </Label>
                                <Switch id="n-push" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="n-whatsapp" className="flex flex-col space-y-1">
                                    <span>Alertas via WhatsApp</span>
                                    <span className="font-normal text-xs text-muted-foreground">Avisos críticos de vencimento.</span>
                                </Label>
                                <Switch id="n-whatsapp" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            {planState?.planCode || planState?.plan.name || 'Plano'}
                                            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                                        </CardTitle>
                                        <CardDescription>{isPlanLoading ? 'Carregando...' : renewalLabel}</CardDescription>
                                    </div>
                                    {planState?.plan.code && (
                                        <span className="text-xs text-muted-foreground">{planState.plan.code}</span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid gap-3 md:grid-cols-3">
                                    <UsageMiniCard
                                        label="Notas"
                                        used={invoicesUsed}
                                        limit={invoicesLimit}
                                        percent={invoicePercent}
                                        tone="emerald"
                                        warn={nearInvoices}
                                        blocked={isBlocked && invoicesLimit !== null && invoicesUsed >= invoicesLimit}
                                    />
                                    <UsageMiniCard
                                        label="Assentos"
                                        used={seatsUsed}
                                        limit={seatsLimit}
                                        percent={seatPercent}
                                        tone="blue"
                                        warn={nearSeats}
                                        blocked={seatBlocked}
                                    />
                                    <UsageMiniCard
                                        label="Contadores"
                                        used={accountantsUsed}
                                        limit={accountantsLimit}
                                        percent={accountantsPercent}
                                        tone="amber"
                                        warn={nearAccountants}
                                        blocked={accountantsLimit ? accountantsUsed >= accountantsLimit : false}
                                    />
                                </div>

                                {planState?.reason && (
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                                        <span>{planState.reason}</span>
                                    </div>
                                )}

                                {isBlocked && (
                                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                        <ShieldAlert className="h-4 w-4 mt-0.5" />
                                        <span>Plano bloqueado: emissões e ações críticas podem estar restritas até regularizar.</span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => {
                                            const target = CTA_ROUTE[ctaValue] || '/dashboard/settings/billing';
                                            window.location.href = target;
                                        }}
                                    >
                                        {CTA_LABEL[ctaValue] || 'Gerenciar assinatura'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const target = CTA_ROUTE[ctaValue] || '/dashboard/settings/billing';
                                            window.location.href = target;
                                        }}
                                    >
                                        Reforçar escudo
                                    </Button>
                                    <Button variant="ghost" className="text-sm" onClick={() => window.location.href = '/dashboard/reports'}>
                                        Ver faturas
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle>Pagamento e ciclo</CardTitle>
                                <CardDescription>Forma de pagamento e auditoria do ciclo.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <CreditCard className="h-4 w-4 text-slate-500" />
                                        <span>•••• 4242</span>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/settings/billing'}>Trocar cartão</Button>
                                </div>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Renova automaticamente</div>
                                    <div className="flex items-center gap-2 text-slate-700"><ShieldCheck className="h-4 w-4" /> Plano: {planState?.plan.name || '—'}</div>
                                    <div className="flex items-center gap-2 text-slate-700"><AlertTriangle className="h-4 w-4 text-amber-500" /> Status: {statusBadge.label}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle>Recursos do plano</CardTitle>
                            <CardDescription>O que está incluído hoje.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-sm">
                            {[
                                "Emissão de NFSe com pré-flight",
                                "Escudo de plano com bloqueio automático",
                                "Colaboradores com perfis granulares",
                                "Integração API e webhooks",
                                "Alertas e notificações multicanal",
                                "Suporte prioritário em planos avançados"
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>


                <TabsContent value="appearance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aparência</CardTitle>
                            <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                                    <span>Modo Escuro</span>
                                    <span className="font-normal text-xs text-muted-foreground">Alternar entre temas claro e escuro.</span>
                                </Label>
                                <ThemeToggle />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs >
        </div >
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Switch
            id="dark-mode"
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        />
    )
}

function UsageMiniCard({ label, used, limit, percent, tone, warn, blocked }: {
    label: string;
    used: number;
    limit: number | null;
    percent: number;
    tone: "emerald" | "blue" | "amber";
    warn?: boolean;
    blocked?: boolean;
}) {
    const toneMap = {
        emerald: "bg-emerald-500",
        blue: "bg-blue-500",
        amber: "bg-amber-500"
    } as const;
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{label}</span>
                <span className="font-semibold text-slate-800">{limit === null ? `${used} / ilimitado` : `${used} / ${limit}`}</span>
            </div>
            {limit !== null && (
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`${toneMap[tone]} h-full transition-all`} style={{ width: `${percent}%` }} />
                </div>
            )}
            {blocked && <p className="mt-1 text-[11px] text-red-700">Limite atingido</p>}
            {!blocked && warn && <p className="mt-1 text-[11px] text-amber-700">Próximo ao limite</p>}
        </div>
    );
}
