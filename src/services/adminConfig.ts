import api from "./api";

export type AdminConfig = {
    flags: Record<string, any>;
    planLabelOverride?: string;
    debugMeta?: any;
    source: "endpoint" | "header" | "none";
};

const DEFAULT_CONFIG: AdminConfig = {
    flags: {},
    planLabelOverride: undefined,
    debugMeta: undefined,
    source: "none",
};

export async function fetchAdminConfig(): Promise<AdminConfig> {
    try {
        const res = await api.get("/config/flags", {
            validateStatus: (status) => status >= 200 && status < 500,
        });

        const headerLabel = res.headers?.["x-plan-label-override"] as string | undefined;
        const headerDebug = res.headers?.["x-debug-meta"] as string | undefined;

        let parsedDebug: any = undefined;
        if (headerDebug) {
            try {
                parsedDebug = JSON.parse(headerDebug);
            } catch {
                parsedDebug = headerDebug;
            }
        }

        const bodyFlags = (res.data?.flags ?? res.data) as Record<string, any> | undefined;
        const bodyDebug = res.data?.debugMeta as any;

        return {
            flags: bodyFlags || {},
            planLabelOverride: headerLabel ?? res.data?.planLabelOverride,
            debugMeta: bodyDebug ?? parsedDebug,
            source: "endpoint",
        };
    } catch (err) {
        console.warn("Admin config not available", err);
        return DEFAULT_CONFIG;
    }
}
