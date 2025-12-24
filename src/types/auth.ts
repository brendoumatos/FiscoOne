
export enum UserRole {
    CLIENT = 'CLIENT',
    ACCOUNTANT = 'ACCOUNTANT',
    ADMIN = 'ADMIN'
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    companyId?: string; // Links user to their company
    token?: string; // Optional for mock purposes usually it's separate
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface AuthResponse {
    user: User;
    token: string;
}
