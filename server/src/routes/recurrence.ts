import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { subscriptionService } from '../services/subscription';
import { auditLogService } from '../services/auditLog';

const router = protectedCompanyRouter();

// Cria ou agenda recorrência de faturamento (placeholder lógico)
router.post('/:companyId/schedules', requireRole(PERMISSIONS.INVOICE_WRITE), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    try {
        const entitlement = await subscriptionService.checkEntitlement(companyId, 'ENABLE_RECURRENCE', { req });
        if (!entitlement.allowed) {
            return res.status(403).json({
                message: entitlement.reason || 'Recorrência não disponível neste plano.',
                code: 'ENTITLEMENT_DENIED',
                upgrade_suggestion: entitlement.upgrade_suggestion
            });
        }

        // Aqui integrar lógica real de criação da recorrência
        const payload = req.body;

        await auditLogService.log({
            action: 'INVOICE_ISSUED', // reutilizado para rastrear criação de recorrência
            entityType: 'INVOICE',
            entityId: undefined,
            beforeState: null,
            afterState: { recurrence: true, payload },
            req
        });

        return res.status(201).json({ message: 'Recorrência agendada', recurrence: payload });
    } catch (error) {
        console.error('Erro em recorrência:', error);
        return res.status(500).json({ message: 'Erro ao criar recorrência' });
    }
});

// Lista recorrências existentes (stub)
router.get('/:companyId/schedules', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    try {
        const entitlement = await subscriptionService.checkEntitlement(companyId, 'ENABLE_RECURRENCE', { req });
        if (!entitlement.allowed) {
            return res.status(403).json({
                message: entitlement.reason || 'Recorrência não disponível neste plano.',
                code: 'ENTITLEMENT_DENIED',
                upgrade_suggestion: entitlement.upgrade_suggestion
            });
        }

        return res.json({ items: [] });
    } catch (error) {
        console.error('Erro ao listar recorrências:', error);
        return res.status(500).json({ message: 'Erro interno' });
    }
});

export default router;
