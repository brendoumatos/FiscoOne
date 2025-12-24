
export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    lastUsed?: string;
}

const mockKeys: ApiKey[] = [
    { id: '1', name: 'Produção Key 1', prefix: 'sk_live_83k...', createdAt: '2024-01-15', lastUsed: '2024-05-20' },
];

export const developerService = {
    async getKeys(): Promise<ApiKey[]> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return [...mockKeys];
    },
    async generateKey(name: string): Promise<ApiKey> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            id: Math.random().toString(),
            name,
            prefix: 'sk_live_' + Math.random().toString(36).substring(7),
            createdAt: new Date().toISOString()
        };
    },
    async revokeKey(_id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
