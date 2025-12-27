import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRole, PERMISSIONS } from '../middleware/requireRole';
import { protectedCompanyRouter } from '../utils/protectedCompanyRouter';
import { pool } from '../config/db';
import { auditLogService } from '../services/auditLog';
import { sendError } from '../utils/errorCatalog';

const router = protectedCompanyRouter();

// PUT /settings/fiscal - update company fiscal data
router.put('/fiscal', requireRole(PERMISSIONS.COMPANY_SETTINGS), async (req: AuthRequest, res: Response) => {
    const companyId = req.user?.companyId;
    const { legalName, tradeName, taxRegime, cnae, address } = req.body;

    try {
        const result = await pool.query(
            `UPDATE companies
             SET legal_name = COALESCE($2, legal_name),
                 trade_name = COALESCE($3, trade_name),
                 tax_regime = COALESCE($4, tax_regime),
                 cnae = COALESCE($5, cnae),
                 address_zip = COALESCE($6, address_zip),
                 address_street = COALESCE($7, address_street),
                 address_number = COALESCE($8, address_number),
                 address_neighborhood = COALESCE($9, address_neighborhood),
                 address_city = COALESCE($10, address_city),
                 address_state = COALESCE($11, address_state)
             OUTPUT inserted.*
             WHERE id = $1`,
            [
                companyId,
                legalName,
                tradeName,
                taxRegime,
                cnae,
                address?.zipCode,
                address?.street,
                address?.number,
                address?.neighborhood,
                address?.city,
                address?.state
            ]
        );

        if (result.rowCount === 0) return sendError(res, 'NOT_FOUND', { reason: 'Empresa não encontrada' });

        await auditLogService.log({
            action: 'COMPANY_SETTINGS_UPDATED',
            entityType: 'COMPANY',
            entityId: companyId,
            afterState: { legalName, tradeName, taxRegime, cnae, address },
            req
        });

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar dados fiscais', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao atualizar dados fiscais' });
    }
});

export default router;
