
import { RecurrenceFrequency, RecurrenceStatus, type Recurrence } from "@/types/recurrence";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockRecurrences: Recurrence[] = [
    {
        id: '1',
        borrowerName: 'Tech Solutions ME',
        serviceDescription: 'Consultoria Mensal de TI',
        amount: 2500.00,
        frequency: RecurrenceFrequency.MONTHLY,
        nextRunDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
        status: RecurrenceStatus.ACTIVE,
        autoSendEmail: true,
        lastRunDate: new Date(new Date().setDate(new Date().getDate() - 25)).toISOString()
    },
    {
        id: '2',
        borrowerName: 'Agência Criativa',
        serviceDescription: 'Manutenção de Servidores',
        amount: 1200.00,
        frequency: RecurrenceFrequency.MONTHLY,
        nextRunDate: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
        status: RecurrenceStatus.ACTIVE,
        autoSendEmail: false
    }
];

export const recurrenceService = {
    async getRecurrences(): Promise<Recurrence[]> {
        await delay(600);
        return mockRecurrences;
    },

    async toggleStatus(id: string): Promise<void> {
        await delay(300);
        const item = mockRecurrences.find(r => r.id === id);
        if (item) {
            item.status = item.status === RecurrenceStatus.ACTIVE ? RecurrenceStatus.PAUSED : RecurrenceStatus.ACTIVE;
        }
    },

    async addRecurrence(recurrence: Omit<Recurrence, 'id' | 'status' | 'lastRunDate'>): Promise<Recurrence> {
        await delay(500);
        const newRecurrence: Recurrence = {
            id: Math.random().toString(36).substr(2, 9),
            ...recurrence,
            status: RecurrenceStatus.ACTIVE
        };
        mockRecurrences.push(newRecurrence);
        return newRecurrence;
    }
};
