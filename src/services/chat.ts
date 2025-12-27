
import api from './api';
import { type Message } from "@/types/chat";

const normalize = (item: any): Message => ({
    id: item.id || crypto.randomUUID?.() || String(Date.now()),
    senderId: item.senderId || item.from || 'system',
    text: item.text || item.message || '',
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    isMine: Boolean(item.isMine ?? item.senderId === 'me')
});

export const chatService = {
    async getMessages(): Promise<Message[]> {
        try {
            const { data } = await api.get('/chat/messages');
            return Array.isArray(data) ? data.map(normalize) : [];
        } catch (error) {
            console.error('Erro ao carregar mensagens', error);
            return [];
        }
    },

    async sendMessage(text: string): Promise<Message> {
        try {
            const { data } = await api.post('/chat/messages', { text });
            if (data) return normalize(data);
        } catch (error) {
            console.error('Erro ao enviar mensagem', error);
        }

        return normalize({ senderId: 'me', text });
    },

    async waitForReply(): Promise<Message> {
        try {
            const { data } = await api.get('/chat/messages/wait');
            if (data) return normalize(data);
        } catch (error) {
            console.error('Erro ao aguardar resposta', error);
        }
        return normalize({ senderId: 'system', text: 'Sem novas mensagens no momento.' });
    }
};
