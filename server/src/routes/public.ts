import { Request, Response, Router } from 'express';
import { pool } from '../config/db';
import { sendError } from '../utils/errorCatalog';

type EntitlementRow = { plan_code: string; entitlement_key: string; limit_value: number };

const router = Router();

// GET /public/plans
router.get('/plans', async (_req: Request, res: Response) => {
    try {
        const planRes = await pool.query(
            `SELECT code, name, description_pt_br, price_monthly, price_yearly, invoice_limit, seat_limit, accountant_limit
             FROM plans
             WHERE is_active = true
             ORDER BY COALESCE(price_monthly, 0), code`
        );

        let entitlementRows: EntitlementRow[] = [];
        try {
            const entRes = await pool.query<EntitlementRow>(
                `SELECT plan_code, entitlement_key, limit_value FROM plan_entitlements`
            );
            entitlementRows = entRes.rows;
        } catch (err: any) {
            if (err?.code !== '42P01') {
                console.error('Erro ao carregar entitlements dos planos', err);
            }
        }

        const entitlementsByPlan = entitlementRows.reduce<Record<string, { key: string; limit: number | null }[]>>((acc, row) => {
            const list = acc[row.plan_code] ?? [];
            const normalizedLimit = row.limit_value === -1 ? null : Number(row.limit_value);
            list.push({ key: row.entitlement_key, limit: normalizedLimit });
            acc[row.plan_code] = list;
            return acc;
        }, {});

        const normalizeLimit = (value?: number | null) => {
            if (value === null || value === undefined) return null;
            return value === -1 ? null : Number(value);
        };

        const plans = planRes.rows.map((plan) => {
            const entitlements = entitlementsByPlan[plan.code] ?? [];
            if (entitlements.length === 0) {
                const invoiceLimit = normalizeLimit(plan.invoice_limit);
                const seatLimit = normalizeLimit(plan.seat_limit);
                const accountantLimit = normalizeLimit(plan.accountant_limit);
                if (invoiceLimit !== null) entitlements.push({ key: 'INVOICES', limit: invoiceLimit });
                if (seatLimit !== null) entitlements.push({ key: 'SEATS', limit: seatLimit });
                if (accountantLimit !== null) entitlements.push({ key: 'ACCOUNTANTS', limit: accountantLimit });
            }

            return {
                code: plan.code,
                name: plan.name,
                description: plan.description_pt_br,
                priceMonthly: plan.price_monthly !== null ? Number(plan.price_monthly) : null,
                priceYearly: plan.price_yearly !== null ? Number(plan.price_yearly) : null,
                entitlements
            };
        });

        res.json(plans);
    } catch (error) {
        console.error('Erro ao listar planos públicos', error);
        sendError(res, 'INTERNAL_ERROR', { reason: 'Erro ao listar planos.' });
    }
});

export default router;
