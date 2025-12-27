import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001', // Backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('fiscoone_token') || sessionStorage.getItem('fiscoone_session_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 (Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('fiscoone_token');
            localStorage.removeItem('fiscoone_user');
            sessionStorage.removeItem('fiscoone_session_token');
            sessionStorage.removeItem('fiscoone_session_user');
            // Optional: Redirect to login or trigger global logout event
            // window.location.href = '/auth/login'; // Simple force redirect
        }
        if (error.response?.status === 403 && error.response?.data?.error === 'PLAN_BLOCKED') {
            try {
                const detail = error.response.data || {};
                const payload = {
                    error: 'PLAN_BLOCKED',
                    reason: detail.reason || detail.message || 'Ação bloqueada pelo plano.',
                    cta: detail.cta === 'REGULARIZE_PAYMENT' ? 'REGULARIZE_PAYMENT' : 'UPGRADE_PLAN'
                };
                window.dispatchEvent(new CustomEvent('plan-blocked', { detail: payload }));
            } catch (e) {
                // no-op
            }
        }
        if (error.response?.status === 403 && (error.response?.data?.error === 'DEMO_MODE' || error.response?.data?.error === 'DEMO_READ_ONLY')) {
            try {
                const detail = error.response.data;
                window.dispatchEvent(new CustomEvent('demo-readonly', { detail }));
            } catch (e) {
                // no-op
            }
        }
        return Promise.reject(error);
    }
);

export default api;
