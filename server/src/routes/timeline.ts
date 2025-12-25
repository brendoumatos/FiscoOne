import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { timelineService } from '../services/timeline';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';

const router = protectedCompanyRouter();

router.get('/:companyId', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    const { type } = req.query;

    try {
        const events = await timelineService.getTimeline(companyId, type as string);
        res.json(events);
    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({ message: 'Error fetching timeline' });
    }
});

export default router;
