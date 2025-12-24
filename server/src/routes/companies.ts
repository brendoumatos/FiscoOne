import { Router, Response } from 'express';
import { connectToDatabase } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware: All company routes require login
router.use(authenticateToken);

// GET /companies - List user's companies
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const pool = await connectToDatabase();

        const result = await pool.query(
            `SELECT * FROM companies 
             WHERE owner_id = $1 
             AND active = true
             ORDER BY created_at DESC`,
            [userId]
        );

        // Parse JSON fields
        const companies = result.rows.map(c => ({
            ...c,
            bankInfo: c.bank_info_json ? JSON.parse(c.bank_info_json) : null
        }));

        res.json(companies);
    } catch (error) {
        console.error('Erro ao listar empresas:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// POST /companies - Create (or Upsert) a company
router.post('/', async (req: AuthRequest, res: Response) => {
    const {
        cnpj, legalName, tradeName, taxRegime, cnae,
        address, bankInfo
    } = req.body;

    if (!cnpj || !legalName || !tradeName) {
        return res.status(400).json({ message: 'Campos obrigatórios: CNPJ, Razão Social, Nome Fantasia.' });
    }

    const userId = req.user.id;

    try {
        const pool = await connectToDatabase();
        const client = await pool.connect();

        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        const bankInfoJson = JSON.stringify(bankInfo || {});

        try {
            await client.query('BEGIN');

            // Delete existing active company with this CNPJ
            await client.query('DELETE FROM companies WHERE cnpj = $1', [cleanCnpj]);

            // Insert New
            const insertResult = await client.query(
                `INSERT INTO companies (
                    owner_id, cnpj, legal_name, trade_name, tax_regime, cnae,
                    address_zip, address_street, address_number, address_neighborhood, address_city, address_state,
                    bank_info_json
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *`,
                [
                    userId, cleanCnpj, legalName, tradeName, taxRegime || 'SIMPLES', cnae || '',
                    address?.zipCode || '', address?.street || '', address?.number || '',
                    address?.neighborhood || '', address?.city || '', address?.state || '',
                    bankInfoJson
                ]
            );

            await client.query('COMMIT');

            const newCompany = insertResult.rows[0];

            // 3. Create Subscription (Default to FREE if not provided, or selected plan)
            const { subscriptionService } = await import('../services/subscription');
            const planCodeToUse = req.body.planCode || 'FREE';

            // Reuse upgradeSubscription or make a new create method. 
            // upgradeSubscription updates an existing one, so let's insert a fresh one.
            // Actually, we should probably check if upgradeSubscription can handle it OR 
            // Create a specific "createInitialSubscription" method.
            // For now, let's use a direct insert or a helper method.
            await subscriptionService.createInitialSubscription(newCompany.id, planCodeToUse);

            res.status(201).json({
                ...newCompany,
                bankInfo: bankInfo
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao criar empresa:', error);
        res.status(500).json({ message: 'Erro ao salvar empresa.' });
    }
});

export default router;
