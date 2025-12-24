
import { NotificationType, type Notification } from "@/types/notification";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockNotifications: Notification[] = [
    {
        id: '1',
        title: 'Guia DAS Disponível',
        message: 'A guia DAS referente a 11/2024 já está disponível para pagamento.',
        type: NotificationType.WARNING,
        read: false,
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        title: 'Nota Fiscal Emitida',
        message: 'A NFS-e #204 foi autorizada com sucesso.',
        type: NotificationType.SUCCESS,
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: '3',
        title: 'Bem-vindo ao FiscoOne',
        message: 'Complete seu perfil para aproveitar todas as funcionalidades.',
        type: NotificationType.INFO,
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
    }
];

export const notificationService = {
    async getNotifications(): Promise<Notification[]> {
        await delay(500);
        return mockNotifications;
    },

    async markAsRead(id: string): Promise<void> {
        await delay(200);
        const notif = mockNotifications.find(n => n.id === id);
        if (notif) notif.read = true;
    }
};
