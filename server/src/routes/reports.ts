import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { subscriptionService } from '../services/subscription';

const router = protectedCompanyRouter();

// Download de relatórios/arquivos fiscais (placeholder)
router.get('/:companyId/export', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    try {
        const entitlement = await subscriptionService.checkEntitlement(companyId, 'DOWNLOAD_REPORTS', { req });
        if (!entitlement.allowed) {
            return res.status(403).json({
                message: entitlement.reason || 'Relatórios avançados não disponíveis neste plano.',
                code: 'ENTITLEMENT_DENIED',
                upgrade_suggestion: entitlement.upgrade_suggestion
            });
        }

        // Stub de retorno; substituir por arquivo/stream real
        return res.json({ message: 'Relatório pronto para download', url: '#TODO' });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        return res.status(500).json({ message: 'Erro ao gerar relatório' });
    }
});

export default router;
