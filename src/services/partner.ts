
import api from './api';
import { PartnerCategory, type Partner } from "@/types/partner";

const normalize = (item: any): Partner => ({
    id: item.id || item.service_id || crypto.randomUUID?.() || String(Date.now()),
    name: item.name || item.title || 'Parceiro',
    description: item.description || item.summary || 'Serviço disponível',
    category: (item.category as PartnerCategory) || PartnerCategory.ACCOUNTING,
    rating: Number(item.rating) || 0,
    reviewsCount: Number(item.reviewsCount || item.reviews || 0),
    hourlyRate: item.hourlyRate || item.price,
    imageUrl: item.imageUrl || item.logo,
    verified: Boolean(item.verified ?? item.isVerified)
});

export const partnerService = {
    async getPartners(): Promise<Partner[]> {
        try {
            const { data } = await api.get('/marketplace/services');
            if (Array.isArray(data)) return data.map(normalize);
            if (Array.isArray(data?.services)) return data.services.map(normalize);
            return [];
        } catch (error) {
            console.error('Erro ao carregar parceiros', error);
            return [];
        }
    }
};
