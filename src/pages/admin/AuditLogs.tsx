import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await adminService.getAuditLogs();
      setLogs(data);
    };
    load();
  }, []);

  return (
    <Card className="bg-slate-900 border-white/5 text-white">
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{log.scope}</span>
              <span>{new Date(log.created_at).toLocaleString()}</span>
            </div>
            <p className="font-semibold">{log.action}</p>
            <pre className="text-xs text-amber-100 bg-black/30 rounded-lg p-2 overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
