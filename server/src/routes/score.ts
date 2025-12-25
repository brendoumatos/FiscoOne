import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { scoreService } from '../services/score';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';

const router = protectedCompanyRouter();

// GET /companies/:id/score
router.get('/:companyId/score', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;

    // Security check: simple check if user owns company typically done here or middleware
    // We'll trust the token + company association check in a real scenario

    try {
        const scoreData = await scoreService.getLatestScore(companyId);
        res.json(scoreData);
    } catch (error) {
        console.error('Error fetching score:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /companies/:id/score/recalculate
router.post('/:companyId/score/recalculate', requireRole(PERMISSIONS.FISCAL_SETUP), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    try {
        const scoreData = await scoreService.calculateScore(companyId);
        res.json(scoreData);
    } catch (error) {
        console.error('Error recalculating score:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
