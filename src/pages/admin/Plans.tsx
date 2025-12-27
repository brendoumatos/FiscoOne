import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultPlan = {
  code: "",
  name: "",
  price_monthly: 0,
  invoice_limit: -1,
  seat_limit: -1,
  features: [] as string[],
};

export default function Plans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(defaultPlan);

  const load = async () => {
    const list = await adminService.getPlans();
    setPlans(list);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    const payload = { ...form, features: form.features.filter(Boolean) };
    await adminService.savePlan(payload);
    setEditing(null);
    setForm(defaultPlan);
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-slate-900 border-white/5 text-white lg:col-span-2">
        <CardHeader>
          <CardTitle>Planos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-slate-400">{p.code}</p>
                <p className="text-sm text-slate-200">R$ {p.price_monthly ?? "-"} / mês</p>
                <p className="text-xs text-amber-200">{(p.features || []).join(", ")}</p>
              </div>
              <Button variant="outline" className="border-white/20" onClick={() => { setEditing(p.id); setForm({ ...p, features: p.features || [] }); }}>
                Editar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-white/5 text-white">
        <CardHeader>
          <CardTitle>{editing ? "Editar plano" : "Novo plano"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={Boolean(editing)} />
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input type="number" placeholder="Preço mensal" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} />
          <Input type="number" placeholder="Limite de NF" value={form.invoice_limit} onChange={(e) => setForm({ ...form, invoice_limit: Number(e.target.value) })} />
          <Input type="number" placeholder="Limite de assentos" value={form.seat_limit} onChange={(e) => setForm({ ...form, seat_limit: Number(e.target.value) })} />
          <Input
            placeholder="Features separadas por vírgula"
            value={(form.features || []).join(",")}
            onChange={(e) => setForm({ ...form, features: e.target.value.split(",").map((f) => f.trim()) })}
          />
          <Button className="w-full bg-amber-500 text-slate-950" onClick={handleSave}>
            Salvar
          </Button>
          {editing && (
            <Button variant="outline" className="w-full border-white/20" onClick={() => { setEditing(null); setForm(defaultPlan); }}>
              Cancelar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
