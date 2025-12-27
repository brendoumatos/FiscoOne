import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../config/db';
import { requireAdminAuth, ipAllowlist, AdminAuthRequest, verifyAdminMfa, signAdminTokens } from '../middleware/adminAuth';
import { adminAuditLogService } from '../services/adminAuditLog';
import { impersonationService } from '../services/impersonationService';
import { PoolClient } from 'pg';

const router = Router();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'admin-test-secret' : '');
if (!ADMIN_JWT_SECRET) throw new Error('ADMIN_JWT_SECRET must be set');

// POST /admin/login (step1: password)
router.post('/login', ipAllowlist, async (req: Request, res: Response) => {
    const { email, password, mfaCode } = req.body;
    if (!email || !password || !mfaCode) return res.status(400).json({ message: 'Email, senha e MFA são obrigatórios.' });

    const pool = await connectToDatabase();
    const adminRes = await pool.query('SELECT id, email, password_hash, role, active, totp_secret FROM admin_users WHERE email = $1', [email]);
    const admin = adminRes.rows[0];
    if (!admin || admin.active === false) return res.status(401).json({ message: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

    const mfaOk = verifyAdminMfa(admin.totp_secret, mfaCode);
    if (!mfaOk) return res.status(401).json({ message: 'MFA inválido' });

    const { accessToken, refreshToken } = signAdminTokens(admin);

    await adminAuditLogService.log({
        adminId: admin.id,
        action: 'ADMIN_LOGIN',
        details: { email },
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent']
    }, req);

    await pool.query(
        `INSERT INTO admin_sessions (admin_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, DATEADD(day, 30, SYSUTCDATETIME()), $3, $4)`,
        [admin.id, refreshToken, (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '', req.headers['user-agent'] || '']
    );

    res.json({ token: accessToken, refreshToken, admin: { id: admin.id, email: admin.email, role: admin.role } });
});

// POST /admin/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token necessário' });
    try {
        const payload: any = require('jsonwebtoken').verify(refreshToken, process.env.ADMIN_REFRESH_SECRET || ADMIN_JWT_SECRET);
        if (payload.scope !== 'platform') return res.status(401).json({ message: 'Escopo inválido' });
        const pool = await connectToDatabase();
        const stored = await pool.query('SELECT id FROM admin_sessions WHERE refresh_token = $1 AND expires_at > SYSUTCDATETIME()', [refreshToken]);
        if (stored.rowCount === 0) return res.status(401).json({ message: 'Refresh inválido' });
        const { accessToken } = signAdminTokens({ id: payload.id, role: payload.role });
        res.json({ token: accessToken });
    } catch (err) {
        return res.status(401).json({ message: 'Refresh inválido' });
    }
});

// POST /admin/impersonate
router.post('/impersonate', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN']), async (req: AdminAuthRequest, res: Response) => {
    const { companyId, userId, reason } = req.body;
    if (!companyId) return res.status(400).json({ message: 'companyId é obrigatório' });
    const adminId = req.admin!.id;

    const { token, sessionId, expiresAt } = await impersonationService.start({
        adminId,
        companyId,
        userId,
        reason,
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent']
    });

    res.json({ token, sessionId, expiresAt });

    await adminAuditLogService.log({
        adminId: adminId,
        action: 'ADMIN_IMPERSONATE_START',
        details: { companyId, userId, sessionId, reason },
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent']
    }, req);
});

// POST /admin/impersonate/exit
router.post('/impersonate/exit', ipAllowlist, requireAdminAuth(), async (req: AdminAuthRequest, res: Response) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId é obrigatório' });

    const stopped = await impersonationService.stop(sessionId, req.admin!.id);
    if (!stopped) return res.status(404).json({ message: 'Sessão não encontrada' });

    await adminAuditLogService.log({
        adminId: req.admin!.id,
        action: 'ADMIN_IMPERSONATE_STOP',
        details: { sessionId },
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent']
    }, req);

    res.json({ ok: true });
});

