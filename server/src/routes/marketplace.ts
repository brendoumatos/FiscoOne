import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { marketplaceService } from '../services/marketplace';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { auditLogService } from '../services/auditLog';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// List Services
router.get('/services', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { category } = req.query;
    try {
        const services = await marketplaceService.listServices(category as string);
        res.json(services);
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error listing services' });
    }
});

// Contract alias: GET /marketplace/apps -> list services/apps
router.get('/apps', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { category } = req.query;
    try {
        const services = await marketplaceService.listServices(category as string);
        res.json(services);
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error listing apps' });
    }
});

// Register as Provider
router.post('/providers', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { bio, specialties } = req.body;

    try {
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
        sendError(res, 'VALIDATION_ERROR', { reason: error.message || 'Error registering provider' });
    }
});

// Check Profile
router.get('/providers/me', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;

    try {
        const profile = await marketplaceService.getProviderProfile(companyId);
        res.json(profile || null);
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error fetching profile' });
    }
});

// Create Service Listing
router.post('/services', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    const { providerId, title, description, category } = req.body;
    try {
        const service = await marketplaceService.createService(providerId, title, description, category);

        await auditLogService.log({
            action: 'COMPANY_SETTINGS_UPDATED',
            entityType: 'COMPANY',
            entityId: req.user?.companyId,
            afterState: { serviceId: service.id, providerId, title, category },
            req
        });
        res.status(201).json(service);
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error creating service' });
    }
});

// POST /marketplace/apps/install - record installation request
router.post('/apps/install', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { appId } = req.body;
    if (!appId) return sendError(res, 'VALIDATION_ERROR', { reason: 'appId obrigatório' });

    try {
        const installation = await marketplaceService.installApp(appId, companyId);
        await auditLogService.log({
            action: 'MARKETPLACE_APP_INSTALLED',
            entityType: 'COMPANY',
            entityId: companyId,
            afterState: { appId },
            req
        });
        res.status(201).json(installation);
    } catch (error: any) {
        sendError(res, 'INTERNAL_ERROR', { reason: error?.message || 'Erro ao instalar app' });
    }
});

export default router;
