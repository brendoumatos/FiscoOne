import React, { createContext, useContext, useState, useEffect } from "react";
import { type User, type LoginCredentials, type SignupData, UserRole } from "@/types/auth";
import { authService } from "@/services/auth";
import { type Company } from "@/types/company";
import { companyService } from "@/services/company";

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
                    setUser(JSON.parse(storedUser));
                }
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

    const loginAsDemo = async (role: 'CLIENT' | 'ACCOUNTANT' = 'CLIENT') => {
        setIsLoading(true);
        const mappedRole = role === 'CLIENT' ? UserRole.CLIENT : UserRole.ACCOUNTANT;
        const mockUser: User = {
            id: "demo-user-id",
            name: role === 'CLIENT' ? "Usuário Demonstração" : "Contador Demo",
            email: role === 'CLIENT' ? "demo@fiscoone.com" : "contador@fiscoone.com",
            role: mappedRole,
            companyId: "demo-company-id",
            token: "demo-token-123"
        };

        setUser(mockUser);
        setIsDemo(true);
        localStorage.setItem("fiscoone_demo_mode", "true");
        localStorage.setItem("fiscoone_user", JSON.stringify(mockUser));

        // Mock token persistence
        authService.setSession("demo-token-123", mockUser);

        // Load mock companies
        const demoCompany: Company = {
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
        };

        setCompanies([demoCompany]);
        setCurrentCompany(demoCompany);

        setIsLoading(false);
    };

    const signup = async (data: SignupData) => {
        setIsLoading(true);
        try {
            const response = await authService.register(data);
            authService.setSession(response.token, response.user); // Persist token and user
            setUser(response.user);
            setIsDemo(false);
            localStorage.removeItem("fiscoone_demo_mode");
            // isAuthenticated is derived from user, no need to set explicitly
            await loadCompanies(); // Load companies after successful registration
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            if (!isDemo) {
                await authService.logout();
            }
            setUser(null);
            setCurrentCompany(null);
            setCompanies([]);
            setIsDemo(false);
            localStorage.removeItem("fiscoone_user");
            localStorage.removeItem("fiscoone_current_company_id");
            localStorage.removeItem("fiscoone_demo_mode");
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
