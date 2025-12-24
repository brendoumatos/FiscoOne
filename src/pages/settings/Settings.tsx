import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Building, Users, CreditCard, Bell, Code, Plus, Trash2, Copy, FileKey } from "lucide-react";
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

export default function Settings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [inviteEmail, setInviteEmail] = useState("");

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

    // Usage Mock
    const usage = {
        invoices: 120,
        invoicesLimit: 500,
        users: members?.length || 1,
        usersLimit: 3
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Configurações</h2>
                <p className="text-muted-foreground">Gerencie sua empresa, time e integrações.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
                    <TabsTrigger value="user" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><User className="mr-2 h-4 w-4" /> Meu Perfil</TabsTrigger>
                    <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><Building className="mr-2 h-4 w-4" /> Empresa</TabsTrigger>
                    <TabsTrigger value="certificate" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"><FileKey className="mr-2 h-4 w-4" /> Certificado</TabsTrigger>
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
                                </div>
                                <Button onClick={() => inviteMutation.mutate(inviteEmail)} disabled={!inviteEmail || inviteMutation.isPending}>
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
                    <Card className="border-l-4 border-l-primary shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Plano Profissional</CardTitle>
                                    <CardDescription>Renova em 12/12/2026</CardDescription>
                                </div>
                                <Badge className="bg-primary text-white hover:bg-primary">Ativo</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-700">Notas Emitidas (Mês)</span>
                                    <span className="text-gray-500">{usage.invoices} / {usage.invoicesLimit}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${(usage.invoices / usage.invoicesLimit) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-700">Usuários do Time</span>
                                    <span className="text-gray-500">{usage.users} / {usage.usersLimit}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${(usage.users / usage.usersLimit) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">•••• 4242</span>
                                </div>
                                <Button variant="outline" size="sm">Gerenciar Assinatura</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center pt-4">
                        <p className="text-sm text-muted-foreground mb-4">Precisa de mais recursos?</p>
                        <Button variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg text-white">
                            Fazer Upgrade para Business
                        </Button>
                    </div>
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