// Placeholder metrics endpoint
router.get('/metrics/overview', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN']), async (_req: AdminAuthRequest, res: Response) => {
    const pool = await connectToDatabase();
    const companies = await pool.query('SELECT COUNT(*) FROM companies');
    const subs = await pool.query('SELECT plan_id, COUNT(*) FROM subscriptions GROUP BY plan_id');
    res.json({ companies: Number(companies.rows[0].count), subscriptionsByPlan: subs.rows });
});

// GET /admin/companies - basic tenant oversight
router.get('/companies', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN']), async (_req: AdminAuthRequest, res: Response) => {
    const pool = await connectToDatabase();
    const result = await pool.query(`
        SELECT c.id,
               c.trade_name,
               c.legal_name,
               c.cnpj,
               c.created_at,
               s.status AS subscription_status,
               s.renewal_cycle,
               s.start_date,
               s.end_date,
               p.code AS plan_code,
               p.name AS plan_name,
               COALESCE((SELECT COUNT(*) FROM company_seats cs WHERE cs.company_id = c.id), 0) AS seats
          FROM companies c
          LEFT JOIN subscriptions s ON s.company_id = c.id
          LEFT JOIN plans p ON p.id = s.plan_id
         ORDER BY c.created_at DESC
         LIMIT 200;
    `);
    res.json({ companies: result.rows });
});

// PATCH /admin/companies/:id/status - pause/resume subscription
router.patch('/companies/:id/status', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req: AdminAuthRequest, res: Response) => {
    const { status } = req.body;
    const allowed = ['ACTIVE', 'PAUSED', 'CANCELLED'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Status inválido' });

    const pool = await connectToDatabase();
    const updated = await pool.query(
        'UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE company_id = $2 RETURNING id, company_id, status',
        [status, req.params.id]
    );

    if (updated.rowCount === 0) return res.status(404).json({ message: 'Assinatura não encontrada' });

    await adminAuditLogService.log({
        adminId: req.admin!.id,
        action: 'ADMIN_COMPANY_STATUS_CHANGE',
        details: { companyId: req.params.id, status },
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent']
    }, req);

    res.json({ subscription: updated.rows[0] });
});

// GET /admin/plans - list plans + features
router.get('/plans', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (_req: AdminAuthRequest, res: Response) => {
    const pool = await connectToDatabase();
    const plans = await pool.query(
        `SELECT p.*, COALESCE(json_agg(f.feature_code ORDER BY f.feature_code) FILTER (WHERE f.feature_code IS NOT NULL), '[]') AS features
           FROM plans p
           LEFT JOIN plan_features f ON f.plan_id = p.id
          GROUP BY p.id
          ORDER BY p.created_at DESC`
    );
    res.json({ plans: plans.rows });
});

const upsertPlanFeatures = async (client: PoolClient, planId: string, features: string[]) => {
    await client.query('DELETE FROM plan_features WHERE plan_id = $1', [planId]);
    if (features && features.length > 0) {
        const values = features.map((feature, idx) => `($1, $${idx + 2}, TRUE)`).join(',');
        await client.query(
            `INSERT INTO plan_features (plan_id, feature_code, is_enabled)
             VALUES ${values}`,
            [planId, ...features]
        );
    }
};

