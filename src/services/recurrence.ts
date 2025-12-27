
import api from './api';
import { RecurrenceFrequency, RecurrenceStatus, type Recurrence } from "@/types/recurrence";

const normalize = (item: any): Recurrence => ({
    id: item.id || item.recurrenceId || crypto.randomUUID?.() || String(Date.now()),
    borrowerName: item.borrowerName || item.customer || 'Cliente',
    serviceDescription: item.serviceDescription || item.description || 'Recorrência',
    amount: Number(item.amount) || 0,
    frequency: (item.frequency as RecurrenceFrequency) || (item.interval as RecurrenceFrequency) || RecurrenceFrequency.MONTHLY,
    nextRunDate: item.nextRunDate || item.nextExecution || new Date().toISOString(),
    lastRunDate: item.lastRunDate || item.lastExecution || undefined,
    status: (item.status as RecurrenceStatus) || RecurrenceStatus.ACTIVE,
    autoSendEmail: Boolean(item.autoSendEmail ?? item.autoSend)
});

export const recurrenceService = {
    async getRecurrences(): Promise<Recurrence[]> {
        try {
            const { data } = await api.get('/recurrence/schedules');
            if (Array.isArray(data?.items)) return data.items.map(normalize);
            if (Array.isArray(data)) return data.map(normalize);
            return [];
        } catch (error) {
            console.error('Erro ao carregar recorrências', error);
            return [];
        }
    },

    async toggleStatus(id: string): Promise<void> {
        try {
            await api.post('/recurrence/schedules/toggle', { id });
        } catch (error) {
            console.error('Erro ao alternar status da recorrência', error);
        }
    },

    async addRecurrence(recurrence: Omit<Recurrence, 'id' | 'status' | 'lastRunDate'>): Promise<Recurrence> {
        try {
            const { data } = await api.post('/recurrence/schedules', recurrence);
            if (data?.recurrence) return normalize(data.recurrence);
        } catch (error) {
            console.error('Erro ao criar recorrência', error);
        }

        return normalize({ ...recurrence, status: RecurrenceStatus.ACTIVE });
    }
};
