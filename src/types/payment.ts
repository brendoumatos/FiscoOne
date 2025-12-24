
export enum PaymentMethod {
    PIX = 'PIX',
    BOLETO = 'BOLETO',
    CREDIT_CARD = 'CREDIT_CARD'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED'
}

export interface PaymentTransaction {
    id: string;
    invoiceId: string;
    amount: number;
    status: PaymentStatus;
    method: PaymentMethod;
    createdAt: string;
    pixCode?: string; // Payload do Pix
    pixQrCodeUrl?: string; // URL da imagem do QR Code
    boletoBarcode?: string;
    boletoUrl?: string;
}