// POST /admin/plans - create plan with features
router.post('/plans', ipAllowlist, requireAdminAuth(['SUPER_ADMIN']), async (req: AdminAuthRequest, res: Response) => {
    const { code, name, price_monthly, invoice_limit, seat_limit, extra_invoice_price, extra_seat_price, is_custom, features = [] } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'code e name são obrigatórios' });

    const pool = await connectToDatabase();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const plan = await client.query(
            `INSERT INTO plans (code, name, price_monthly, invoice_limit, seat_limit, extra_invoice_price, extra_seat_price, is_custom)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [code, name, price_monthly, invoice_limit, seat_limit, extra_invoice_price, extra_seat_price, is_custom]
        );

        await upsertPlanFeatures(client, plan.rows[0].id, features);
        await client.query('COMMIT');

        await adminAuditLogService.log({
            adminId: req.admin!.id,
            action: 'ADMIN_PLAN_CREATE',
            details: { planId: plan.rows[0].id, code },
            ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent']
        }, req);

        res.status(201).json({ plan: plan.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[admin/plans:create]', err);
        res.status(500).json({ message: 'Erro ao criar plano' });
    } finally {
        client.release();
    }
});

// PUT /admin/plans/:id - update plan and features
router.put('/plans/:id', ipAllowlist, requireAdminAuth(['SUPER_ADMIN']), async (req: AdminAuthRequest, res: Response) => {
    const { name, price_monthly, invoice_limit, seat_limit, extra_invoice_price, extra_seat_price, is_custom, features = [] } = req.body;
    const pool = await connectToDatabase();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updated = await client.query(
            `UPDATE plans SET name = COALESCE($1, name), price_monthly = COALESCE($2, price_monthly),
                              invoice_limit = COALESCE($3, invoice_limit), seat_limit = COALESCE($4, seat_limit),
                              extra_invoice_price = COALESCE($5, extra_invoice_price), extra_seat_price = COALESCE($6, extra_seat_price),
                              is_custom = COALESCE($7, is_custom), updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [name, price_monthly, invoice_limit, seat_limit, extra_invoice_price, extra_seat_price, is_custom, req.params.id]
        );
        if (updated.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Plano não encontrado' });
        }

        await upsertPlanFeatures(client, req.params.id, features);
        await client.query('COMMIT');

        await adminAuditLogService.log({
            adminId: req.admin!.id,
            action: 'ADMIN_PLAN_UPDATE',
            details: { planId: req.params.id },
            ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent']
        }, req);

        res.json({ plan: updated.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[admin/plans:update]', err);
        res.status(500).json({ message: 'Erro ao atualizar plano' });
    } finally {
        client.release();
    }
});

// GET /admin/users/seats - user and seat overview
router.get('/users/seats', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN']), async (_req: AdminAuthRequest, res: Response) => {
    const pool = await connectToDatabase();
    const rows = await pool.query(
        `SELECT cs.id, cs.company_id, cs.status, cs.seat_role,
                u.email, u.full_name, u.role,
                c.trade_name, c.cnpj,
                cs.created_at
           FROM company_seats cs
           JOIN users u ON u.id = cs.user_id
           JOIN companies c ON c.id = cs.company_id
          ORDER BY cs.created_at DESC
          LIMIT 200`
    );
    res.json({ seats: rows.rows });
});

// GET /admin/audit - latest platform and tenant actions
router.get('/audit', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN']), async (_req: AdminAuthRequest, res: Response) => {
    const pool = await connectToDatabase();
    const result = await pool.query(
        `(
            SELECT 'tenant' AS scope, id, user_id, company_id, action, details, ip_address, created_at
              FROM audit_logs
         )
         UNION ALL
         (
            SELECT 'admin' AS scope, id, actor_admin_id AS user_id, NULL AS company_id, action, after_state AS details, ip_address, created_at
              FROM admin_audit_logs
         )
         ORDER BY created_at DESC
         LIMIT 200`
    );
    res.json({ logs: result.rows });
});

// GET /admin/impersonation/sessions - list active sessions
router.get('/impersonation/sessions', ipAllowlist, requireAdminAuth(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN']), async (_req: AdminAuthRequest, res: Response) => {
    const pool = await connectToDatabase();
    const sessions = await pool.query(
        `SELECT s.id, s.admin_id, s.company_id, s.user_id, s.expires_at, s.created_at, s.active,
                c.trade_name, u.email
           FROM impersonation_sessions s
           LEFT JOIN companies c ON c.id = s.company_id
           LEFT JOIN users u ON u.id = s.user_id
          WHERE s.active = TRUE
          ORDER BY s.created_at DESC`
    );
    res.json({ sessions: sessions.rows });
});

export default router;