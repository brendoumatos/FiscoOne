import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const list = await adminService.getCompanies();
      setCompanies(list);
      setLoading(false);
    };
    load();
  }, []);

  const handleStatus = async (companyId: string, status: string) => {
    await adminService.updateCompanyStatus(companyId, status);
    setCompanies((prev) => prev.map((c) => (c.id === companyId ? { ...c, subscription_status: status } : c)));
  };

  if (loading) return <div className="text-slate-300">Carregando...</div>;

  return (
    <Card className="bg-slate-900 border-white/5 text-white">
      <CardHeader>
        <CardTitle>Empresas</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-xs uppercase">
            <tr className="border-b border-white/5">
              <th className="text-left py-2">Empresa</th>
              <th className="text-left">Plano</th>
              <th className="text-left">Status</th>
              <th className="text-left">Assentos</th>
              <th className="text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-white/10">
                <td className="py-3">
                  <div className="font-semibold">{c.trade_name}</div>
                  <div className="text-slate-400 text-xs">{c.cnpj}</div>
                </td>
                <td>{c.plan_name || "-"}</td>
                <td>
                  <span className="px-2 py-1 rounded-full text-xs bg-white/10">{c.subscription_status || "SEM"}</span>
                </td>
                <td>{c.seats}</td>
                <td>
                  <Select defaultValue={c.subscription_status || "ACTIVE"} onValueChange={(v) => handleStatus(c.id, v)}>
                    <SelectTrigger className="w-32 bg-white/5 border-white/10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="PAUSED">Pausado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
