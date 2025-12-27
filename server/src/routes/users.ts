import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { auditLogService } from '../services/auditLog';
import { pool } from '../config/db';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// Add collaborator (COLLABORATOR role). Accountants are delegated elsewhere and do not consume seats.
router.post('/users', requireRole(['OWNER']), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { userId } = req.body;
    if (!userId) return sendError(res, 'VALIDATION_ERROR', { reason: 'userId obrigatório' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `MERGE company_members AS target
             USING (SELECT $1 AS company_id, $2 AS user_id) AS src
             ON (target.company_id = src.company_id AND target.user_id = src.user_id)
             WHEN MATCHED THEN
                 UPDATE SET status = 'ACTIVE', role = 'COLLABORATOR'
             WHEN NOT MATCHED THEN
                 INSERT (company_id, user_id, role, status)
                 VALUES (src.company_id, src.user_id, 'COLLABORATOR', 'ACTIVE');`,
            [companyId, userId]
        );

        await auditLogService.log({
            action: 'USER_ADDED',
            entityType: 'COMPANY',
            entityId: companyId,
            afterState: { userId, role: 'COLLABORATOR' },
            req
        });

        await client.query('COMMIT');
        res.status(201).json({ message: 'Colaborador adicionado' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Add collaborator failed:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao adicionar colaborador' });
    } finally {
        client.release();
    }
});

// Remove collaborator
router.delete('/users/:userId', requireRole(['OWNER']), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { userId } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const del = await client.query(
            `DELETE FROM company_members WHERE company_id = $1 AND user_id = $2 AND role = 'COLLABORATOR'`,
            [companyId, userId]
        );

        if (del.rowCount === 0) {
            await client.query('ROLLBACK');
            return sendError(res, 'NOT_FOUND', { reason: 'Colaborador não encontrado' });
        }

        await auditLogService.log({
            action: 'USER_REMOVED',
            entityType: 'COMPANY',
            entityId: companyId,
            beforeState: { userId, role: 'COLLABORATOR' },
            req
        });

        await client.query('COMMIT');
        res.json({ message: 'Colaborador removido' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Remove collaborator failed:', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao remover colaborador' });
    } finally {
        client.release();
    }
});

export default router;
