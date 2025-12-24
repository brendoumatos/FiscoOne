
export enum NotificationType {
    INFO = 'INFO',
    WARNING = 'WARNING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    createdAt: string;
}
