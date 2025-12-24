import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { readinessService } from '../services/readiness';

const router = Router();

router.use(authenticateToken);

router.get('/:companyId/readiness', async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    try {
        const data = await readinessService.getLatestReadiness(companyId);
        res.json(data);
    } catch (error) {
        console.error('Error fetching readiness:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/:companyId/readiness/recalculate', async (req: AuthRequest, res: Response) => {
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
