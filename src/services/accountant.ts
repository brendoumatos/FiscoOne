
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ClientCompany {
    id: string;
    cnpj: string;
    name: string;
    ownerName: string;
    taxRegime: string;
    status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
    pendingIssues: number;
}

const mockClients: ClientCompany[] = [
    { id: '1', cnpj: '12.345.678/0001-90', name: 'Empresa ABC Ltda', ownerName: 'João Silva', taxRegime: 'Simples Nacional', status: 'ACTIVE', pendingIssues: 0 },
    { id: '2', cnpj: '98.765.432/0001-10', name: 'Tech Solutions ME', ownerName: 'Maria Santos', taxRegime: 'MEI', status: 'ACTIVE', pendingIssues: 2 },
    { id: '3', cnpj: '11.222.333/0001-99', name: 'Consultoria XYZ', ownerName: 'Carlos Oliveira', taxRegime: 'Lucro Presumido', status: 'PENDING', pendingIssues: 5 },
];

export const accountantService = {
    async getClients(): Promise<ClientCompany[]> {
        await delay(800);
        return mockClients;
    },
};
