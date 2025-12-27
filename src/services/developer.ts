
import api from './api';

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    lastUsed?: string;
}

export const developerService = {
    async getKeys(): Promise<ApiKey[]> {
        try {
            const { data } = await api.get('/developer/keys');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao carregar chaves de API', error);
            return [];
        }
    },
    async generateKey(name: string): Promise<ApiKey> {
        try {
            const { data } = await api.post('/developer/keys', { name });
            if (data) return data;
        } catch (error) {
            console.error('Erro ao gerar chave de API', error);
        }

        return {
            id: crypto.randomUUID?.() || String(Date.now()),
            name,
            prefix: 'sk_live_' + Math.random().toString(36).substring(2, 10),
            createdAt: new Date().toISOString()
        };
    },
    async revokeKey(id: string): Promise<void> {
        try {
            await api.delete(`/developer/keys/${id}`);
        } catch (error) {
            console.error('Erro ao revogar chave de API', error);
        }
    }
};
