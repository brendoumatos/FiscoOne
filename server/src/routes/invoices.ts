import { Router, Response } from 'express';
import { connectToDatabase } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import storageService from '../services/storage';
import { timelineService } from '../services/timeline';
import { subscriptionService } from '../services/subscription';
import { usageService } from '../services/usage';

const router = Router();

router.use(authenticateToken);

// GET /invoices
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const companyId = req.query.companyId as string;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID obrigatório.' });
    }

    try {
        const pool = await connectToDatabase();

        // Security check
        const ownershipCheck = await pool.query(
            'SELECT 1 FROM companies WHERE id = $1 AND owner_id = $2',
            [companyId, userId]
        );

        if (ownershipCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Acesso negado a esta empresa.' });
        }

        const result = await pool.query(
            `SELECT * FROM invoices 
             WHERE company_id = $1
             ORDER BY issue_date DESC`,
            [companyId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar notas:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// POST /invoices
router.post('/', async (req: AuthRequest, res: Response) => {
    const {
        companyId,
        borrower,
        items,
        amount
    } = req.body;

    try {
        const pool = await connectToDatabase();

        // 1. Generate Metadata
        const issueDate = new Date();
        const year = issueDate.getFullYear();
        const month = String(issueDate.getMonth() + 1).padStart(2, '0');

        // 2. Generate Fake XML
        const fakeXmlContent = `<Invoice><Id>${Math.random()}</Id><Amount>${amount}</Amount></Invoice>`;

        // 3. Save to Data Lake
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.xml`;
        const filePath = `${companyId}/${year}/${month}/${fileName}`;
        await storageService.saveFile(filePath, fakeXmlContent);

        // Subscription & Entitlement Check
        const entitlement = await subscriptionService.checkEntitlement(companyId, 'ISSUE_INVOICE');
        if (!entitlement.allowed) {
            return res.status(403).json({
                message: entitlement.reason,
                code: 'LIMIT_EXCEEDED'
            });
        }

        // 1. Transactional Insert (Invoices + Items)
        // Note: We need to increment usage AFTER successful creation. 
        // Or conceptually reserve it. For MVP, we check first, then increment after.
        const result = await pool.query(
            `INSERT INTO invoices (
                company_id, issue_date, status, amount,
                borrower_doc, borrower_name, xml_storage_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                companyId, issueDate, 'ISSUED', amount,
                borrower.document, borrower.name, filePath
            ]
        );

        const newInvoice = result.rows[0];

        // Timeline Hook
        await timelineService.recordEvent(
            companyId,
            'INVOICE_ISSUED',
            `Nota Fiscal R$ ${amount} emitida`,
            `Nota emitida para ${borrower.name}`,
            { invoiceId: newInvoice.id, amount }
        );

        // Usage Hook
        await usageService.incrementUsage(companyId, 'INVOICES_ISSUED');

        res.status(201).json(newInvoice);

    } catch (error) {
        console.error('Erro ao emitir nota:', error);
        res.status(500).json({ message: 'Erro ao emitir nota.' });
    }
});

export default router;
