import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { scoreService } from '../services/score';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// GET /score
router.get('/score', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;

    // Security check: simple check if user owns company typically done here or middleware
    // We'll trust the token + company association check in a real scenario

    try {
        const scoreData = await scoreService.getLatestScore(companyId);
        res.json(scoreData);
    } catch (error) {
        console.error('Error fetching score:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Internal Server Error' });
    }
});

// POST /score/recalculate
router.post('/score/recalculate', requireRole(PERMISSIONS.FISCAL_SETUP), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    try {
        const scoreData = await scoreService.calculateScore(companyId);
        res.json(scoreData);
    } catch (error) {
        console.error('Error recalculating score:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Internal Server Error' });
    }
});

export default router;
