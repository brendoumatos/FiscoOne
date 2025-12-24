import { pool } from '../config/db';

export interface ServiceCredit {
    id: string;
    type: 'EXTRA_INVOICES' | 'PREMIUM_DAYS';
    remaining: number;
    validUntil: Date;
}

export const creditService = {
    async grantCredit(companyId: string, type: 'EXTRA_INVOICES' | 'PREMIUM_DAYS', value: number, daysValid: number = 180, source: string = 'REFERRAL') {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + daysValid);

        await pool.query(
            `INSERT INTO service_credits (company_id, credit_type, credit_value, remaining_value, valid_until, source)
             VALUES ($1, $2, $3, $3, $4, $5)`,
            [companyId, type, value, validUntil, source]
        );
    },

    async getActiveCredits(companyId: string, type: 'EXTRA_INVOICES') {
        const result = await pool.query(
            `SELECT * FROM service_credits 
             WHERE company_id = $1 AND credit_type = $2 AND remaining_value > 0 AND (valid_until IS NULL OR valid_until > NOW())
             ORDER BY valid_until ASC`, // Use oldest expiry first
            [companyId, type]
        );
        return result.rows;
    },

    async consumeCredit(companyId: string, type: 'EXTRA_INVOICES', amount: number = 1): Promise<boolean> {
        const credits = await this.getActiveCredits(companyId, type);

        let remainingToConsume = amount;

        for (const credit of credits) {
            if (remainingToConsume <= 0) break;

            const take = Math.min(credit.remaining_value, remainingToConsume);

            await pool.query(
                `UPDATE service_credits SET remaining_value = remaining_value - $1 WHERE id = $2`,
                [take, credit.id]
            );

            await pool.query(
                `INSERT INTO credit_usage_logs (service_credit_id, amount_used, description) VALUES ($1, $2, $3)`,
                [credit.id, take, `Consumed for operation`]
            );

            remainingToConsume -= take;
        }

        return remainingToConsume === 0;
    },

    async getAllCredits(companyId: string) {
        const result = await pool.query(
            `SELECT * FROM service_credits WHERE company_id = $1 ORDER BY created_at DESC`,
            [companyId]
        );
        return result.rows;
    }
};
