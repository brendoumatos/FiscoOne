import api from './api';

export interface ReferralStat {
    status: 'PENDING' | 'ACTIVATED' | 'REWARDED';
    count: string; // count(*) comes as string from pg
}

export interface Credit {
    id: string;
    credit_type: string;
    remaining_value: number;
    valid_until: string;
    source: string;
}

export interface ReferralDashboardData {
    code: string;
    referralLink: string;
    stats: ReferralStat[];
    credits: Credit[];
}

export const referralService = {
    async getDashboard(): Promise<ReferralDashboardData> {
        const response = await api.get('/referral/dashboard');
        return response.data;
    },

    async applyCode(code: string) {
        return api.post(`/referral/apply/${code}`);
    }
};
