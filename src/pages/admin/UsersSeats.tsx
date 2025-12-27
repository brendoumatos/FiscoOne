import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersSeats() {
  const [seats, setSeats] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const list = await adminService.getSeats();
      setSeats(list);
    };
    load();
  }, []);

  return (
    <Card className="bg-slate-900 border-white/5 text-white">
      <CardHeader>
        <CardTitle>Usuários & Assentos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-xs uppercase">
            <tr className="border-b border-white/5">
              <th className="text-left py-2">Usuário</th>
              <th className="text-left">Empresa</th>
              <th className="text-left">Papel</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {seats.map((s) => (
              <tr key={s.id} className="border-b border-white/10">
                <td className="py-3">
                  <div className="font-semibold">{s.full_name}</div>
                  <div className="text-xs text-slate-400">{s.email}</div>
                </td>
                <td>
                  <div className="font-medium">{s.trade_name}</div>
                  <div className="text-xs text-slate-400">{s.cnpj}</div>
                </td>
                <td>{s.seat_role}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
