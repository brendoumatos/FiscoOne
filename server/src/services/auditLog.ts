
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export type AuditAction =
    | 'INVOICE_ISSUED'
    | 'INVOICE_CANCELLED'
    | 'USER_ADDED'
    | 'USER_REMOVED'
    | 'COMPANY_SETTINGS_UPDATED'
    | 'ROLE_CHANGED'
    | 'SUBSCRIPTION_CHANGED';

export type EntityType =
    | 'INVOICE'
    | 'USER'
    | 'COMPANY'
    | 'SUBSCRIPTION';

export interface AuditEvent {
    action: AuditAction;
    entityType: EntityType;
    entityId?: string;
    beforeState?: any;
    afterState?: any;
    req: AuthRequest; // Context source
}

export const auditLogService = {
    /**
     * Records a secure audit log.
     * Extracts actor details strictly from the authenticated request context.
     */
    async log(event: AuditEvent) {
        const { req, action, entityType, entityId, beforeState, afterState } = event;

        // Extract Actor Data from Secure Context
        const context = (req as any).context || {};
        const user = req.user as any;

        if (!user || !user.id || !context.companyId) {
            throw new Error('[Audit Log] Missing user/company context');
        }

        const actorType = context.accessType === 'ACCOUNTANT_DELEGATED' ? 'ACCOUNTANT' : 'COMPANY_USER';
        const accountingFirmId = context.accountingFirmId || null;

        // IP & User Agent
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent');

        await pool.query(
            `INSERT INTO audit_logs 
            (company_id, actor_user_id, actor_type, actor_accounting_firm_id, 
             action, entity_type, entity_id, before_state, after_state, 
             ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                context.companyId,
                user.id,
                actorType,
                accountingFirmId,
                action,
                entityType,
                entityId,
                beforeState ? JSON.stringify(beforeState) : null,
                afterState ? JSON.stringify(afterState) : null,
                ipAddress,
                userAgent
            ]
        );
    },

    /**
     * Retrieve logs for a specific company (Audit View)
     */
    async getLogs(companyId: string, limit: number = 100) {
        const result = await pool.query(
            `SELECT al.*, u.full_name as actor_name, u.email as actor_email
             FROM audit_logs al
             JOIN users u ON al.actor_user_id = u.id
             WHERE al.company_id = $1
             ORDER BY al.created_at DESC
             LIMIT $2`,
            [companyId, limit]
        );
        return result.rows;
    }
};
