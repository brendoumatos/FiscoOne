import { invoiceService } from "./invoice";
import { demoService } from "./demo";
import type { Invoice, IssueInvoicePayload, InvoicePreview } from "@/types/invoice";

const KEY = "fiscoone_demo_invoices";

function readCache(): Invoice[] {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as Invoice[];
    } catch {
        return [];
    }
}

function writeCache(list: Invoice[]) {
    sessionStorage.setItem(KEY, JSON.stringify(list));
}

export async function getDemoInvoices(): Promise<Invoice[]> {
    const cached = readCache();
    if (cached.length) return cached;
    try {
        const seed = await demoService.getInvoices();
        writeCache(seed);
        return seed as Invoice[];
    } catch {
        return [];
    }
}

export function previewDemoInvoice(data: IssueInvoicePayload): InvoicePreview {
    const taxes = invoiceService.calculateTaxes(Number(data.serviceAmount || 0));
    const taxAmount = data.taxAmount ?? taxes.total;
    return {
        serviceAmount: Number(data.serviceAmount),
        taxAmount: Number(taxAmount),
        totalAmount: Number(data.serviceAmount) + Number(taxAmount),
        status: "PREVIEW",
        timestamp: new Date().toISOString(),
        warnings: Number(data.serviceAmount) > 10000 ? ["Valor alto: revise alíquotas"] : []
    } as InvoicePreview;
}

export async function createDemoInvoice(data: IssueInvoicePayload): Promise<Invoice> {
    const current = await getDemoInvoices();
    const taxes = invoiceService.calculateTaxes(Number(data.serviceAmount || 0));
    const now = new Date().toISOString();
    const invoice: Invoice = {
        id: crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}`,
        status: "ISSUED" as any,
        amount: Number(data.serviceAmount) + Number(data.taxAmount || taxes.total),
        borrower: { name: data.borrowerName, document: data.borrowerDoc },
        issueDate: now,
        xmlUrl: null,
        pdfUrl: null,
        createdAt: now,
        updatedAt: now,
        taxes: taxes as any
    };
    const updated = [invoice, ...current];
    writeCache(updated);
    return invoice;
}
