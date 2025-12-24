import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { marketplaceService } from '../services/marketplace';

const router = Router();
router.use(authenticateToken);

// List Services
router.get('/services', async (req: AuthRequest, res: Response) => {
    const { category } = req.query;
    try {
        const services = await marketplaceService.listServices(category as string);
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Error listing services' });
    }
});

// Register as Provider
router.post('/providers', async (req: AuthRequest, res: Response) => {
    const { companyId } = req.query; // Assuming context passed via query or we deduce from user
    // Ideally we get companyId from request body or look up user's companies.
    // Let's assume passed in body for explicit action
    const { companyId: bodyCompanyId, bio, specialties } = req.body;

    try {
        const provider = await marketplaceService.registerProvider(bodyCompanyId, bio, specialties);
        res.status(201).json(provider);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error registering provider' });
    }
});

// Check Profile
router.get('/providers/me', async (req: AuthRequest, res: Response) => {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ message: 'CompanyID required' });

    try {
        const profile = await marketplaceService.getProviderProfile(companyId as string);
        res.json(profile || null);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Create Service Listing
router.post('/services', async (req: AuthRequest, res: Response) => {
    const { providerId, title, description, category } = req.body;
    try {
        const service = await marketplaceService.createService(providerId, title, description, category);
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error creating service' });
    }
});

export default router;
