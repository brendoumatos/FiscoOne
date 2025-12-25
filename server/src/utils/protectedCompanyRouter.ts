import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ensureCompanyAccess } from '../middleware/ensureCompanyAccess';
import { subscriptionService } from '../services/subscription';

/**
 * Factory for company-scoped routers with mandatory auth + tenant validation.
 * Always merge params so parent routers can pass :companyId down.
 */
export const protectedCompanyRouter = () => {
    const router = Router({ mergeParams: true });

    // Authentication first
    router.use(authenticateToken);

    // Tenant / RBAC context. expects :companyId param in the route path.
    router.use('/:companyId', ensureCompanyAccess);

    // Enforce active subscription (blocks expired FREE on all actions)
    router.use('/:companyId', async (req, res, next) => {
        try {
            const { companyId } = req.params;
            const entitlement = await subscriptionService.checkEntitlement(companyId, 'GENERIC_ACCESS');
            if (!entitlement.allowed) {
                return res.status(403).json({ message: entitlement.reason || 'Plano expirado' });
            }
            next();
        } catch (error) {
            console.error('Subscription enforcement failed', error);
            return res.status(500).json({ message: 'Erro de verificação de plano' });
        }
    });

    return router;
};
