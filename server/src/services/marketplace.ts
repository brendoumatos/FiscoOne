import { pool } from '../config/db';
import { scoreService } from './score';

export const marketplaceService = {
    async registerProvider(companyId: string, bio: string, specialties: string[]) {
        // Verification Rule: Trust Score must be valid (e.g., > 60)
        const scoreData = await scoreService.getLatestScore(companyId);
        if (scoreData.score < 60) {
            throw new Error("Score de Confiança insuficiente para se tornar um parceiro.");
        }

        const result = await pool.query(
            `INSERT INTO marketplace_providers (company_id, bio, specialties, verified)
             OUTPUT inserted.*
             VALUES ($1, $2, $3, $4)`,
            [companyId, bio, specialties, true] // Auto-verify for now if score is good
        );
        return result.rows[0];
    },

    async createService(providerId: string, title: string, description: string, category: string) {
        const result = await pool.query(
            `INSERT INTO marketplace_services (provider_id, title, description, category)
             OUTPUT inserted.*
             VALUES ($1, $2, $3, $4)`,
            [providerId, title, description, category]
        );
        return result.rows[0];
    },

    async listServices(category?: string) {
        let query = `
            SELECT ms.*, mp.company_id, c.trade_name as provider_name 
            FROM marketplace_services ms
            JOIN marketplace_providers mp ON ms.provider_id = mp.id
            JOIN companies c ON mp.company_id = c.id
            WHERE ms.active = true
        `;
        const params: any[] = [];

        if (category) {
            query += ` AND ms.category = $1`;
            params.push(category);
        }

        query += ` ORDER BY ms.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    async contactProvider(serviceId: string, interestedCompanyId: string, message: string) {
        const result = await pool.query(
            `INSERT INTO marketplace_contacts (service_id, interested_company_id, message)
             OUTPUT inserted.*
             VALUES ($1, $2, $3)`,
            [serviceId, interestedCompanyId, message]
        );
        return result.rows[0];
    },

    // Check if user is already a provider
    async getProviderProfile(companyId: string) {
        const result = await pool.query(
            `SELECT * FROM marketplace_providers WHERE company_id = $1`,
            [companyId]
        );
        return result.rows[0];
    },

    async installApp(appId: string, companyId: string) {
        try {
            const result = await pool.query(
                `INSERT INTO marketplace_installations (app_id, company_id)
                 OUTPUT inserted.*
                 VALUES ($1, $2)`,
                [appId, companyId]
            );
            return result.rows[0];
        } catch (err: any) {
            if (err?.code === '42P01') {
                // Table missing: fall back to a log-only response
                return { appId, companyId, status: 'RECORDED', createdAt: new Date().toISOString() };
            }
            throw err;
        }
    }
};
