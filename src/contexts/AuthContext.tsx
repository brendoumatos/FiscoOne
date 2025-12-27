import React, { createContext, useContext, useState, useEffect } from "react";
import { type User, type LoginCredentials, type SignupData, UserRole } from "@/types/auth";
import { authService } from "@/services/auth";
import { type Company } from "@/types/company";
import { companyService } from "@/services/company";
import { demoService } from "@/services/demo";

interface AuthContextType {
    user: User | null;
    currentCompany: Company | null;
    companies: Company[];
    isAuthenticated: boolean;
    isLoading: boolean;
    isDemo: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    loginAsDemo: (role?: 'CLIENT' | 'ACCOUNTANT') => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    switchCompany: (companyId: string) => void;
    refreshCompanies: (targetId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [isDemo, setIsDemo] = useState<boolean>(false);

    const buildLocalDemoSession = () => ({
        user: { id: "demo-user-id", name: "Usuário Demonstração", role: UserRole.CLIENT },
        company: { id: "demo-company-id", name: "Demo Company", plan: "ESSENTIAL" as const }
    });

    const loadCompanies = async (selectedId?: string) => {
        if (isDemo) {
            // Mock companies for demo
            setCompanies([{
                id: "demo-company-id",
                ownerId: "demo-user-id",
                cnpj: "00.000.000/0001-91",
                legalName: "Empresa Demonstração Ltda",
                tradeName: "Demo Company",
                taxRegime: "SIMPLES",
                plan: "Pro",
                name: "Demo Company",
                createdAt: new Date().toISOString(),
                address: {
                    zipCode: "00000-000",
                    street: "Rua Demo",
                    number: "123",
                    neighborhood: "Centro",
                    city: "São Paulo",
                    state: "SP"
                },
                bankInfo: {
                    bankName: "Banco Demo",
                    agency: "0001",
                    account: "12345-6",
                    accountType: "CHECKING"
                } as any
            } as Company]);
            setCurrentCompany({
                id: "demo-company-id",
                ownerId: "demo-user-id",
                cnpj: "00.000.000/0001-91",
                legalName: "Empresa Demonstração Ltda",
                tradeName: "Demo Company",
                taxRegime: "SIMPLES",
                plan: "Pro",
                name: "Demo Company",
                createdAt: new Date().toISOString(),
                address: {
                    zipCode: "00000-000",
                    street: "Rua Demo",
                    number: "123",
                    neighborhood: "Centro",
                    city: "São Paulo",
                    state: "SP"
                },
                bankInfo: {
                    bankName: "Banco Demo",
                    agency: "0001",
                    account: "12345-6",
                    accountType: "CHECKING"
                } as any
            } as Company);
            return;
        }

        const loaded = await companyService.getCompanies();
        setCompanies(loaded);

        // If we have a specific ID to select, try to find it
        if (selectedId) {
            const target = loaded.find(c => c.id === selectedId);
            if (target) {
                setCurrentCompany(target);
                return;
            }
        }

        // Fallback to storing ID in local storage
        const storedCompanyId = localStorage.getItem("fiscoone_current_company_id");
        if (storedCompanyId) {
            const company = loaded.find(c => c.id === storedCompanyId);
            setCurrentCompany(company || loaded[0]);
        } else if (loaded.length > 0) {
            setCurrentCompany(loaded[0]);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem("fiscoone_user");
            const demoFlag = localStorage.getItem("fiscoone_demo_mode");

            if (demoFlag === "true") {
                setIsDemo(true);
                if (storedUser) {
                    const parsed = JSON.parse(storedUser) as User;
                    setUser(parsed);
                    const session = buildLocalDemoSession();
                    const demoCompany: Company = {
                        id: session.company.id,
                        ownerId: session.user.id,
                        cnpj: "00.000.000/0001-91",
                        legalName: session.company.name,
                        tradeName: session.company.name,
                        taxRegime: "SIMPLES",
                        plan: session.company.plan,
                        name: session.company.name,
                        createdAt: new Date().toISOString(),
                        address: {
                            zipCode: "00000-000",
                            street: "Rua Demo",
                            number: "123",
                            neighborhood: "Centro",
                            city: "São Paulo",
                            state: "SP"
                        },
                        bankInfo: {
                            bankName: "Banco Demo",
                            agency: "0001",
                            account: "12345-6",
                            accountType: "CHECKING"
                        } as any
                    };
                    setCompanies([demoCompany]);
                    setCurrentCompany(demoCompany);
                }
            } else if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                await loadCompanies();
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (data: LoginCredentials) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data);
            authService.setSession(response.token, response.user); // Persist token and user
            setUser(response.user);
            setIsDemo(false);
            localStorage.removeItem("fiscoone_demo_mode");
            await loadCompanies(); // Load companies after successful login
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: SignupData) => {
        setIsLoading(true);
        try {
            const response = await authService.register(data);
            authService.setSession(response.token, response.user);
            setUser(response.user);
            setIsDemo(false);
            localStorage.removeItem("fiscoone_demo_mode");
            await loadCompanies();
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginAsDemo = async (role: 'CLIENT' | 'ACCOUNTANT' = 'CLIENT') => {
        setIsLoading(true);
        try {
            const mappedRole = role === 'CLIENT' ? UserRole.CLIENT : UserRole.ACCOUNTANT;

            const session = await demoService.getSession();
            if (!session?.token) {
                throw new Error("Demo session indisponível");
            }

            const demoUser: User = {
                id: session.user.id,
                name: role === 'CLIENT' ? session.user.name : "Contador Demo",
                email: role === 'CLIENT' ? "demo@fiscoone.com" : "contador@fiscoone.com",
                role: mappedRole,
                companyId: session.company.id,
                token: session.token
            };

            const demoCompany: Company = {
                id: session.company.id,
                ownerId: session.user.id,
                cnpj: "00.000.000/0001-91",
                legalName: session.company.name,
                tradeName: session.company.name,
                taxRegime: "SIMPLES",
                plan: session.company.plan,
                name: session.company.name,
                createdAt: new Date().toISOString(),
                address: {
                    zipCode: "00000-000",
                    street: "Rua Demo",
                    number: "123",
                    neighborhood: "Centro",
                    city: "São Paulo",
                    state: "SP"
                },
                bankInfo: {
                    bankName: "Banco Demo",
                    agency: "0001",
                    account: "12345-6",
                    accountType: "CHECKING"
                } as any
            };

            setUser(demoUser);
            setIsDemo(true);
            localStorage.setItem("fiscoone_demo_mode", "true");
            localStorage.setItem("fiscoone_user", JSON.stringify(demoUser));

            // Persist token issued for demo-only calls (read-only enforced server-side)
            authService.setSession(session.token, demoUser);

            setCompanies([demoCompany]);
            setCurrentCompany(demoCompany);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setCompanies([]);
            setCurrentCompany(null);
            localStorage.removeItem("fiscoone_demo_mode");
            localStorage.removeItem("fiscoone_current_company_id");
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = (data: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...data };
            localStorage.setItem("fiscoone_user", JSON.stringify(updated));
            return updated;
        });
    };

    const switchCompany = (companyId: string) => {
        const company = companies.find(c => c.id === companyId);
        if (company) {
            setCurrentCompany(company);
            localStorage.setItem("fiscoone_current_company_id", companyId);
        }
    };

    const refreshCompanies = async (targetId?: string) => {
        if (isDemo) return; // No refreshing in demo mode
        // If a targetId is provided, use it. Otherwise, keep the current one.
        await loadCompanies(targetId || currentCompany?.id);
    };

    return (
        <AuthContext.Provider value={{
            user,
            currentCompany,
            companies,
            isAuthenticated: !!user,
            isLoading,
            isDemo,
            login,
            loginAsDemo,
            signup,
            logout,
            updateUser,
            switchCompany,
            refreshCompanies
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
