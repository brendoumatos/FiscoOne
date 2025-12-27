import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { accountantService } from '../services/accountant';
import { pool } from '../config/db';
import { sendError } from '../utils/errorCatalog';

const router = Router();

// Public route to fetch branding by domain (for login page etc)
router.get('/branding/public', async (req, res) => {
    const { domain } = req.query;
    if (!domain) return sendError(res, 'VALIDATION_ERROR', { reason: 'Domain required' });

    try {
        const branding = await accountantService.getBrandingByDomain(domain as string);
        res.json(branding || { isDefault: true });
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error fetching branding' });
    }
});

// Protected routes
router.use(authenticateToken);

// GET /accountants
router.get('/', async (_req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query('SELECT id, name, email, domain, created_at FROM accountants ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar contadores', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao listar contadores' });
    }
});

// POST /accountants
router.post('/', async (req: AuthRequest, res: Response) => {
    const { name, email, domain } = req.body;
    if (!name || !email) return sendError(res, 'VALIDATION_ERROR', { reason: 'name e email são obrigatórios' });

    try {
        const result = await pool.query(
            `INSERT INTO accountants (name, email, domain)
             OUTPUT inserted.*
             VALUES ($1, $2, $3)`,
            [name, email, domain]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Erro ao criar contador', error);
        sendError(res, 'VALIDATION_ERROR', { reason: error?.message || 'Erro ao criar contador' });
    }
});

// GET /accountants/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query('SELECT id, name, email, domain, created_at FROM accountants WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return sendError(res, 'NOT_FOUND', { reason: 'Contador não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao obter contador' });
    }
});

// PUT /accountants/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    const { name, email, domain } = req.body;
    try {
        const result = await pool.query(
            `UPDATE accountants
             SET name = COALESCE($2, name), email = COALESCE($3, email), domain = COALESCE($4, domain)
             OUTPUT inserted.*
             WHERE id = $1`,
            [req.params.id, name, email, domain]
        );
        if (result.rowCount === 0) return sendError(res, 'NOT_FOUND', { reason: 'Contador não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao atualizar contador' });
    }
});

// DELETE /accountants/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query('DELETE FROM accountants WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return sendError(res, 'NOT_FOUND', { reason: 'Contador não encontrado' });
        res.json({ message: 'Contador removido' });
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao remover contador' });
    }
});

// Update Branding
router.post('/branding', async (req: AuthRequest, res: Response) => {
    // In a real app, we need to know which Accountant Profile belongs to the User.
    // For now, we'll accept accountantId in body for MVP assuming User is Admin of that Accountant
    const { accountantId, primaryColor, secondaryColor, logoUrl, nameDisplay } = req.body;

    try {
        const settings = await accountantService.updateBranding(accountantId, { primaryColor, secondaryColor, logoUrl, nameDisplay });
        res.json(settings);
    } catch (error) {
        sendError(res, 'INTERNAL_ERROR', { reason: 'Error updating branding' });
    }
});

export default router;
