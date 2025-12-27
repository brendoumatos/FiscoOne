import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../config/db';

export interface ImpersonationContext {
    impersonated: boolean;
    originalAdminId: string;
    companyId: string;
    userId?: string | null;
}

const IMPERSONATION_JWT_SECRET = process.env.IMPERSONATION_JWT_SECRET || process.env.ADMIN_JWT_SECRET;

export const verifyImpersonation = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['x-impersonation-token'] as string;
    if (!authHeader) return next(); // not impersonating

    try {
        const payload: any = jwt.verify(authHeader, IMPERSONATION_JWT_SECRET as string);
        if (!payload.impersonated) return res.status(401).json({ message: 'Invalid impersonation token' });

        const pool = await connectToDatabase();
        const sessionRes = await pool.query(
            'SELECT id, active, expires_at FROM impersonation_sessions WHERE id = $1 AND active = TRUE',
            [payload.session_id || payload.id || null]
        );
        if (sessionRes.rowCount === 0) return res.status(401).json({ message: 'Impersonation session expired' });

        (req as any).impersonation = {
            impersonated: true,
            originalAdminId: payload.original_admin_id,
            companyId: payload.company_id,
            userId: payload.user_id || null
        } as ImpersonationContext;
        next();
    } catch (err) {
        console.error('[Impersonation] verify error', err);
        return res.status(401).json({ message: 'Invalid impersonation token' });
    }
};
