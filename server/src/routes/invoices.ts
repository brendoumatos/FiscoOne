import { Router, Response } from 'express';
import { connectToDatabase } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import storageService from '../services/storage';
import { timelineService } from '../services/timeline';
import { subscriptionService } from '../services/subscription';
import { usageService } from '../services/usage';
import { auditLogService } from '../services/auditLog';
import { pool } from '../config/db';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';

const router = protectedCompanyRouter();

// GET /invoices
router.get('/:companyId', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;

    try {
        const pool = await connectToDatabase();

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
router.post('/:companyId', requireRole(PERMISSIONS.INVOICE_WRITE), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    const {
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

        // Audit Log (fail fast if logging fails)
        await auditLogService.log({
            action: 'INVOICE_ISSUED',
            entityType: 'INVOICE',
            entityId: newInvoice.id,
            afterState: newInvoice,
            req
        });

        res.status(201).json(newInvoice);

    } catch (error) {
        console.error('Erro ao emitir nota:', error);
        res.status(500).json({ message: 'Erro ao emitir nota.' });
    }
});

// Cancel invoice
router.post('/:companyId/:invoiceId/cancel', requireRole(PERMISSIONS.INVOICE_CANCEL), async (req: AuthRequest, res: Response) => {
    const { companyId, invoiceId } = req.params;

    try {
        const entitlement = await subscriptionService.checkEntitlement(companyId, 'CANCEL_INVOICE');
        if (!entitlement.allowed) {
            return res.status(403).json({ message: entitlement.reason || 'Plano não permite cancelar notas' });
        }

        const result = await pool.query(
            `UPDATE invoices SET status = 'CANCELLED' WHERE id = $1 AND company_id = $2 RETURNING *`,
            [invoiceId, companyId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Nota não encontrada' });
        }

        await auditLogService.log({
            action: 'INVOICE_CANCELLED',
            entityType: 'INVOICE',
            entityId: invoiceId,
            beforeState: { id: invoiceId },
            afterState: { status: 'CANCELLED' },
            req
        });

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao cancelar nota:', error);
        res.status(500).json({ message: 'Erro ao cancelar nota' });
    }
});

export default router;
