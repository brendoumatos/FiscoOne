import api from "./api";

export interface DemoSession {
    demo: boolean;
    user: { id: string; name: string; role: string };
    company: { id: string; name: string; plan: string };
    planState: any;
    token?: string;
    resetHint?: string;
}

export const demoService = {
    async getStatus() {
        const res = await api.get("/demo/status");
        return res.data;
    },
    async getSession(): Promise<DemoSession> {
        const res = await api.get("/demo/session");
        return res.data;
    },
    async getPlanState() {
        const res = await api.get("/demo/plan-state");
        return res.data;
    },
    async getInvoices() {
        const res = await api.get("/demo/invoices");
        return res.data as any[];
    },
    async getTimeline() {
        const res = await api.get("/demo/timeline");
        return res.data as any[];
    }
};
