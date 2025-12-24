import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { timelineService } from '../services/timeline';

const router = Router();
router.use(authenticateToken);

router.get('/:companyId', async (req: AuthRequest, res: Response) => {
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
