import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/dashboard';

const router = Router();

router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const stats = await dashboardService.getStats(companyId);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

export default router;
