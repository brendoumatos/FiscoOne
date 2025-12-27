import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Impersonation() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    const list = await adminService.getImpersonationSessions();
    setSessions(list);
  };

  useEffect(() => {
    load();
  }, []);

  const start = async () => {
    if (!companyId) return;
    await adminService.startImpersonation({ companyId, userId: userId || undefined, reason });
    setCompanyId("");
    setUserId("");
    setReason("");
    load();
  };

  const stop = async (sessionId: string) => {
    await adminService.stopImpersonation(sessionId);
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-slate-900 border-white/5 text-white">
        <CardHeader>
          <CardTitle>Nova sessão de impersonação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Company ID" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
          <Input placeholder="User ID (opcional)" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Input placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button className="w-full bg-amber-500 text-slate-950" onClick={start}>
            Iniciar sessão
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-white/5 text-white lg:col-span-2">
        <CardHeader>
          <CardTitle>Sessões ativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 && <p className="text-slate-400">Nenhuma sessão ativa.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.trade_name || s.company_id}</p>
                <p className="text-xs text-slate-400">Usuário: {s.email || "qualquer"}</p>
                <p className="text-xs text-slate-500">Expira em {new Date(s.expires_at).toLocaleString()}</p>
              </div>
              <Button variant="outline" className="border-white/20" onClick={() => stop(s.id)}>
                Encerrar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
