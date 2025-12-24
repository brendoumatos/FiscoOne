
export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    ISSUED = 'ISSUED',
    PROCESSING = 'PROCESSING',
    CANCELLED = 'CANCELLED',
    ERROR = 'ERROR'
}

export enum TaxRegime {
    MEI = 'MEI',
    KPICard = 'SIMPLEX_NATIONAL',
    PRESUMED_PROFIT = 'PRESUMED_PROFIT'
}

export interface Borrower {
    document: string; // CPF or CNPJ
    name: string;
    email: string;
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
}

export interface ServiceCode {
    code: string;
    description: string;
    taxRate: number; // Percentage (e.g., 2.0 for 2%)
}

export interface InvoiceItem {
    serviceCode: string;
    description: string;
    amount: number;
}

export interface Invoice {
    id: string;
    number?: number;
    issueDate: string;
    status: InvoiceStatus;
    borrower: Borrower;
    items: InvoiceItem[];
    amount: number;
    taxes: {
        iss: number;
        pis: number;
        cofins: number;
        csll: number;
        ir: number;
        total: number;
    };
    pdfUrl?: string;
    xmlUrl?: string;
    companyId?: string; // Tenant isolation
}

export interface CreateInvoiceDTO {
    borrower: Borrower;
    items: InvoiceItem[];
}
