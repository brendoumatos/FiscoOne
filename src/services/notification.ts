
import api from './api';
import { NotificationType, type Notification } from "@/types/notification";

const normalize = (event: any): Notification => ({
    id: event.id || crypto.randomUUID?.() || String(Date.now()),
    title: event.title || event.type || 'Atualização',
    message: event.description || event.message || 'Nova atividade registrada.',
    type: (event.type as NotificationType) || NotificationType.INFO,
    read: Boolean(event.read ?? false),
    createdAt: event.createdAt || event.timestamp || new Date().toISOString()
});

export const notificationService = {
    async getNotifications(): Promise<Notification[]> {
        try {
            const { data } = await api.get('/timeline');
            if (Array.isArray(data)) return data.map(normalize);
            return [];
        } catch (error) {
            console.error('Erro ao carregar notificações', error);
            return [];
        }
    },

    async markAsRead(id: string): Promise<void> {
        // Backend ainda não expõe persistência de leitura; silenciosamente ignora.
        try {
            await api.post('/notifications/read', { id });
        } catch (error) {
            console.error('Erro ao marcar notificação como lida', error);
        }
    }
};
