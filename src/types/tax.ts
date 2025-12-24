
export enum TaxType {
    DAS = 'DAS', // Simples Nacional
    GPS = 'GPS', // INSS
    DARF_IR = 'DARF_IR',
    DARF_CSLL = 'DARF_CSLL',
    ISS = 'ISS'
}

export enum TaxStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE'
}

export interface TaxGuide {
    id: string;
    type: TaxType;
    description: string;
    period: string; // MM/YYYY
    dueDate: string;
    amount: number;
    status: TaxStatus;
    barcode?: string;
    pdfUrl?: string;
}

export interface TaxSummary {
    totalPending: number;
    nextDueDate: string | null;
    overdueAmount: number;
}
