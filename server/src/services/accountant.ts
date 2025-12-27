import { pool } from '../config/db';

export const accountantService = {
    // 1. Get Branding by Domain (Public/Semi-public for frontend init)
    async getBrandingByDomain(domain: string) {
        const result = await pool.query(
            `SELECT b.*, a.domain 
             FROM branding_settings b
             JOIN accountants a ON b.accountant_id = a.id
             WHERE a.domain = $1`,
            [domain]
        );
        return result.rows[0];
    },

    // 2. Get Branding by Accountant ID
    async getBranding(accountantId: string) {
        const result = await pool.query(
            `SELECT * FROM branding_settings WHERE accountant_id = $1`,
            [accountantId]
        );
        return result.rows[0];
    },

    // 3. Update Branding
    async updateBranding(accountantId: string, settings: { primaryColor: string; secondaryColor: string; logoUrl: string; nameDisplay: string }) {
        // Upsert logic
        const existing = await this.getBranding(accountantId);

        if (existing) {
            const result = await pool.query(
                `UPDATE branding_settings 
                 SET primary_color = $1, secondary_color = $2, logo_url = $3, company_name_display = $4
                 WHERE accountant_id = $5 
                 OUTPUT inserted.*`,
                [settings.primaryColor, settings.secondaryColor, settings.logoUrl, settings.nameDisplay, accountantId]
            );
            return result.rows[0];
        } else {
            const result = await pool.query(
                `INSERT INTO branding_settings (accountant_id, primary_color, secondary_color, logo_url, company_name_display)
                 OUTPUT inserted.*
                 VALUES ($1, $2, $3, $4, $5)`,
                [accountantId, settings.primaryColor, settings.secondaryColor, settings.logoUrl, settings.nameDisplay]
            );
            return result.rows[0];
        }
    },

    // 4. Register Accountant (Admin feature usually)
    async createAccountant(name: string, email: string, domain: string) {
        const result = await pool.query(
            `INSERT INTO accountants (name, email, domain) 
             OUTPUT inserted.*
             VALUES ($1, $2, $3)`,
            [name, email, domain]
        );
        return result.rows[0];
    },

    // 5. Link Company to Accountant
    async linkClient(accountantId: string, companyId: string) {
        await pool.query(
            `IF NOT EXISTS (SELECT 1 FROM accountant_clients WHERE accountant_id = $1 AND company_id = $2)
             BEGIN
                 INSERT INTO accountant_clients (accountant_id, company_id) VALUES ($1, $2)
             END`,
            [accountantId, companyId]
        );
    }
};
