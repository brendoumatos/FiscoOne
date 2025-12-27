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
    async getTimeline(entity?: string): Promise<TimelineEvent[]> {
        const params = entity ? { entity } : {};
        const response = await api.get('/timeline', { params });
        return response.data;
    }
};
