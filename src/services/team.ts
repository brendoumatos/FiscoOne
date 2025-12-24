
export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MEMBER' | 'VIEWER';
    status: 'ACTIVE' | 'PENDING';
}

const mockMembers: TeamMember[] = [
    { id: '1', name: 'Você', email: 'admin@empresa.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: '2', name: 'Maria Silva', email: 'financeiro@empresa.com', role: 'MEMBER', status: 'ACTIVE' },
];

export const teamService = {
    async getMembers(): Promise<TeamMember[]> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return [...mockMembers];
    },
    async inviteMember(email: string, role: string): Promise<TeamMember> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            id: Math.random().toString(),
            name: email.split('@')[0],
            email,
            role: role as any,
            status: 'PENDING'
        };
    },
    async removeMember(_id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
