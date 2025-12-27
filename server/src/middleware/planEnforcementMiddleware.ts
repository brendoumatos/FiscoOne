import { NextFunction, Request, Response } from 'express';
import { subscriptionService } from '../services/subscription';
import { sendError } from '../utils/errorCatalog';

const isTimelineRoute = (req: Request): boolean => {
    const base = (req.baseUrl || '').toLowerCase();
    const original = (req.originalUrl || '').toLowerCase();
    return base.startsWith('/timeline') || original.includes('/timeline');
};

const isPlanStateRoute = (req: Request): boolean => {
    const base = (req.baseUrl || '').toLowerCase();
    const original = (req.originalUrl || '').toLowerCase();
    return base.includes('plan-state') || original.includes('plan-state');
};

interface PlanEnforcementOptions {
    allowTimelineWhenBlocked?: boolean;
}

/**
 * Centralized plan enforcement middleware.
 * Blocks protected actions when the plan state is BLOCKED or GRACE, except timeline routes.
 */
export const planEnforcementMiddleware = (options: PlanEnforcementOptions = { allowTimelineWhenBlocked: true }) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = (req as any).user?.companyId;
            if (!companyId) {
                return res.status(401).json({ error: 'UNAUTHORIZED', reason: 'Missing company context', cta: null });
            }

            const planState = await subscriptionService.getPlanState(companyId);
            const timelineAllowed = options.allowTimelineWhenBlocked && isTimelineRoute(req);
            const planStateAllowed = isPlanStateRoute(req);

            if ((planState.status === 'BLOCKED' || planState.status === 'GRACE') && !timelineAllowed && !planStateAllowed) {
                return sendError(res, 'PLAN_BLOCKED', {
                    reason: planState.reason || `Plan ${planState.status}`,
                    cta: planState.cta || 'UPGRADE_PLAN'
                });
            }

            return next();
        } catch (error) {
            console.error('Plan enforcement failed', error);
            return sendError(res, 'INTERNAL_ERROR', { reason: 'Erro de verificação de plano' });
        }
    };
};