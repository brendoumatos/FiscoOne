import api from './api';

export interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    description?: string;
    metadata: any;
    createdAt: string;
}

export const timelineService = {
    async getTimeline(companyId: string, type?: string): Promise<TimelineEvent[]> {
        const params = type ? { type } : {};
        const response = await api.get(`/timeline/${companyId}`, { params });
        return response.data;
    }
};
