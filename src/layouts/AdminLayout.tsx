import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldCheck, Building2, CreditCard, Users, ScrollText, Sparkles, LogOut } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Visão Geral", icon: ShieldCheck },
  { to: "/admin/companies", label: "Empresas", icon: Building2 },
  { to: "/admin/plans", label: "Planos & Pricing", icon: CreditCard },
  { to: "/admin/users", label: "Usuários & Assentos", icon: Users },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/impersonation", label: "Impersonação", icon: Sparkles },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <aside
        className={cn(
          "w-72 bg-slate-900/80 border-r border-white/5 px-4 py-6 flex flex-col gap-6 fixed inset-y-0 z-40 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-black text-slate-950 shadow-lg">
              F1
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">FiscoOne Admin</p>
              <p className="text-xs text-slate-400">{admin?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}>
            ☰
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium",
                  isActive ? "bg-amber-500 text-slate-900 shadow-lg" : "text-slate-300 hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 pt-4 flex items-center justify-between text-sm">
          <div>
            <p className="font-semibold">{admin?.email}</p>
            <p className="text-slate-400">{admin?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
            className="text-slate-300 hover:text-white"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="flex-1 lg:ml-72 min-h-screen">
        <header className="h-16 border-b border-white/5 bg-slate-900/70 backdrop-blur flex items-center justify-between px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Admin Console</p>
            <h1 className="text-lg font-semibold">Governança e Controle</h1>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>{admin?.email}</p>
            <p className="text-xs text-slate-500">Sessão privilegiada</p>
          </div>
        </header>
        <div className="p-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
