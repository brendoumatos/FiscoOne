import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { pricingEngine } from '../services/pricing_engine';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';

const router = protectedCompanyRouter();

router.get('/:companyId/insight', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;

        const insight = await pricingEngine.getLatestRecommendation(companyId);
        res.json(insight || null);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pricing insight' });
    }
});

export default router;
