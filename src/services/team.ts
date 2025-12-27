
import api from './api';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | 'COLLABORATOR';
    status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

const normalizeMember = (row: any): TeamMember => ({
    id: row.user_id || row.id || crypto.randomUUID?.() || String(Date.now()),
    name: row.name || row.email || 'Colaborador',
    email: row.email || row.user_id || 'desconhecido@empresa.com',
    role: row.role === 'COLLABORATOR' ? 'MEMBER' : (row.role || 'MEMBER'),
    status: row.status || 'ACTIVE'
});

export const teamService = {
    async getMembers(): Promise<TeamMember[]> {
        try {
            const { data } = await api.get('/collaborators');
            return Array.isArray(data) ? data.map(normalizeMember) : [];
        } catch (error) {
            console.error('Erro ao carregar membros do time', error);
            return [];
        }
    },
    async inviteMember(identifier: string, role: string): Promise<TeamMember> {
        try {
            await api.post('/collaborators', { userId: identifier, role });
        } catch (error) {
            console.error('Erro ao convidar colaborador', error);
        }

        // Backend retorna apenas mensagem; devolvemos representação mínima para UI.
        return {
            id: identifier,
            name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
            email: identifier,
            role: role as TeamMember['role'],
            status: 'PENDING'
        };
    },
    async removeMember(id: string): Promise<void> {
        try {
            await api.delete(`/collaborators/${id}`);
        } catch (error) {
            console.error('Erro ao remover colaborador', error);
        }
    }
};
