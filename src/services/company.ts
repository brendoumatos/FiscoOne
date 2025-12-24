import api from './api';
import type { Company } from '../types/company';

export interface CompanyData {
    cnpj: string;
    legalName: string;
    tradeName: string;
    taxRegime: string;
    cnae?: string;
    address: {
        zipCode: string;
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
    };
    bankInfo?: {
        bankName: string;
        agency: string;
        account: string;
        accountType: string;
        pixKey?: string;
    };
    planCode?: string;
}

export const companyService = {
    async createCompany(data: CompanyData): Promise<Company> {
        const response = await api.post('/companies', data);
        return response.data;
    },

    async getCompanies(): Promise<Company[]> {
        const response = await api.get('/companies');
        return response.data;
    },

    async searchCNPJ(cnpj: string): Promise<any> {
        try {
            const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }
};
