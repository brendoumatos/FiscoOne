import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { subscriptionService } from '../services/subscription';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { auditLogService } from '../services/auditLog';

const router = protectedCompanyRouter();

router.get('/:companyId/current', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;

        const sub = await subscriptionService.getSubscription(companyId);
        if (!sub) return res.json(null); // Or default

        // Helper to get features and usage
        const features = await subscriptionService.getFeatures(sub.plan_id);
        const { usageService } = await import('../services/usage');
        const invoicesUsed = await usageService.getCurrentUsage(companyId, 'INVOICES_ISSUED');

        res.json({
            plan: {
                name: sub.plan_name,
                code: sub.plan_code,
                limit: sub.invoice_limit,
                cycle: sub.renewal_cycle // Added cycle
            },
            usage: {
                invoices: invoicesUsed
            },
            features,
            createdAt: sub.start_date || sub.created_at,
            expirationDate: sub.expiration_date || null,
            seatLimit: sub.seat_limit,
            currentCollaborators: sub.current_collaborators
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Error' });
    }
});

router.post('/:companyId/upgrade', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    try {
        const { planCode, cycle } = req.body;
        const { companyId } = req.params;

        await subscriptionService.upgradeSubscription(companyId, planCode, cycle || 'MONTHLY');

        await auditLogService.log({
            action: 'SUBSCRIPTION_CHANGED',
            entityType: 'SUBSCRIPTION',
            entityId: companyId,
            beforeState: null,
            afterState: { planCode, cycle },
            req
        });
        res.json({ message: 'Upgrade realizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error upgrading' });
    }
});

export default router;
