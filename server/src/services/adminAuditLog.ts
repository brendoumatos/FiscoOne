import { Request } from 'express';
import { pool } from '../config/db';

interface AdminAuditLogEntry {
    adminId: string;
    action: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    impersonationSessionId?: string;
}

/**
 * Persists admin audit logs for platform actions.
 */
export const adminAuditLogService = {
    async log(entry: AdminAuditLogEntry, req?: Request) {
        const client = await pool.connect();
        try {
            const ip = entry.ip || (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req?.socket.remoteAddress || '';
            const ua = entry.userAgent || req?.headers['user-agent'] || '';
            await client.query(
                `INSERT INTO admin_audit_logs (admin_id, action, details, ip_address, user_agent, impersonation_session_id, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, SYSUTCDATETIME())`,
                [entry.adminId, entry.action, JSON.stringify(entry.details || {}), ip, ua, entry.impersonationSessionId || null]
            );
        } catch (err) {
            console.error('[AdminAuditLog] failed to persist log', err);
        } finally {
            client.release();
        }
    }
};
