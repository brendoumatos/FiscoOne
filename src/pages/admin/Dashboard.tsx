import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const overview = await adminService.getOverview();
        setData(overview);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <Skeleton className="h-32 w-full bg-white/5" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-white/5 text-white">
          <CardHeader>
            <CardTitle>Empresas ativas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{data?.companies ?? 0}</CardContent>
        </Card>
        <Card className="bg-slate-900 border-white/5 text-white col-span-2">
          <CardHeader>
            <CardTitle>Assinaturas por plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {data?.subscriptionsByPlan?.map((row: any) => (
                <div key={row.plan_id} className="p-3 rounded-lg bg-white/5">
                  <p className="text-slate-400">{row.plan_id || "Sem plano"}</p>
                  <p className="text-lg font-semibold">{row.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-100">
        <p className="font-semibold">Sessão privilegiada</p>
        <p className="text-sm text-amber-200/80">Todas as alterações são aplicadas imediatamente: planos, status de empresas, impersonação e logs.</p>
      </div>
    </div>
  );
}
