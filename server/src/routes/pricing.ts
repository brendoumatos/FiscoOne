import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { pricingEngine } from '../services/pricing_engine';

const router = Router();
router.use(authenticateToken);

router.get('/insight', async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ message: 'No company context' });

        const insight = await pricingEngine.getLatestRecommendation(companyId);
        res.json(insight || null);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pricing insight' });
    }
});

export default router;
