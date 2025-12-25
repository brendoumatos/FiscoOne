import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { readinessService } from '../services/readiness';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';

const router = protectedCompanyRouter();

router.get('/:companyId/readiness', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    try {
        const data = await readinessService.getLatestReadiness(companyId);
        res.json(data);
    } catch (error) {
        console.error('Error fetching readiness:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/:companyId/readiness/recalculate', requireRole(PERMISSIONS.FISCAL_SETUP), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    try {
        const data = await readinessService.calculateReadiness(companyId);
        res.json(data);
    } catch (error) {
        console.error('Error calculating readiness:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
