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
        const token = localStorage.getItem('fiscoone_token');
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
            // Optional: Redirect to login or trigger global logout event
            // window.location.href = '/auth/login'; // Simple force redirect
        }
        return Promise.reject(error);
    }
);

export default api;
