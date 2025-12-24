import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { subscriptionService } from '../services/subscription';

const router = Router();
router.use(authenticateToken);

router.get('/current', async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ message: 'No company context' });

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
            features
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Error' });
    }
});

router.post('/upgrade', async (req: AuthRequest, res: Response) => {
    try {
        const { planCode, cycle } = req.body;
        const companyId = req.user?.companyId;

        if (!companyId) return res.status(400).json({ message: 'No company context' });

        await subscriptionService.upgradeSubscription(companyId, planCode, cycle || 'MONTHLY');
        res.json({ message: 'Upgrade realizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error upgrading' });
    }
});

export default router;
