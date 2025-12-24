import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/types/auth";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";

import { useToast } from "@/hooks/use-toast";




export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
    const { signup, isLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signup({ name, email, password, role });
            // Navigation handled inside signup usually, but ensuring:
            navigate("/onboarding");
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Erro no cadastro",
                description: "Não foi possível criar sua conta. Tente novamente.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-[100dvh] w-full lg:grid lg:grid-cols-2 bg-white text-gray-900 overflow-x-hidden">
            {/* Left Side - Artistic/Premium */}
            <div className="hidden lg:flex relative flex-col justify-between p-12 bg-slate-900 overflow-hidden text-white">
                {/* Abstract Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-900/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/60 to-slate-950/90 z-10"></div>
                    <div className="absolute inset-0 opacity-[0.03] z-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>

                {/* Content */}
                <div className="relative z-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-8">
                        <ShieldCheck size={14} />
                        <span>Excelência Operacional</span>
                    </div>
                </div>

                <div className="relative z-20 max-w-lg">
                    <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                        Você está a um passo da <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Gestão que sempre idealizou.</span>
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        Junte-se ao seleto grupo de empresas que transformaram burocracia em inteligência competitiva.
                        O FiscoOne não é apenas software, é estratégia de crescimento.
                    </p>

                    {/* Social Proof / Visionary Detail */}
                    <div className="border-l-2 border-emerald-500/30 pl-6 py-2">
                        <blockquote className="text-slate-300 italic text-sm mb-4">
                            "A clareza financeira que ganhamos com o FiscoOne nos permitiu dobrar nossa operação em 6 meses sem aumentar a equipe administrativa."
                        </blockquote>
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-400">
                                        {['CFO', 'CEO', 'CTO'][i - 1]}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-slate-400 font-medium">+2.500 Líderes Satisfeitos</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 flex items-center gap-4 text-sm text-slate-500">
                    <img src="/logo-white.png" alt="FiscoOne Logo" className="h-6 w-auto opacity-50" />
                    <span className="h-4 w-px bg-slate-800"></span>
                    <p>&copy; 2024 FiscoOne Tecnologia</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 lg:p-12 relative overflow-y-auto">
                <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 my-auto">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <div className="mx-auto lg:mx-0 mb-6 flex items-center gap-2 lg:hidden">
                            <img src="/logo-white.png" alt="FiscoOne Logo" className="h-8 w-auto invert brightness-0" />
                            <span className="font-bold text-xl text-slate-900">FiscoOne</span>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 mb-2">
                            <img src="/logo-white.png" alt="FiscoOne Logo" className="h-8 w-auto invert brightness-0" />
                            <span className="font-bold text-xl text-slate-900">FiscoOne</span>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Criar Nova Conta</h1>
                        <p className="text-slate-500">
                            Preencha seus dados para acessar o ecossistema.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700">Nome do Decisor</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="Ex: João Silva"
                                className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700">Email Corporativo</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="seu.nome@empresa.com"
                                className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700">Senha Segura</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-slate-700">Perfil de Acesso</Label>
                            <select
                                id="role"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-slate-600"
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                            >
                                <option value={UserRole.CLIENT}>Empresário / Gestor Financeiro</option>
                                <option value={UserRole.ACCOUNTANT}>Contador / BPO Financeiro</option>
                            </select>
                        </div>

                        <Button className="w-full h-11 text-base mt-2 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all duration-300" type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <span className="flex items-center">Acessar Plataforma <ArrowRight className="ml-2 h-4 w-4" /></span>}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">Já possui acesso?</span>
                        </div>
                    </div>

                    <div className="text-center text-sm">
                        <Link to="/auth/login" className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline">
                            Fazer Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
