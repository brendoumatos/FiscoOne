import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { readinessService } from '../services/readiness';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

router.get('/readiness', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    try {
        const data = await readinessService.getLatestReadiness(companyId);
        res.json(data);
    } catch (error) {
        console.error('Error fetching readiness:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Internal Server Error' });
    }
});

router.post('/readiness/recalculate', requireRole(PERMISSIONS.FISCAL_SETUP), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    try {
        const data = await readinessService.calculateReadiness(companyId);
        res.json(data);
    } catch (error) {
        console.error('Error calculating readiness:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Internal Server Error' });
    }
});

export default router;
