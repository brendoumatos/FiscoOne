import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { connectToDatabase } from '../config/db';
import { sendError } from '../utils/errorCatalog';

const router = Router();

// POST /onboarding/company - create company during onboarding
router.post('/company', authenticateToken, async (req: AuthRequest, res: Response) => {
    const {
        cnpj, legalName, tradeName, taxRegime, cnae,
        address, bankInfo, planCode
    } = req.body;

    const userId = req.user.id;

    if (!cnpj || !legalName || !tradeName) {
        return sendError(res, 'VALIDATION_ERROR', { reason: 'Campos obrigatórios: CNPJ, Razão Social, Nome Fantasia.' });
    }

    try {
        const pool = await connectToDatabase();
        const client = await pool.connect();

        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        const bankInfoJson = JSON.stringify(bankInfo || {});

        try {
            await client.query('BEGIN');

            const existing = await client.query('SELECT id FROM companies WHERE cnpj = $1', [cleanCnpj]);
            if ((existing.rowCount || 0) > 0) {
                await client.query('ROLLBACK');
                return sendError(res, 'VALIDATION_ERROR', { status: 409, reason: 'Empresa com este CNPJ já existe.' });
            }

            const insertResult = await client.query(
                `INSERT INTO companies (
                    owner_id, cnpj, legal_name, trade_name, tax_regime, cnae,
                    address_zip, address_street, address_number, address_neighborhood, address_city, address_state,
                    bank_info_json
                )
                OUTPUT inserted.*
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`
                , [
                    userId, cleanCnpj, legalName, tradeName, taxRegime || 'SIMPLES', cnae || '',
                    address?.zipCode || '', address?.street || '', address?.number || '',
                    address?.neighborhood || '', address?.city || '', address?.state || '',
                    bankInfoJson
                ]
            );

            const newCompany = insertResult.rows[0];

            const requestedPlan = (planCode || 'START').toString().toUpperCase();
            const canonicalPlan = (() => {
                if (requestedPlan === 'PLAN_START') return 'START';
                if (requestedPlan === 'PLAN_ESSENTIAL') return 'ESSENTIAL';
                if (requestedPlan === 'PLAN_PROFESSIONAL') return 'PROFESSIONAL';
                if (requestedPlan === 'PLAN_ENTERPRISE') return 'ENTERPRISE';
                return requestedPlan;
            })();

            const allowedCanonical = ['START', 'ESSENTIAL', 'PROFESSIONAL', 'ENTERPRISE'];
            const normalizedPlan = allowedCanonical.includes(canonicalPlan) ? canonicalPlan : 'START';
            const queryCandidates = Array.from(new Set([
                normalizedPlan,
                `PLAN_${normalizedPlan}`,
                'START'
            ]));
            while (queryCandidates.length < 3) queryCandidates.push(queryCandidates[queryCandidates.length - 1]);

            const planRes = await client.query(
                `SELECT TOP 1 id, code FROM plans WHERE code IN ($1, $2, $3)
                 ORDER BY CASE 
                    WHEN code = $1 THEN 0
                    WHEN code = 'START' THEN 1
                    ELSE 2 END`,
                [queryCandidates[0], queryCandidates[1], queryCandidates[2]]
            );
            if (planRes.rowCount === 0) {
                throw new Error('Plano não encontrado.');
            }
            const planId = planRes.rows[0].id;
            const persistedPlanCode = planRes.rows[0].code;

            const subRes = await client.query(
                `INSERT INTO subscriptions (company_id, plan_id, status, payment_status, started_at, expires_at)
                 OUTPUT inserted.id
                 VALUES ($1, $2, 'ACTIVE', 'PAID', SYSUTCDATETIME(), DATEADD(month, 1, SYSUTCDATETIME()))`,
                [newCompany.id, planId]
            );

            await client.query('COMMIT');

            res.status(201).json({
                ...newCompany,
                bankInfo,
                planCode: persistedPlanCode,
                subscriptionId: subRes.rows[0].id
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erro ao criar empresa (onboarding):', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao salvar empresa.' });
    }
});

export default router;
