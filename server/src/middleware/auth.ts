import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
    process.env.JWT_SECRET = 'test-secret';
}
if (!process.env.REFRESH_SECRET && process.env.NODE_ENV !== 'production') {
    process.env.REFRESH_SECRET = 'test-refresh-secret';
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set');
}

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        // Normalize companyId claim to enforce tenant isolation downstream
        req.user = {
            ...decoded,
            companyId: decoded.companyId || decoded.company_id || decoded.company_id?.toString?.() || decoded.companyId?.toString?.()
        };

        // Flag impersonation session id if present so audits can tag it
        if (decoded.session_id && decoded.impersonated) {
            (req as any).impersonationSessionId = decoded.session_id;
        }
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
};
