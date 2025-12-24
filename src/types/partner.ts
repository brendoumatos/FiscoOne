
export enum PartnerCategory {
    ACCOUNTING = 'Contabilidade',
    LEGAL = 'Jurídico',
    finance = 'Consultoria Financeira',
    MARKETING = 'Marketing & Vendas',
    TECH = 'Tecnologia'
}

export interface Partner {
    id: string;
    name: string;
    description: string;
    category: PartnerCategory;
    rating: number;
    reviewsCount: number;
    hourlyRate?: number;
    imageUrl?: string;
    verified: boolean;
}
