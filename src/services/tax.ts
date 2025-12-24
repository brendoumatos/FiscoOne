
import { TaxStatus, TaxType, type TaxGuide, type TaxSummary } from "@/types/tax";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockGuides: TaxGuide[] = [
    {
        id: '1',
        type: TaxType.DAS,
        description: 'Documento de Arrecadação do Simples Nacional',
        period: '11/2024',
        dueDate: '2024-12-20T00:00:00Z',
        amount: 71.60,
        status: TaxStatus.PENDING,
        barcode: '89600000000-0 71600000555-5 55555555555-5 55555555555-5',
    },
    {
        id: '2',
        type: TaxType.ISS,
        description: 'Imposto Sobre Serviços - Competência Nov',
        period: '11/2024',
        dueDate: '2024-12-15T00:00:00Z',
        amount: 450.00,
        status: TaxStatus.OVERDUE,
    },
    {
        id: '3',
        type: TaxType.GPS,
        description: 'INSS Contribuinte Individual',
        period: '11/2024',
        dueDate: '2024-12-15T00:00:00Z',
        amount: 1320.00,
        status: TaxStatus.PENDING,
    },
    {
        id: '4',
        type: TaxType.DAS,
        description: 'Documento de Arrecadação do Simples Nacional',
        period: '10/2024',
        dueDate: '2024-11-20T00:00:00Z',
        amount: 350.90,
        status: TaxStatus.PAID,
    }
];

export const taxService = {
    async getGuides(): Promise<TaxGuide[]> {
        await delay(800);
        return mockGuides;
    },

    async getSummary(): Promise<TaxSummary> {
        await delay(500);
        const pending = mockGuides.filter(g => g.status !== TaxStatus.PAID);
        const nextDue = pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
        const overdue = pending.filter(g => g.status === TaxStatus.OVERDUE);

        return {
            totalPending: pending.reduce((acc, curr) => acc + curr.amount, 0),
            nextDueDate: nextDue ? nextDue.dueDate : null,
            overdueAmount: overdue.reduce((acc, curr) => acc + curr.amount, 0)
        };
    },

    async generateGuide(period: string, type: TaxType): Promise<TaxGuide> {
        await delay(1500);
        return {
            id: Math.random().toString(),
            type,
            description: `${type === TaxType.DAS ? 'DAS' : type} - ${period}`,
            period,
            dueDate: new Date().toISOString(), // Mock next month
            amount: Math.random() * 500,
            status: TaxStatus.PENDING
        };
    }
};
