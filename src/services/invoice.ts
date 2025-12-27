import api from './api';
import type { Invoice, CreateInvoiceDTO, IssueInvoicePayload, InvoicePreview } from '../types/invoice';

export const invoiceService = {
    async createInvoice(data: IssueInvoicePayload): Promise<Invoice> {
        const response = await api.post('/invoices', data);
        return response.data;
    },

    async previewInvoice(data: IssueInvoicePayload): Promise<InvoicePreview> {
        const response = await api.get('/invoices/preview', { params: data });
        return response.data;
    },

    async getInvoices(params?: { month?: string; status?: string }): Promise<Invoice[]> {
        const response = await api.get('/invoices', { params });
        return response.data;
    },

    async getStats(): Promise<any> {
        const response = await api.get('/dashboard/summary');
        return response.data;
    },

    async getServiceCodes() {
        // Static domain data fallback
        return [
            { code: '1.03', description: 'Processamento de dados e congêneres', taxRate: 2.0 },
            { code: '1.05', description: 'Licenciamento ou cessão de direito de uso de programas', taxRate: 2.0 },
            { code: '1.07', description: 'Suporte Técnico em Informática', taxRate: 2.0 },
            { code: '17.06', description: 'Propaganda e Publicidade', taxRate: 2.0 },
        ];
    },

    calculateTaxes(amount: number) {
        // Client-side estimation
        const issRate = 0.02;
        const pisRate = 0.0065;
        const cofinsRate = 0.03;

        return {
            iss: amount * issRate,
            pis: amount * pisRate,
            cofins: amount * cofinsRate,
            csll: amount * 0.01,
            ir: amount * 0.015,
            total: (amount * issRate) + (amount * pisRate) + (amount * cofinsRate) + (amount * 0.01) + (amount * 0.015)
        };
    }
};
