
import { z } from "zod";

export const addressSchema = z.object({
    zipCode: z.string().min(8, "CEP invalid"),
    street: z.string().min(1, "Street is required"),
    number: z.string().min(1, "Number is required"),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, "Neighborhood is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().length(2, "State must be 2 characters"),
});

export const bankInfoSchema = z.object({
    bankName: z.string().min(1, "Bank name is required"),
    agency: z.string().min(1, "Agency is required"),
    account: z.string().min(1, "Account number is required"),
    accountType: z.enum(["CHECKING", "SAVINGS"]),
});

const TAX_REGIMES = ["SIMPLES", "PRESUMIDO", "REAL"] as const;

export const companySchema = z.object({
    cnpj: z.string().min(14, "CNPJ invalid").max(18),
    legalName: z.string().min(3, "Legal name required"),
    tradeName: z.string().min(3, "Trade name required"),
    taxRegime: z.enum(TAX_REGIMES),
    cnae: z.string().optional(),
    // Growth Profile
    averageMonthlyRevenue: z.number().optional(),
    invoiceFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "SPORADIC"]).optional(),
    taxManagement: z.enum(["ACCOUNTANT", "SPREADSHEET", "ERP", "NONE"]).optional(),

    address: addressSchema,
    bankInfo: bankInfoSchema,
});

export type CompanyData = z.infer<typeof companySchema>;

export interface Company extends CompanyData {
    id: string;
    ownerId: string;
    createdAt: string;
    name: string; // Alias for tradeName for UI compatibility
    plan: string; // e.g. 'Pro', 'Enterprise'
}
