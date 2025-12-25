
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Definição de Tipos de Roles para segurança de tipagem
 */
export type CompanyRole = 'OWNER' | 'ADMIN' | 'FINANCE' | 'VIEWER' | 'COLLABORATOR';
export type AccountantRole = 'ACCOUNTANT' | 'SUPERVISOR';
export type AnyRole = CompanyRole | AccountantRole;

/**
 * Matriz de Permissões (Documentação Viva)
 * Mapeia Ações de Alto Nível para Roles permitidas.
 * Pode ser usada para gerar documentação ou validar lógica.
 */
export const PERMISSIONS = {
    INVOICE_READ: ['OWNER', 'ADMIN', 'FINANCE', 'VIEWER', 'ACCOUNTANT', 'SUPERVISOR'],
    INVOICE_WRITE: ['OWNER', 'ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPERVISOR'],
    INVOICE_CANCEL: ['OWNER', 'ADMIN', 'SUPERVISOR'], // Accountant comum não cancela (exemplo)

    USER_MANAGE: ['OWNER', 'ADMIN'], // Accountants não gerenciam usuários da empresa
    COMPANY_SETTINGS: ['OWNER', 'ADMIN'],

    FISCAL_SETUP: ['OWNER', 'ADMIN', 'FINANCE', 'SUPERVISOR', 'ACCOUNTANT'],

    AUDIT_LOG_VIEW: ['OWNER', 'SUPERVISOR'] // Apenas Donos e Supervisores auditam
};

/**
 * Middleware RBAC (Role-Based Access Control)
 * 
 * Verifica se o usuário (Membro ou Contador) possui uma das roles permitidas.
 * DEVE ser usado APÓS `ensureCompanyAccess`, pois depende de `req.context`.
 * 
 * @param allowedRoles Lista de Roles que podem acessar o recurso
 */
export const requireRole = (allowedRoles: AnyRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 1. Validar Pré-requisito (Contexto de Segurança)
            // @ts-ignore
            const securityContext = req.context;

            if (!securityContext || !securityContext.role) {
                console.error('[RBAC Error] requireRole called without security context. Did you forget ensureCompanyAccess?');
                return res.status(500).json({
                    message: 'Erro interno de segurança.',
                    code: 'SECURITY_CONTEXT_MISSING'
                });
            }

            const userRole = securityContext.role as AnyRole;
            const accessType = securityContext.accessType; // 'COMPANY_MEMBER' | 'ACCOUNTANT_DELEGATED'

            // 2. Verificar Permissão
            if (!allowedRoles.includes(userRole)) {
                console.warn(`[RBAC Block] User ${securityContext.userId} with role ${userRole} (${accessType}) tried to access protected resource.`);

                return res.status(403).json({
                    message: 'Acesso negado. Sua função não permite realizar esta ação.',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required_roles: allowedRoles,
                    current_role: userRole
                });
            }

            // 3. Acesso Permitido
            next();

        } catch (error) {
            console.error('[RBAC Error] Exception in role validation:', error);
            return res.status(500).json({ message: 'Erro de validação de permissões.' });
        }
    };
};
