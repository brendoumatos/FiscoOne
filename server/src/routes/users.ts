import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { subscriptionService } from '../services/subscription';
import { auditLogService } from '../services/auditLog';
import { pool } from '../config/db';

const router = protectedCompanyRouter();

// Add collaborator (COLLABORATOR role). Accountants are delegated elsewhere and do not consume seats.
router.post('/:companyId/users', requireRole(['OWNER']), async (req: AuthRequest, res: Response) => {
    const { companyId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId obrigatório' });

    // Entitlement: seat limit
    const entitlement = await subscriptionService.checkEntitlement(companyId, 'ADD_COLLABORATOR');
    if (!entitlement.allowed) {
        return res.status(403).json({ message: entitlement.reason || 'Limite de assentos atingido' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `INSERT INTO company_members (company_id, user_id, role, status)
             VALUES ($1, $2, 'COLLABORATOR', 'ACTIVE')
             ON CONFLICT (company_id, user_id) DO UPDATE SET status = 'ACTIVE', role = 'COLLABORATOR'`,
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
        res.status(500).json({ message: 'Erro ao adicionar colaborador' });
    } finally {
        client.release();
    }
});

// Remove collaborator
router.delete('/:companyId/users/:userId', requireRole(['OWNER']), async (req: AuthRequest, res: Response) => {
    const { companyId, userId } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const del = await client.query(
            `DELETE FROM company_members WHERE company_id = $1 AND user_id = $2 AND role = 'COLLABORATOR'`,
            [companyId, userId]
        );

        if (del.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Colaborador não encontrado' });
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
        res.status(500).json({ message: 'Erro ao remover colaborador' });
    } finally {
        client.release();
    }
});

export default router;
