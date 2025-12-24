
import { PartnerCategory, type Partner } from "@/types/partner";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockPartners: Partner[] = [
    {
        id: '1',
        name: 'Silva & Advogados Associados',
        description: 'Especialistas em direito tributário e empresarial. Proteja seu negócio.',
        category: PartnerCategory.LEGAL,
        rating: 4.9,
        reviewsCount: 124,
        hourlyRate: 450,
        verified: true
    },
    {
        id: '2',
        name: 'FiscoExperts Consultoria',
        description: 'Auditoria fiscal e planejamento tributário para PMEs.',
        category: PartnerCategory.ACCOUNTING,
        rating: 4.8,
        reviewsCount: 89,
        verified: true
    },
    {
        id: '3',
        name: 'Growth Marketing Digital',
        description: 'Aceleramos suas vendas com estratégias de performance.',
        category: PartnerCategory.MARKETING,
        rating: 4.7,
        reviewsCount: 56,
        verified: false
    },
    {
        id: '4',
        name: 'TechSolutions IT',
        description: 'Suporte técnico e automação de processos.',
        category: PartnerCategory.TECH,
        rating: 5.0,
        reviewsCount: 32,
        hourlyRate: 200,
        verified: true
    }
];

export const partnerService = {
    async getPartners(): Promise<Partner[]> {
        await delay(500);
        return mockPartners;
    }
};
