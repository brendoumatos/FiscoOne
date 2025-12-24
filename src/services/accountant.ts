import api from './api';

export interface BrandingSettings {
    primary_color: string;
    secondary_color: string;
    logo_url: string;
    company_name_display: string;
    isDefault?: boolean;
}

export const accountantService = {
    async getClients() {
        // Mock implementation for build
        return [
            { id: '1', name: 'Empresa Demo', cnpj: '00.000.000/0001-91', ownerName: 'João Silva', taxRegime: 'Simples Nacional', status: 'ACTIVE', pendingIssues: 0 }
        ];
    },

    async getPublicBranding(domain: string): Promise<BrandingSettings | null> {
        // This might need a public axios instance if 'api' intercepts with auth?
        // For now assuming 'api' handles 401 gracefully or we use a separate fetch
        try {
            // Avoid global interceptors for this specific public call if needed, 
            // but 'api' usually attaches token if present. This route is public.
            const response = await api.get('/accountants/branding/public', { params: { domain } });
            return response.data;
        } catch (e) {
            return null;
        }
    },

    async updateBranding(data: any) {
        const response = await api.post('/accountants/branding', data);
        return response.data;
    }
};
