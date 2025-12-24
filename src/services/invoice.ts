import api from './api';
import type { Invoice, CreateInvoiceDTO } from '../types/invoice';

// Local interface removed, using imported CreateInvoiceDTO

export const invoiceService = {
    async createInvoice(data: CreateInvoiceDTO): Promise<Invoice> {
        const response = await api.post('/invoices', data);
        return response.data;
    },

    async getInvoices(companyId: string): Promise<Invoice[]> {
        const response = await api.get('/invoices', {
            params: { companyId }
        });
        return response.data;
    },

    async getStats(_companyId: string): Promise<any> {
        // Placeholder for future backend implementation
        return {
            monthlyRevenue: 0,
            annualRevenue: 0,
            activeInvoices: 0,
            averageTicket: 0
        };
    },

    async getServiceCodes() {
        // Keeping this hardcoded for now as it's static domain data
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
            csll: amount * 0.01, // approx
            ir: amount * 0.015, // approx
            total: (amount * issRate) + (amount * pisRate) + (amount * cofinsRate) + (amount * 0.01) + (amount * 0.015)
        };
    }
};
