
import { type Message } from "@/types/chat";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockMessages: Message[] = [
    { id: '1', senderId: 'cont', text: 'Olá! Tudo bem? Vi que emitiu a nota para a Tech Solutions.', timestamp: new Date(Date.now() - 100000).toISOString(), isMine: false },
    { id: '2', senderId: 'me', text: 'Oi! Sim, já mandei pra eles.', timestamp: new Date(Date.now() - 50000).toISOString(), isMine: true },
];

export const chatService = {
    async getMessages(): Promise<Message[]> {
        await delay(300);
        return [...mockMessages];
    },

    async sendMessage(text: string): Promise<Message> {
        await delay(300);
        return {
            id: Math.random().toString(),
            senderId: 'me',
            text,
            timestamp: new Date().toISOString(),
            isMine: true
        };
    },

    // Echo function for demo
    async waitForReply(): Promise<Message> {
        await delay(2000);
        return {
            id: Math.random().toString(),
            senderId: 'cont',
            text: 'Perfeito! Se precisar de ajuda com o imposto, me avise.',
            timestamp: new Date().toISOString(),
            isMine: false
        }
    }
};
