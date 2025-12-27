import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { timelineService } from '../services/timeline';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

router.get('/', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { type, entity } = req.query;

    try {
        const filter = (entity as string) || (type as string);
        const events = await timelineService.getTimeline(companyId, filter);
        res.json(events);
    } catch (error) {
        console.error('Error fetching timeline:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error fetching timeline' });
    }
});

export default router;
