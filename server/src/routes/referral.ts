import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { referralService } from '../services/referral';
import { creditService } from '../services/credit';
import { sendError } from '../utils/errorCatalog';

const router = Router();
router.use(authenticateToken);

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
    // Current company dashboard
    const companyId = req.user?.companyId;
    // Fallback?
    // In real app we trust req.user.companyId from token
    if (!companyId) return sendError(res, 'TENANT_VIOLATION', { reason: 'No company context' });

    try {
        const dashboard = await referralService.getDashboardData(companyId);
        const credits = await creditService.getAllCredits(companyId);

        res.json({ ...dashboard, credits });
    } catch (error) {
        console.error(error);
        sendError(res, 'INTERNAL_ERROR');
    }
});

// Simulate Applying a Referral Code (Dev/testing endpoint really)
// Or could be used during Onboarding if we had that flow
router.post('/apply/:code', async (req: AuthRequest, res: Response) => {
    const { code } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return sendError(res, 'TENANT_VIOLATION', { reason: 'No company context' });

    const success = await referralService.registerInvite(code, companyId);
    if (!success) {
        return sendError(res, 'VALIDATION_ERROR', { reason: 'Invalid or self-referral code' });
    }
    res.json({ message: 'Referral code applied' });
});

export default router;
