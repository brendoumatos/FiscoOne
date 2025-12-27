import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdminConfig, type AdminConfig } from "@/services/adminConfig";

interface AdminDebugState extends AdminConfig {
    enabled: boolean;
    loading: boolean;
    error?: string;
    refresh: () => Promise<void>;
}

const defaultState: AdminDebugState = {
    enabled: false,
    loading: false,
    error: undefined,
    flags: {},
    planLabelOverride: undefined,
    debugMeta: undefined,
    source: "none",
    refresh: async () => {},
};

const AdminDebugContext = createContext<AdminDebugState>(defaultState);

export function AdminDebugProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [state, setState] = useState<AdminDebugState>(defaultState);

    const isAdmin = useMemo(() => user?.role === "ADMIN", [user?.role]);

    const refresh = async () => {
        if (!isAdmin) {
            setState((prev) => ({ ...defaultState, enabled: false }));
            return;
        }
        setState((prev) => ({ ...prev, loading: true, error: undefined }));
        try {
            const cfg = await fetchAdminConfig();
            setState({ ...cfg, enabled: true, loading: false, refresh });
        } catch (err: any) {
            setState({ ...defaultState, enabled: true, loading: false, error: err?.message, refresh });
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    return (
        <AdminDebugContext.Provider value={{ ...state, enabled: isAdmin && state.enabled, refresh }}>
            {children}
        </AdminDebugContext.Provider>
    );
}

export function useAdminDebug() {
    return useContext(AdminDebugContext);
}
