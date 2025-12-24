import { useQuery } from "@tanstack/react-query";
import { referralService } from "@/services/referral";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Users, Gift, TrendingUp } from "lucide-react";
import { CreditWallet } from "@/components/referral/CreditWallet";

export default function ReferralDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['referral-dashboard'],
        queryFn: referralService.getDashboard
    });

    const copyLink = () => {
        if (data?.referralLink) {
            navigator.clipboard.writeText(data.referralLink);
            alert("Link copiado!");
        }
    };

    const getStat = (status: string) => {
        const stat = data?.stats.find(s => s.status === status);
        return stat ? parseInt(stat.count) : 0;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Programa de Parceria</h1>
                <p className="text-slate-500 mt-1">Convide outras empresas e cresça junto com a FiscoOne.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Invite Card */}
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardHeader>
                        <CardTitle className="text-indigo-900 flex items-center gap-2">
                            <Gift className="h-5 w-5 text-indigo-600" />
                            Seu Link de Convite
                        </CardTitle>
                        <CardDescription>
                            Compartilhe este link. Você ganha <strong className="text-indigo-700">10 Notas Extras</strong> quando seu indicado assinar um plano PRO.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <code className="flex-1 p-3 bg-white border border-indigo-200 rounded-lg text-sm font-mono text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">
                                {isLoading ? "Carregando..." : data?.referralLink}
                            </code>
                            <Button onClick={copyLink} variant="outline" className="border-indigo-200 hover:bg-indigo-50">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-slate-900">{getStat('PENDING')}</div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Users className="h-3 w-3" /> Convites Pendentes
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-emerald-600">{getStat('REWARDED')}</div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Recompensas
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Wallet Section */}
            <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Sua Carteira de Créditos</h2>
                <CreditWallet credits={data?.credits || []} />
            </div>
        </div>
    );
}
