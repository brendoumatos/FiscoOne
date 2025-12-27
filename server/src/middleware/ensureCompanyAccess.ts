
import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from './auth'; // Assuming AuthRequest is defined in auth.ts
import { sendError } from '../utils/errorCatalog';

/**
 * Middleware de Segurança Multi-Tenant (RBAC Isolado)
 * 
 * Garante que o usuário autenticado tem permissão explícita para acessar 
 * os recursos da empresa solicitada (companyId).
 * 
 * Ordem de Validação (Strict):
 * 1. Autenticação (req.user existe)
 * 2. Existência da Empresa (companyId válido)
 * 3. Membro Direto (company_members)
 * 4. Acesso Delegado (Contabilidade Parceira)
 */
export const ensureCompanyAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Authentication required
        if (!req.user || !req.user.id) {
            return sendError(res, 'UNAUTHORIZED');
        }

        const tokenCompanyId = req.user.companyId;

        // Tenant must come exclusively from JWT
        const externalCompanyId = req.params?.companyId || (req.query as any)?.companyId || (req.body as any)?.companyId;
        if (externalCompanyId) {
            return sendError(res, 'TENANT_VIOLATION');
        }

        if (!tokenCompanyId || !/^[0-9a-fA-F-]{36}$/.test(tokenCompanyId)) {
            return sendError(res, 'TENANT_VIOLATION');
        }

        const userId = req.user.id;
        const companyId = tokenCompanyId;

        // Validate company exists
        const companyCheck = await pool.query(
            `SELECT TOP 1 1 FROM companies WHERE id = $1`,
            [companyId]
        );

        if (companyCheck.rowCount === 0) {
            return sendError(res, 'NOT_FOUND', { reason: 'Empresa não encontrada.' });
        }

        // Check direct membership
        const memberCheck = await pool.query(
            `SELECT TOP 1 role, status FROM company_members 
             WHERE user_id = $1 AND company_id = $2 AND status = 'ACTIVE'`,
            [userId, companyId]
        );

        if (memberCheck.rowCount && memberCheck.rowCount > 0) {
            const member = memberCheck.rows[0];
            // @ts-ignore
            req.context = {
                companyId,
                userId,
                accessType: 'COMPANY_MEMBER',
                role: member.role,
                accountingFirmId: null
            };
            return next();
        }

        // Check delegated accountant access
        const delegationCheck = await pool.query(
            `SELECT TOP 1
                    afm.role as accountant_role,
                    caa.accounting_firm_id
             FROM accounting_firm_members afm
             JOIN company_accounting_assignment caa ON afm.accounting_firm_id = caa.accounting_firm_id
             WHERE afm.user_id = $1 
                 AND caa.company_id = $2
                 AND afm.status = 'ACTIVE'
                 AND caa.active = 1`,
            [userId, companyId]
        );

        if (delegationCheck.rowCount && delegationCheck.rowCount > 0) {
            const delegation = delegationCheck.rows[0];
            // @ts-ignore
            req.context = {
                companyId,
                userId,
                accessType: 'ACCOUNTANT_DELEGATED',
                role: delegation.accountant_role,
                accountingFirmId: delegation.accounting_firm_id
            };
            return next();
        }

        console.warn(`[Security Audit] Unauthorized access attempt. User: ${userId}, Target: ${companyId}`);
        return res.status(403).json({ error: 'TENANT_VIOLATION' });
    } catch (error) {
        console.error('[Middleware Error] ensureCompanyAccess failed:', error);
        return sendError(res, 'INTERNAL_ERROR');
    }
};
