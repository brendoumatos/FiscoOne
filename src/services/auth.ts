
import { type AuthResponse, type LoginCredentials, type SignupData, type User, UserRole } from "@/types/auth";

// Mock database
const MOCK_USERS: User[] = [
    {
        id: "1",
        name: "Demo Client",
        email: "client@demo.com",
        role: UserRole.CLIENT,
        avatarUrl: "https://github.com/shadcn.png"
    },
    {
        id: "2",
        name: "Demo Accountant",
        email: "accountant@demo.com",
        role: UserRole.ACCOUNTANT,
        avatarUrl: "https://github.com/shadcn.png"
    }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface AuthService {
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    signup(data: SignupData): Promise<AuthResponse>;
    logout(): Promise<void>;
    getUser(): Promise<User | null>;
}

export const authService: AuthService = {
    async login({ email, password }: LoginCredentials): Promise<AuthResponse> {
        await delay(800); // Simulate network

        const user = MOCK_USERS.find(u => u.email === email);

        if (!user) {
            throw new Error("Invalid credentials");
        }

        if (password !== "demo123") { // Mock password check
            throw new Error("Invalid credentials");
        }

        return {
            user,
            token: "mock-jwt-token-" + Math.random().toString(36),
        };
    },

    async signup(data: SignupData): Promise<AuthResponse> {
        await delay(1000);

        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: data.email,
            name: data.name,
            role: data.role,
            companyId: undefined, // New user starts WITHOUT a company -> needs onboarding
        };

        return {
            user: newUser,
            token: "mock-jwt-token-" + Math.random().toString(36),
        };
    },

    async logout(): Promise<void> {
        await delay(300);
    },

    async getUser(): Promise<User | null> {
        await delay(500);
        // basic check for existing session could go here
        return MOCK_USERS[0];
    }
};
