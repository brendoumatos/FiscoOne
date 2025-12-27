import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { dashboardService } from '../services/dashboard';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

router.get('/summary', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const stats = await dashboardService.getStats(companyId);
        res.json(stats);
    } catch (error) {
        console.error(error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error fetching dashboard stats' });
    }
});

export default router;
