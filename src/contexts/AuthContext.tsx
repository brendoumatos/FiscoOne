import React, { createContext, useContext, useState, useEffect } from "react";
import { type User, type LoginCredentials, type SignupData } from "@/types/auth";
import { authService } from "@/services/auth";
import { type Company } from "@/types/company";
import { companyService } from "@/services/company";

interface AuthContextType {
    user: User | null;
    currentCompany: Company | null;
    companies: Company[];
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
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

    const loadCompanies = async (selectedId?: string) => {
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
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                await loadCompanies();
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const response = await authService.login(credentials);
            setUser(response.user);
            localStorage.setItem("fiscoone_user", JSON.stringify(response.user));
            await loadCompanies();
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: SignupData) => {
        setIsLoading(true);
        try {
            const response = await authService.signup(data);
            setUser(response.user);
            localStorage.setItem("fiscoone_user", JSON.stringify(response.user));
            await loadCompanies();
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setCurrentCompany(null);
            setCompanies([]);
            localStorage.removeItem("fiscoone_user");
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
            login,
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
