import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Mail } from "lucide-react";

export function UserProfileSettings() {
    const { user } = useAuth();
    const { toast } = useToast();

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                    <CardDescription>Gerencie suas informações pessoais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input id="name" defaultValue={user?.name} className="pl-9" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input id="email" defaultValue={user?.email} disabled className="pl-9 bg-gray-50" />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={() => toast({ title: "Perfil Atualizado", description: "Seus dados foram salvos com sucesso." })}>
                        Salvar Alterações
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Senha e Segurança</CardTitle>
                    <CardDescription>Atualize sua senha de acesso.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-pass">Senha Atual</Label>
                            <div className="relative">
                                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input id="current-pass" type="password" className="pl-9" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-pass">Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input id="new-pass" type="password" className="pl-9" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-pass">Confirmar Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input id="confirm-pass" type="password" className="pl-9" />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button variant="outline" onClick={() => toast({ title: "Senha Alterada", description: "Sua senha foi atualizada com sucesso." })}>
                        Atualizar Senha
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
