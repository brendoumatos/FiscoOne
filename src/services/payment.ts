
import { PaymentMethod, PaymentStatus, type PaymentTransaction } from "@/types/payment";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const paymentService = {
    async generatePayment(invoiceId: string, amount: number, method: PaymentMethod): Promise<PaymentTransaction> {
        await delay(1500);

        const baseTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            invoiceId,
            amount,
            status: PaymentStatus.PENDING,
            method,
            createdAt: new Date().toISOString(),
        };

        if (method === PaymentMethod.PIX) {
            return {
                ...baseTransaction,
                pixCode: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Cicrano de Tal6008BRASILIA62070503***6304E2CA",
                pixQrCodeUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" // Placeholder
            };
        } else if (method === PaymentMethod.BOLETO) {
            return {
                ...baseTransaction,
                boletoBarcode: "34191.79001 01043.510047 91020.150008 5 84600000026000",
                boletoUrl: "#"
            };
        }

        return baseTransaction;
    }
};
