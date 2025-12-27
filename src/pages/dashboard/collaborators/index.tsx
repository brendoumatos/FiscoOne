import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/services/team";
import { useToast } from "@/hooks/use-toast";
import { usePlanState } from "@/contexts/PlanStateContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScreenState } from "@/components/common/ScreenState";
import { parseApiError } from "@/lib/apiError";
import { AlertTriangle, UserCheck, UserPlus, Trash2 } from "lucide-react";

export default function CollaboratorsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [inviteEmail, setInviteEmail] = useState("");

    const { data: planState, usage, limits, status } = usePlanState();
    const seatsUsed = usage?.seats.used ?? planState?.usage.seats.used ?? 0;
    const seatsLimit = limits?.seats ?? planState?.usage.seats.limit ?? null;
    const seatsPercent = seatsLimit ? Math.min(100, (seatsUsed / seatsLimit) * 100) : 0;
    const planStatus = (status || planState?.status || "ACTIVE").toUpperCase();
    const isBlocked = planStatus === "BLOCKED" || planStatus === "EXPIRED";
    const seatBlocked = seatsLimit ? seatsUsed >= seatsLimit : false;
    const nearSeatLimit = seatsLimit ? seatsUsed / seatsLimit >= 0.8 : false;

    const { data: members, isLoading, isError, error } = useQuery({
        queryKey: ["team-members"],
        queryFn: teamService.getMembers
    });

    const apiError = parseApiError(error);
    const tenantViolation = apiError.code === "TENANT_VIOLATION";
    const backendError = isError && !tenantViolation;
    const firstUse = (seatsUsed === 0) && !isLoading && (members?.length ?? 0) === 0;

    const inviteMutation = useMutation({
        mutationFn: (email: string) => teamService.inviteMember(email, "MEMBER"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            toast({ title: "Convite enviado", description: `Enviamos um email para ${inviteEmail}` });
            setInviteEmail("");
        },
        onError: () => {
            toast({ title: "Convite não enviado", description: "Verifique o status do plano ou tente novamente.", variant: "destructive" });
        }
    });

    const removeMutation = useMutation({
        mutationFn: (memberId: string) => teamService.removeMember(memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            toast({ title: "Removido", description: "Colaborador removido do acesso." });
        },
        onError: () => toast({ title: "Ação bloqueada", description: "Não foi possível remover agora.", variant: "destructive" })
    });

    const stateLabel = useMemo(() => {
        if (isBlocked) return "Bloqueado";
        if (seatBlocked) return "Limite atingido";
        if (nearSeatLimit) return "Atenção";
        return "Ok";
    }, [isBlocked, seatBlocked, nearSeatLimit]);

    if (tenantViolation) {
        return (
            <div className="space-y-4 pb-20 animate-in fade-in duration-500">
                <ScreenState
                    state="tenant"
                    description={apiError.message || "Contexto de empresa inválido para o time."}
                    action={{ label: "Refazer login", to: "/auth/login" }}
                    secondaryAction={{ label: "Tentar novamente", onClick: () => queryClient.invalidateQueries({ queryKey: ["team-members"] }), variant: "outline" }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Colaboradores e Assentos</h1>
                    <p className="text-slate-500 mt-1">Convide o time e controle o consumo de assentos.</p>
                </div>
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700">{stateLabel}</Badge>
            </div>

            {(isBlocked || seatBlocked || nearSeatLimit) && (
                <ScreenState
                    state={isBlocked ? "blocked" : "near-limit"}
                    inline
                    description={isBlocked ? "Plano bloqueado: convites e remoções desativados." : seatBlocked ? "Limite de assentos atingido. Faça upgrade para convidar." : "Uso de assentos acima de 80%. Considere upgrade."}
                    action={{ label: "Billing & Plans", to: "/settings/billing", variant: "outline" }}
                    secondaryAction={!isBlocked ? { label: "Gerenciar assentos", to: "/settings/billing" } : undefined}
                />
            )}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <CardTitle>Gestão de acesso</CardTitle>
                                <CardDescription>Controle granular de quem pode operar a conta.</CardDescription>
                            </div>
                            {(isBlocked || seatBlocked) && (
                                <Badge className="bg-amber-100 text-amber-800" variant="secondary">
                                    <AlertTriangle className="h-4 w-4 mr-1" /> Ação restrita
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2 items-end flex-wrap">
                            <div className="flex-1 space-y-1 min-w-[260px]">
                                <Label>Convidar por email</Label>
                                <Input
                                    placeholder="colega@empresa.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    disabled={isBlocked || seatBlocked}
                                />
                                {seatBlocked && (
                                    <p className="text-xs text-amber-700">Limite de assentos atingido. Faça upgrade para liberar convites.</p>
                                )}
                            </div>
                            <Button
                                onClick={() => inviteMutation.mutate(inviteEmail)}
                                disabled={!inviteEmail || inviteMutation.isPending || isBlocked || seatBlocked}
                            >
                                <UserPlus className="mr-2 h-4 w-4" /> Convidar
                            </Button>
                        </div>

                        {backendError && (
                            <ScreenState
                                state="error"
                                inline
                                description={apiError.message || "Não foi possível carregar os colaboradores agora."}
                                action={{ label: "Tentar novamente", onClick: () => queryClient.invalidateQueries({ queryKey: ["team-members"] }), variant: "outline" }}
                            />
                        )}

                        {isLoading ? (
                            <div className="text-sm text-slate-500">Carregando time...</div>
                        ) : members && members.length === 0 ? (
                            <ScreenState
                                state={firstUse ? "first-use" : "empty"}
                                inline
                                title={firstUse ? "Convide o primeiro colaborador" : "Nenhum colaborador listado"}
                                description={firstUse ? "Envie o primeiro convite para liberar o fluxo de time." : "Use o campo acima para convidar novos membros."}
                                action={{ label: "Convidar por email", onClick: () => inviteMutation.mutate(inviteEmail), disabled: !inviteEmail || inviteMutation.isPending || isBlocked || seatBlocked }}
                                secondaryAction={{ label: "Abrir Billing", to: "/settings/billing", variant: "outline" }}
                            />
                        ) : (
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
                                            <TableCell><Badge variant="outline">{member.role}</Badge></TableCell>
                                            <TableCell>
                                                {member.status === "ACTIVE" ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Ativo</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Pendente</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {member.role !== "ADMIN" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        disabled={isBlocked}
                                                        onClick={() => removeMutation.mutate(member.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        <p className="text-[11px] text-slate-500">Auditável: {user?.email} – {new Date().toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle>Uso de assentos</CardTitle>
                        <CardDescription>Limite e projeção do plano.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>Assentos utilizados</span>
                            <span className="font-semibold">{seatsLimit === null ? `${seatsUsed} / ilimitado` : `${seatsUsed} / ${seatsLimit}`}</span>
                        </div>
                        {seatsLimit !== null && (
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${seatsPercent}%` }} />
                            </div>
                        )}
                        {planStatus === "GRACE" && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                                <span>Plano em carência: convites podem ser limitados até regularização.</span>
                            </div>
                        )}
                        {isBlocked && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                <ShieldAlert className="h-4 w-4 mt-0.5" />
                                <span>Plano bloqueado: convites e remoções desativados.</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <UserCheck className="h-4 w-4" />
                            Acesso monitorado — alterações aparecem na Linha do Tempo Fiscal.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
