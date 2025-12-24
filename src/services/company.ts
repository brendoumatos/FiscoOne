import { type Company, type CompanyData } from "@/types/company";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const STORAGE_KEY = 'fiscoone_companies';

export interface CompanyService {
    createCompany(data: CompanyData): Promise<Company>;
    validateCnpj(cnpj: string): Promise<boolean>;
    getCompanies(): Promise<Company[]>;
    searchCNPJ(cnpj: string): Promise<Partial<CompanyData> | null>;
}

export const companyService: CompanyService = {
    async createCompany(data: CompanyData): Promise<Company> {
        await delay(800);

        const newCompany: Company = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            ownerId: 'user-1', // Mock user ID
            createdAt: new Date().toISOString(),
            name: data.tradeName,
            // Default fields that would be set by backend
            plan: 'Pro',
            role: 'ADMIN' // Creator is admin
        } as Company; // Casting as data might miss some backend-only fields

        // Persist to local storage for "Real" feel
        const existingRaw = localStorage.getItem(STORAGE_KEY);
        let existing: Company[] = existingRaw ? JSON.parse(existingRaw) : [];

        // UNIQUE CONSTRAINT: Remove any existing company with the same CNPJ to start fresh
        existing = existing.filter(c => c.cnpj !== newCompany.cnpj);

        localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newCompany]));

        // Check if there's an "ownerless" company (default mock) and remove it if we are creating a real one?
        // No, keep logic simple: strict CNPJ uniqueness.

        return newCompany;
    },

    async validateCnpj(cnpj: string): Promise<boolean> {
        await delay(500);
        // Simple mock validation (check length)
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        return cleanCnpj.length === 14;
    },

    async getCompanies(): Promise<Company[]> {
        await delay(500);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            let companies: Company[] = JSON.parse(stored);

            // AUTO-CLEANUP: Deduplicate by CNPJ (Keep latest)
            const uniqueMap = new Map<string, Company>();
            companies.forEach(c => {
                // If exists, this loop will overwrite previous with later one (assuming order is insertion order)
                if (c.cnpj) uniqueMap.set(c.cnpj.replace(/[^\d]/g, ''), c);
            });

            const uniqueCompanies = Array.from(uniqueMap.values());

            // If we found duplicates/removed items, update storage
            if (uniqueCompanies.length !== companies.length) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueCompanies));
            }

            return uniqueCompanies;
        }
        // Return default mocks if nothing stored yet
        return [
            {
                id: '1',
                legalName: 'FiscoOne Corp',
                tradeName: 'FiscoOne HQ',
                cnpj: '00.000.000/0001-00',
                taxRegime: 'REAL',
                address: { street: 'Av Paulista', number: '1000', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', zipCode: '01310-100' },
                bankInfo: { bankName: 'Inter', agency: '0001', account: '123456-7', accountType: 'CHECKING' },
                ownerId: '1',
                createdAt: new Date().toISOString(),
                role: 'ADMIN',
                plan: 'BUSINESS',
                name: 'FiscoOne HQ'
            } as any
        ];
    },

    async searchCNPJ(cnpj: string): Promise<Partial<CompanyData> | null> {
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        if (cleanCnpj.length !== 14) return null;

        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            if (!response.ok) throw new Error('CNPJ not found');

            const data = await response.json();

            return {
                legalName: data.razao_social,
                tradeName: data.nome_fantasia || data.razao_social,
                address: {
                    zipCode: data.cep,
                    street: data.logradouro,
                    number: data.numero,
                    neighborhood: data.bairro,
                    city: data.municipio,
                    state: data.uf
                }
            };
        } catch (error) {
            console.error("Failed to fetch CNPJ", error);
            return null;
        }
    }
};
