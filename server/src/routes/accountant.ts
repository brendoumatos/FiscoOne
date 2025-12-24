import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { accountantService } from '../services/accountant';

const router = Router();

// Public route to fetch branding by domain (for login page etc)
router.get('/branding/public', async (req, res) => {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ message: 'Domain required' });

    try {
        const branding = await accountantService.getBrandingByDomain(domain as string);
        res.json(branding || { isDefault: true });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching branding' });
    }
});

// Protected routes
router.use(authenticateToken);

// Update Branding
router.post('/branding', async (req: AuthRequest, res: Response) => {
    // In a real app, we need to know which Accountant Profile belongs to the User.
    // For now, we'll accept accountantId in body for MVP assuming User is Admin of that Accountant
    const { accountantId, primaryColor, secondaryColor, logoUrl, nameDisplay } = req.body;

    try {
        const settings = await accountantService.updateBranding(accountantId, { primaryColor, secondaryColor, logoUrl, nameDisplay });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating branding' });
    }
});

export default router;
