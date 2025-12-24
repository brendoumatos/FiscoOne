
import { type Invoice, type CreateInvoiceDTO, InvoiceStatus } from "@/types/invoice";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
let invoices: Invoice[] = [
    {
        id: '1',
        number: 2024001248,
        issueDate: '2024-12-12T10:00:00Z',
        status: InvoiceStatus.ISSUED,
        borrower: {
            document: '12.345.678/0001-90',
            name: 'Empresa ABC Ltda',
            email: 'contato@empresaabc.com.br',
            address: {
                street: 'Rua Exemplo',
                number: '123',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01001-000'
            }
        },
        items: [{ serviceCode: '1.03', description: 'Consultoria de Software', amount: 5500 }],
        amount: 5500,
        taxes: { iss: 110, pis: 35.75, cofins: 165, csll: 55, ir: 82.5, total: 448.25 },
        pdfUrl: '#'
    },
    {
        id: '2',
        number: 2024001247,
        issueDate: '2024-11-12T14:30:00Z',
        status: InvoiceStatus.PROCESSING,
        borrower: {
            document: '98.765.432/0001-10',
            name: 'Tech Solutions ME',
            email: 'financeiro@techsolutions.com',
            address: { street: 'Av. Inovação', number: '404', neighborhood: 'Tecnópolis', city: 'Campinas', state: 'SP', zipCode: '13000-000' }
        },
        items: [{ serviceCode: '1.07', description: 'Suporte Técnico', amount: 3200 }],
        amount: 3200,
        taxes: { iss: 64, pis: 20.8, cofins: 96, csll: 32, ir: 48, total: 260.8 }
    }
];

export const invoiceService = {
    async getInvoices(): Promise<Invoice[]> {
        await delay(800);
        return [...invoices].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    },

    async createInvoice(data: CreateInvoiceDTO): Promise<Invoice> {
        await delay(2000); // Simulate processing time

        const totalAmount = data.items.reduce((acc, item) => acc + item.amount, 0);

        // Simple mock tax calculation (Simples Nacional ~6% total approx for example)
        const taxes = this.calculateTaxes(totalAmount);

        const newInvoice: Invoice = {
            id: Math.random().toString(36).substr(2, 9),
            number: 2024001249 + invoices.length,
            issueDate: new Date().toISOString(),
            status: InvoiceStatus.PROCESSING, // Starts as processing
            borrower: data.borrower,
            items: data.items,
            amount: totalAmount,
            taxes,
            pdfUrl: '#'
        };

        invoices = [newInvoice, ...invoices];
        return newInvoice;
    },

    calculateTaxes(amount: number) {
        // Mock rates for a typical ME service company
        return {
            iss: amount * 0.02,
            pis: amount * 0.0065,
            cofins: amount * 0.03,
            csll: amount * 0.01,
            ir: amount * 0.015,
            total: amount * 0.0815
        };
    },

    async getServiceCodes() {
        await delay(300);
        return [
            { code: '1.03', description: 'Processamento de dados e congêneres', taxRate: 2.0 },
            { code: '1.05', description: 'Licenciamento ou cessão de direito de uso de programas', taxRate: 2.0 },
            { code: '1.07', description: 'Suporte técnico em informática', taxRate: 2.0 },
            { code: '17.01', description: 'Assessoria ou consultoria de qualquer natureza', taxRate: 2.0 },
        ];
    }
};
