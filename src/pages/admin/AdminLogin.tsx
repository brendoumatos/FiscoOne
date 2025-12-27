import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const { login, isLoading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password, mfaCode });
      navigate("/admin");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha no login de admin");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-2xl p-8 shadow-2xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Acesso Privilegiado</p>
          <h1 className="text-2xl font-semibold text-white">FiscoOne Admin</h1>
          <p className="text-slate-400 text-sm">MFA obrigatório e IP allowlist ativo.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@fiscoone.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Senha</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">MFA TOTP</label>
            <Input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="000000" required />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar no Console"}
          </Button>
        </form>
      </div>
    </div>
  );
}
