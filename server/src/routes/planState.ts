import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { planStateService } from '../services/planState';
import { sendError } from '../utils/errorCatalog';

const cache = new Map<string, { ts: number; data: any }>();
const TTL_MS = 30 * 1000;

const router = protectedCompanyRouter();

router.get('/plan-state', async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const now = Date.now();
        const cached = cache.get(companyId);
        if (cached && now - cached.ts < TTL_MS) {
            return res.json(cached.data);
        }

        const planState = await planStateService.getPlanState(companyId);
        const response = {
            plan: planState.plan,
            status: planState.status,
            usage: planState.usage,
            cta: planState.cta,
            reason: planState.reason,
            expiration: planState.expiration,
            // legacy fields to avoid breaking existing clients
            planCode: planState.planCode || planState.plan.code,
            limits: planState.limits
        };
        cache.set(companyId, { ts: now, data: response });
        res.json(response);
    } catch (error: any) {
        console.error('Plan state error', error);
        sendError(res, 'INTERNAL_ERROR', { reason: error?.message || 'Unexpected error' });
    }
});

export default router;
