
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { BrandEmblem } from "@/components/common/BrandEmblem";



export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, loginAsDemo, isLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await login({ email, password });
            navigate("/dashboard");
        } catch (err) {
            setError("Credenciais inválidas. Tente novamente.");
        }
    };

    return (
        <div className="min-h-[100dvh] w-full lg:grid lg:grid-cols-2 bg-white text-gray-900 overflow-x-hidden">
            {/* Left Side - Artistic/Premium */}
            <div className="hidden lg:flex relative flex-col justify-between p-12 bg-slate-900 overflow-hidden text-white">
                {/* Abstract Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/60 to-slate-950/90 z-10"></div>

                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] z-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>

                {/* Content */}
                <div className="relative z-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-8">
                        <ShieldCheck size={14} />
                        <span>Ambiente Seguro</span>
                    </div>
                </div>

                <div className="relative z-20 max-w-lg">
                    <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
                        Gestão Fiscal <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Inteligente & Premium</span>
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Controle total da sua operação financeira com a elegância e precisão que sua empresa merece.
                    </p>
                </div>

                <div className="relative z-20 flex items-center gap-4 text-sm text-slate-500">
                    <BrandEmblem className="opacity-50" />
                    <span className="h-4 w-px bg-slate-800"></span>
                    <p>&copy; 2024 FiscoOne Technologies</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 lg:p-12 relative overflow-y-auto">
                <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 my-auto">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <div className="lg:hidden mx-auto mb-4">
                            <BrandEmblem className="text-slate-900" />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bem-vindo</h1>
                        <p className="text-slate-500">
                            Insira suas credenciais para acessar o painel.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-medium">Email Corporativo</Label>
                            <Input
                                id="email"
                                placeholder="nome@empresa.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700 font-medium">Senha</Label>
                                <button
                                    type="button"
                                    onClick={() => toast({ title: "Recuperação", description: "Verifique seu email." })}
                                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-300"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in">
                                {error}
                            </div>
                        )}

                        <Button className="w-full h-11 text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300" type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <span className="flex items-center">Acessar Painel <ArrowRight className="ml-2 h-4 w-4" /></span>}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">Ou continue com</span>
                        </div>
                    </div>

                    <div className="text-center text-sm">
                        Não tem uma conta convidada?{" "}
                        <Link to="/auth/signup" className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline">
                            Solicitar Acesso
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <Button
                            variant="outline"
                            className="w-full h-10 text-sm border-dashed border-slate-300 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                            onClick={async () => {
                                await loginAsDemo('CLIENT');
                                navigate("/dashboard");
                            }}
                            type="button"
                        >
                            🔐 Acessar Modo Demonstração (Sem Banco)
                        </Button>
                    </div>
                </div>

                {/* Demo Credentials Hint */}
                <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 hover:text-slate-500 transition-colors cursor-help group">
                    <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 p-3 bg-white border border-slate-100 shadow-xl rounded-lg w-64 text-slate-600 text-xs text-left">
                        <p className="font-semibold text-slate-900 mb-1">Demo Access:</p>
                        <p>Client: client@demo.com / demo123</p>
                        <p>Acct: accountant@demo.com / demo123</p>
                    </div>
                    <span>Demo Info</span>
                </div>
            </div>
        </div>
    );
}
