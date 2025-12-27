import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { subscriptionService } from '../services/subscription';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { auditLogService } from '../services/auditLog';
import { pool } from '../config/db';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// GET /billing/current -> reuse subscription summary
router.get('/current', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const sub = await subscriptionService.getSubscription(companyId);
        if (!sub) return res.json(null);

        const planMeta = await subscriptionService.getPlanMeta(sub.plan_code);
        const features = await subscriptionService.getFeatures(sub.plan_id);
        const { usageService } = await import('../services/usage');
        const invoicesUsed = await usageService.getCurrentUsage(companyId, 'INVOICES');

        res.json({
            plan: {
                name: sub.plan_name,
                code: sub.plan_code,
                limit: null,
                cycle: sub.renewal_cycle,
                price: planMeta?.price_monthly ?? null
            },
            usage: {
                invoices: invoicesUsed
            },
            features,
            createdAt: sub.start_date || sub.created_at,
            expirationDate: sub.expiration_date || null
        });
    } catch (error) {
        console.error('Erro ao carregar billing', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao carregar billing' });
    }
});

// POST /billing/upgrade
router.post('/upgrade', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    const { planCode, cycle } = req.body;
    const companyId = req.user?.companyId;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await subscriptionService.upgradeSubscription(companyId, planCode, cycle || 'MONTHLY', client);

        await auditLogService.log({
            action: 'SUBSCRIPTION_CHANGED',
            entityType: 'SUBSCRIPTION',
            entityId: companyId,
            afterState: { planCode, cycle },
            req
        });
        await client.query('COMMIT');
        res.json({ message: 'Upgrade realizado com sucesso!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Upgrade billing error', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao atualizar plano' });
    } finally {
        client.release();
    }
});

export default router;
