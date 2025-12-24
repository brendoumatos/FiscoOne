


export enum RecurrenceFrequency {
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY'
}

export enum RecurrenceStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    CANCELLED = 'CANCELLED'
}

export interface Recurrence {
    id: string;
    borrowerName: string;
    serviceDescription: string;
    amount: number;
    frequency: RecurrenceFrequency;
    nextRunDate: string;
    status: RecurrenceStatus;
    autoSendEmail: boolean;
    lastRunDate?: string;
}
