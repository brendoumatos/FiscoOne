import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'admin-test-secret' : undefined);
const IMPERSONATION_JWT_SECRET = process.env.IMPERSONATION_JWT_SECRET || ADMIN_JWT_SECRET;

if (!IMPERSONATION_JWT_SECRET) {
    throw new Error('IMPERSONATION_JWT_SECRET must be set');
}

export interface ImpersonationStartInput {
    adminId: string;
    companyId: string;
    userId?: string | null;
    reason?: string;
    userAgent?: string;
    ip?: string;
    expiresInMinutes?: number;
}

export const impersonationService = {
    async start(input: ImpersonationStartInput) {
        const client = await pool.connect();
        const expiresAt = new Date(Date.now() + (input.expiresInMinutes || 15) * 60 * 1000);
        try {
            await client.query('BEGIN');
            const sessionRes = await client.query(
                `INSERT INTO impersonation_sessions (admin_id, company_id, user_id, reason, user_agent, ip_address, expires_at)
                 OUTPUT inserted.id
                 VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
                [input.adminId, input.companyId, input.userId || null, input.reason || null, input.userAgent || '', input.ip || '', expiresAt.toISOString()]
            );

            const sessionId = sessionRes.rows[0].id;
            const token = jwt.sign(
                {
                    impersonated: true,
                    original_admin_id: input.adminId,
                    company_id: input.companyId,
                    user_id: input.userId || null,
                    scope: 'tenant',
                    session_id: sessionId
                },
                IMPERSONATION_JWT_SECRET!,
                { expiresIn: `${input.expiresInMinutes || 15}m` }
            );

            await client.query('COMMIT');
            return { token, sessionId, expiresAt };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async stop(sessionId: string, adminId: string) {
        const res = await pool.query(
            `UPDATE impersonation_sessions
             SET active = 0, terminated_at = SYSUTCDATETIME()
             WHERE id = $1 AND admin_id = $2` ,
            [sessionId, adminId]
        );
        return res.rowCount > 0;
    }
};
