import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { marketplaceService } from '../services/marketplace';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { auditLogService } from '../services/auditLog';

const router = protectedCompanyRouter();

// List Services
router.get('/:companyId/services', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { category } = req.query;
    try {
        const services = await marketplaceService.listServices(category as string);
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Error listing services' });
    }
});

// Register as Provider
router.post('/:companyId/providers', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    const { bio, specialties } = req.body;

    try {
        const entitlement = await import('../services/subscription').then(m => m.subscriptionService.checkEntitlement(companyId, 'MARKETPLACE_MUTATION'));
        if (!(await entitlement).allowed) {
            return res.status(403).json({ message: (await entitlement).reason || 'Plano não permite esta ação' });
        }

        const provider = await marketplaceService.registerProvider(companyId, bio, specialties);

        await auditLogService.log({
            action: 'COMPANY_SETTINGS_UPDATED',
            entityType: 'COMPANY',
            entityId: companyId,
            afterState: { providerId: provider.id, bio, specialties },
            req
        });
        res.status(201).json(provider);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error registering provider' });
    }
});

// Check Profile
router.get('/:companyId/providers/me', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;

    try {
        const profile = await marketplaceService.getProviderProfile(companyId);
        res.json(profile || null);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Create Service Listing
router.post('/:companyId/services', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    const { providerId, title, description, category } = req.body;
    try {
        const entitlement = await import('../services/subscription').then(m => m.subscriptionService.checkEntitlement(req.params.companyId, 'MARKETPLACE_MUTATION'));
        if (!(await entitlement).allowed) {
            return res.status(403).json({ message: (await entitlement).reason || 'Plano não permite esta ação' });
        }

        const service = await marketplaceService.createService(providerId, title, description, category);

        await auditLogService.log({
            action: 'COMPANY_SETTINGS_UPDATED',
            entityType: 'COMPANY',
            entityId: req.params.companyId,
            afterState: { serviceId: service.id, providerId, title, category },
            req
        });
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error creating service' });
    }
});

export default router;
