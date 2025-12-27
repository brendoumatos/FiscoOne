import { Router, Response } from 'express';
import { connectToDatabase } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import storageService from '../services/storage';
import { timelineService } from '../services/timeline';
import { usageService } from '../services/usage';
import { auditLogService } from '../services/auditLog';
import { pool } from '../config/db';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// GET /invoices/preview - lightweight tax preview without persisting
router.get('/preview', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    try {
        const items = (req.query.items as any) || req.body?.items || [];
        const totalFromQuery = req.query.total ? Number(req.query.total) : undefined;
        const total = Number.isFinite(totalFromQuery) && totalFromQuery !== 0
            ? totalFromQuery
            : Array.isArray(items)
                ? items.reduce((sum, item) => sum + Number(item.amount || item.total || 0), 0)
                : 0;

        const serviceTax = Number((total * 0.02).toFixed(2));
        const vat = Number((total * 0.05).toFixed(2));
        const net = Number((total - serviceTax - vat).toFixed(2));

        res.json({
            total,
            taxes: {
                serviceTax,
                vat
            },
            net,
            items: Array.isArray(items) ? items : []
        });
    } catch (error) {
        console.error('Erro no preview de nota', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao calcular preview.' });
    }
});

// GET /invoices
router.get('/', requireRole(PERMISSIONS.INVOICE_READ), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { month } = req.query; // expected format YYYY-MM

    try {
        const pool = await connectToDatabase();

        const params: any[] = [companyId];
        let where = 'company_id = $1';

        if (month) {
            params.push(month);
            where += ` AND FORMAT(issue_date, 'yyyy-MM') = $2`;
        }

        const result = await pool.query(
            `SELECT * FROM invoices 
             WHERE ${where}
             ORDER BY issue_date DESC`,
            params
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar notas:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro interno.' });
    }
});

// POST /invoices
router.post('/', requireRole(PERMISSIONS.INVOICE_WRITE), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { customer_id, customer_name, items, total, borrower } = req.body;

    // Contract: payload uses customer_id + items + total (fallback to legacy borrower/amount)
    const amount = total ?? req.body.amount;
    const borrowerDoc = customer_id ?? borrower?.document ?? 'UNKNOWN';
    const borrowerName = customer_name ?? borrower?.name ?? 'Cliente';

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

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

        const result = await client.query(
            `INSERT INTO invoices (
                company_id, issue_date, status, amount,
                borrower_doc, borrower_name, xml_storage_url
            )
            OUTPUT inserted.*
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                companyId, issueDate, 'ISSUED', amount,
                borrowerDoc, borrowerName, filePath
            ]
        );

        const newInvoice = result.rows[0];

        // Timeline Hook
        await timelineService.recordEvent(
            companyId,
            'INVOICE_ISSUED',
            `Nota Fiscal R$ ${amount} emitida`,
            `Nota emitida para ${borrowerName}`,
            { invoiceId: newInvoice.id, amount }
        );

        // Usage Hook
        await usageService.incrementUsage(companyId, 'INVOICES');

        // Audit Log (fail fast if logging fails)
        await auditLogService.log({
            action: 'INVOICE_ISSUED',
            entityType: 'INVOICE',
            entityId: newInvoice.id,
            afterState: newInvoice,
            req
        });

        await client.query('COMMIT');
        res.status(201).json(newInvoice);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao emitir nota:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao emitir nota.' });
    }
    finally {
        client.release();
    }
});

// Cancel invoice
router.post('/:invoiceId/cancel', requireRole(PERMISSIONS.INVOICE_CANCEL), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { invoiceId } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE invoices SET status = 'CANCELLED' WHERE id = $1 AND company_id = $2
             OUTPUT inserted.*`,
            [invoiceId, companyId]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return sendError(res, 'NOT_FOUND', { reason: 'Nota não encontrada' });
        }

        await auditLogService.log({
            action: 'INVOICE_CANCELLED',
            entityType: 'INVOICE',
            entityId: invoiceId,
            beforeState: { id: invoiceId },
            afterState: { status: 'CANCELLED' },
            req
        });

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao cancelar nota:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao cancelar nota' });
    }
    finally {
        client.release();
    }
});

export default router;
