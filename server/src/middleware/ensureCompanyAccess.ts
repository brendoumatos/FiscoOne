
import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from './auth'; // Assuming AuthRequest is defined in auth.ts

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
        // Step 1: Ensure req.user exists (Authentication)
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'Acesso negado. Usuário não autenticado.',
                code: 'UNAUTHENTICATED'
            });
        }

        const userId = req.user.id;
        const companyId = req.params.companyId;

        // Validation: CompanyId Parameter
        if (!companyId || !/^[0-9a-fA-F-]{36}$/.test(companyId)) {
            return res.status(400).json({
                message: 'ID da empresa inválido ou ausente.',
                code: 'INVALID_COMPANY_ID'
            });
        }

        // Step 2: Validate Company Existence
        // Otimização: SELECT 1 é mais rápido do que buscar dados
        const companyCheck = await pool.query(
            `SELECT 1 FROM companies WHERE id = $1 LIMIT 1`,
            [companyId]
        );

        if (companyCheck.rowCount === 0) {
            return res.status(404).json({
                message: 'Empresa não encontrada.',
                code: 'COMPANY_NOT_FOUND'
            });
        }

        // Step 3: Check Direct Membership (Company Members)
        const memberCheck = await pool.query(
            `SELECT role, status FROM company_members 
             WHERE user_id = $1 AND company_id = $2 AND status = 'ACTIVE'
             LIMIT 1`,
            [userId, companyId]
        );

        if (memberCheck.rowCount && memberCheck.rowCount > 0) {
            const member = memberCheck.rows[0];

            // Enrich Request Context
            // @ts-ignore - Estendendo o objeto request dinamicamente
            req.context = {
                companyId,
                userId,
                accessType: 'COMPANY_MEMBER',
                role: member.role,
                accountingFirmId: null
            };

            return next();
        }

        // Step 4: Delegated Access (Partner Accounting Firm)
        // Lógica: Usuário é contador ATIVO de uma Firma que tem contrato ATIVO com a Empresa
        const delegationCheck = await pool.query(
            `SELECT 
                afm.role as accountant_role,
                caa.accounting_firm_id
             FROM accounting_firm_members afm
             JOIN company_accounting_assignment caa ON afm.accounting_firm_id = caa.accounting_firm_id
             WHERE afm.user_id = $1 
               AND caa.company_id = $2
               AND afm.status = 'ACTIVE'
               AND caa.active = true
             LIMIT 1`,
            [userId, companyId]
        );

        if (delegationCheck.rowCount && delegationCheck.rowCount > 0) {
            const delegation = delegationCheck.rows[0];

            // Enrich Request Context
            // @ts-ignore
            req.context = {
                companyId,
                userId,
                accessType: 'ACCOUNTANT_DELEGATED',
                role: delegation.accountant_role, // Ex: ACCOUNTANT, SUPERVISOR
                accountingFirmId: delegation.accounting_firm_id
            };

            return next();
        }

        // Step 5: Forbidden (Fallthrough)
        // Se chegou aqui, não é membro nem contador delegado.
        console.warn(`[Security Audit] Unauthorized access attempt. User: ${userId}, Target: ${companyId}`);

        return res.status(403).json({
            message: 'Acesso negado. Você não tem permissão para visualizar esta empresa.',
            code: 'FORBIDDEN_ACCESS'
        });

    } catch (error) {
        console.error('[Middleware Error] ensureCompanyAccess failed:', error);
        return res.status(500).json({
            message: 'Erro interno de verificação de segurança.',
            code: 'INTERNAL_SECURITY_ERROR'
        });
    }
};
