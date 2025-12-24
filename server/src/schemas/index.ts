import { z } from 'zod';

// AUTH
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres')
    })
});

export const signupSchema = z.object({
    body: z.object({
        name: z.string().min(3, 'Nome muito curto'),
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'Senha muito curta'),
        role: z.enum(['CLIENT', 'ACCOUNTANT']).optional()
    })
});

// COMPANIES
export const createCompanySchema = z.object({
    body: z.object({
        cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos').or(z.string().length(18)), // Allow formatted
        legalName: z.string().nonempty('Razão Social obrigatória'),
        tradeName: z.string().nonempty('Nome Fantasia obrigatório'),
        taxRegime: z.string(),
        address: z.object({
            zipCode: z.string(),
            street: z.string(),
            number: z.string(),
            neighborhood: z.string(),
            city: z.string(),
            state: z.string().length(2)
        })
    })
});

// INVOICES
export const createInvoiceSchema = z.object({
    body: z.object({
        companyId: z.string().uuid('ID da empresa inválido'),
        amount: z.number().positive('Valor deve ser positivo'),
        borrower: z.object({
            name: z.string().nonempty(),
            document: z.string().min(11, 'CPF/CNPJ inválido'),
            email: z.string().email().optional().or(z.literal(''))
        }),
        items: z.array(z.object({
            description: z.string(),
            amount: z.number()
        })).min(1, 'Deve haver pelo menos 1 item')
    })
});
