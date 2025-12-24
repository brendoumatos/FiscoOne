import api from './api';

export interface Provider {
    id: string;
    company_id: string;
    bio: string;
    specialties: string[];
    verified: boolean;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    category: 'ACCOUNTING' | 'LEGAL' | 'TECH' | 'FINANCE' | 'MARKETING';
    price_range: string;
    provider_name?: string;
}

export const marketplaceService = {
    async listServices(category?: string): Promise<Service[]> {
        const params = category ? { category } : {};
        const response = await api.get('/marketplace/services', { params });
        return response.data;
    },

    async registerProvider(data: { companyId: string, bio: string, specialties: string[] }) {
        const response = await api.post('/marketplace/providers', data);
        return response.data;
    },

    async createService(data: { providerId: string, title: string, description: string, category: string }) {
        const response = await api.post('/marketplace/services', data);
        return response.data;
    },

    async getMyProfile(companyId: string): Promise<Provider | null> {
        const response = await api.get('/marketplace/providers/me', { params: { companyId } });
        return response.data;
    }
};
