import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { dashboardService } from '../services/dashboard';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { subscriptionService } from '../services/subscription';

const router = protectedCompanyRouter();

router.get('/:companyId/stats', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;

        const entitlement = await subscriptionService.checkEntitlement(companyId, 'ACCESS_DASHBOARD', { req });
        if (!entitlement.allowed) {
            return res.status(403).json({
                message: entitlement.reason || 'Dashboard não habilitado para este plano.',
                code: 'ENTITLEMENT_DENIED',
                upgrade_suggestion: entitlement.upgrade_suggestion
            });
        }
        const stats = await dashboardService.getStats(companyId);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

export default router;
