
export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    isMine: boolean;
}

export interface ChatSession {
    id: string;
    participantName: string;
    lastMessage: string;
    unreadCount: number;
}
