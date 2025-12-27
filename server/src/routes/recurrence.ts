import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { auditLogService } from '../services/auditLog';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// Cria ou agenda recorrência de faturamento (placeholder lógico)
router.post('/schedules', requireRole(PERMISSIONS.INVOICE_WRITE), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    try {
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
        return sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao criar recorrência' });
    }
});

// Lista recorrências existentes (stub)
router.get('/schedules', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    try {
        return res.json({ items: [] });
    } catch (error) {
        console.error('Erro ao listar recorrências:', error);
        return sendError(res, 'INTERNAL_ERROR', { reason: 'Erro interno' });
    }
});

export default router;
