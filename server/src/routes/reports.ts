import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// Download de relatórios/arquivos fiscais (placeholder)
router.get('/export', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    try {
        // Stub de retorno; substituir por arquivo/stream real
        return res.json({ message: 'Relatório pronto para download', url: '#TODO' });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        return sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao gerar relatório' });
    }
});

export default router;
