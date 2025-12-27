import api from './api';
import type { LoginCredentials, SignupData, User } from '../types/auth';

export const authService = {
    async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    async register(data: SignupData): Promise<{ user: User; token: string }> {
        const response = await api.post('/auth/signup', {
            ...data,
            role: data.role || 'CLIENT' // allow explicit role selection, default CLIENT
        });
        return response.data;
    },

    async logout(): Promise<void> {
        localStorage.removeItem('fiscoone_token');
        localStorage.removeItem('fiscoone_user');
    },

    setSession(token: string, user: User) {
        localStorage.setItem('fiscoone_token', token);
        localStorage.setItem('fiscoone_user', JSON.stringify(user));
    },

    getUser(): User | null {
        const userStr = localStorage.getItem('fiscoone_user');
        return userStr ? JSON.parse(userStr) : null;
    }
};
