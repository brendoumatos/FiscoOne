import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ensureCompanyAccess } from '../middleware/ensureCompanyAccess';
import { planEnforcementMiddleware } from '../middleware/planEnforcementMiddleware';
import { demoReadOnly } from '../middleware/demoReadOnly';

/**
 * Factory for company-scoped routers with mandatory auth + tenant validation.
 * Always merge params so parent routers can pass :companyId down.
 */
export const protectedCompanyRouter = () => {
    const router = Router();

    // Authentication first
    router.use(authenticateToken);

    // Tenant isolation (no companyId params/query/body allowed; use JWT only)
    router.use(ensureCompanyAccess);

    // Demo tenant is read-only in DEMO_MODE
    router.use(demoReadOnly);

    // Centralized plan enforcement (allows timeline even when blocked)
    router.use(planEnforcementMiddleware({ allowTimelineWhenBlocked: true }));

    return router;
};
