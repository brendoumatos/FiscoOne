
import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    FileText,
    Calculator,
    Settings,
    LogOut,
    Menu,
    Repeat,
    Receipt,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/common/NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { BrandEmblem, PoweredByBadge } from "@/components/common/BrandEmblem";
import { BrandPendant } from "@/components/common/BrandPendant";
import { UserNav } from "@/components/common/UserNav";

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout, user, currentCompany, companies, switchCompany } = useAuth();
    const location = useLocation();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                        ? "bg-primary text-primary-foreground shadow-md font-medium"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setIsSidebarOpen(false)}
            >
                <Icon size={20} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
            {/* Sidebar - Desktop & Mobile */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-[hsl(222,47%,11%)] text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 h-[100dvh] flex flex-col",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand */}
                {/* Brand / Company Switcher */}
                <div className="h-20 flex items-center px-4 border-b border-white/10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start px-2 h-14 hover:bg-white/5 data-[state=open]:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                                        <span className="text-lg font-bold text-white">{currentCompany?.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden flex-1">
                                        <span className="text-sm font-bold tracking-tight leading-none text-white truncate w-full text-left">{currentCompany?.name}</span>
                                        <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Plano {currentCompany?.plan}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto h-4 w-4 text-gray-400 opacity-50" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-[hsl(222,47%,11%)] border-white/10 text-white" align="start">
                            <DropdownMenuLabel className="text-xs text-gray-400">Alternar Empresa</DropdownMenuLabel>
                            {companies.map((company) => (
                                <DropdownMenuItem
                                    key={company.id}
                                    onClick={() => switchCompany(company.id)}
                                    className="gap-2 p-2 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-white/5">
                                        {company.name.charAt(0)}
                                    </div>
                                    {company.name}
                                    {currentCompany?.id === company.id && (
                                        <Check className="ml-auto h-4 w-4 text-emerald-500" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="gap-2 p-2 hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-transparent">
                                    <PlusCircle className="h-4 w-4" />
                                </div>
                                Adicionar Empresa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>



                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto py-8">
                    {user?.role === 'ACCOUNTANT' ? (
                        <>
                            <div className="px-4 pb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contador</span>
                            </div>
                            <NavItem to="/dashboard/accountant" icon={LayoutDashboard} label="Meus Clientes" />
                            <NavItem to="/dashboard/documents" icon={FileText} label="Documentos" />
                            <NavItem to="/dashboard/chat" icon={Menu} label="Fale com Clientes" />
                        </>
                    ) : (
                        <>
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem to="/dashboard/invoices" icon={FileText} label="Notas Fiscais" />
                            <NavItem to="/dashboard/taxes" icon={Calculator} label="Impostos" />
                            <NavItem to="/dashboard/recurrence" icon={Repeat} label="Recorrências" />
                            <NavItem to="/dashboard/expenses" icon={Receipt} label="Despesas" />
                            <NavItem to="/dashboard/partners" icon={Users} label="Parceiros" />
                            <NavItem to="/dashboard/documents" icon={FileText} label="Documentos" />
                            <NavItem to="/dashboard/chat" icon={Menu} label="Fale com Contador" />
                        </>
                    )}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-white/10 mt-auto bg-black/10">
                    <NavItem to="/dashboard/settings" icon={Settings} label="Configurações" />
                    <div className="mt-4 flex items-center gap-3 px-4 pt-4 border-t border-white/5">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user?.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium truncate text-white">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate capitalize">
                                {user?.role === 'ACCOUNTANT' ? 'Contador' : user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white hover:bg-white/10 -mr-2"
                            onClick={() => logout()}
                        >
                            <LogOut size={18} />
                        </Button>
                    </div>
                    <div className="mt-6 flex justify-center">
                        <PoweredByBadge className="opacity-30 hover:opacity-100" />
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
                {/* Topbar */}
                <header className="h-20 bg-white border-b flex items-center justify-between px-4 lg:px-8 shrink-0 relative">
                    <BrandPendant />
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
                            <Menu size={24} />
                        </Button>
                        <div className="hidden md:block">
                            <h2 className="text-lg font-semibold text-gray-700">
                                {(() => {
                                    const p = location.pathname;
                                    if (p === '/dashboard') return 'Dashboard';
                                    if (p.includes('/invoices')) return 'Notas Fiscais';
                                    if (p.includes('/taxes')) return 'Impostos & Obrigações';
                                    if (p.includes('/recurrence')) return 'Recorrência';
                                    if (p.includes('/expenses')) return 'Gestão de Despesas';
                                    if (p.includes('/partners')) return 'Parceiros';
                                    if (p.includes('/documents')) return 'Documentos';
                                    if (p.includes('/chat')) return 'Chat';
                                    if (p.includes('/accountant')) return 'Área do Contador';
                                    if (p.includes('/settings')) return 'Configurações';
                                    return 'FiscoOne';
                                })()}
                            </h2>
                            <p className="text-sm text-gray-400">Bem-vindo de volta, {user?.name.split(' ')[0]}!</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden sm:block">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="pl-4 pr-10 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                            />
                        </div>
                        <Button className="rounded-full bg-primary hover:bg-primary/90 text-white px-6 hidden sm:flex">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Novo
                        </Button>
                        <NotificationBell />
                        <UserNav />
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-[#f9fafb] relative">
                    <div className="max-w-7xl mx-auto relative z-10">
                        <Outlet />
                    </div>
                    <BrandEmblem className="fixed bottom-0 right-0 p-10 transform translate-x-10 translate-y-10 scale-150" />
                </main>
            </div>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
