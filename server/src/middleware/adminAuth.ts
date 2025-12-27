import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';

type AdminRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT_ADMIN';

export interface AdminAuthRequest extends Request {
    admin?: {
        id: string;
        role: AdminRole;
        scope: string;
    };
}

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'admin-test-secret' : undefined);
const ADMIN_REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET || ADMIN_JWT_SECRET;

const isCidRorIp = (entry: string, ip: string) => {
    if (entry.includes('/')) {
        try {
            const [base, maskStr] = entry.split('/');
            const mask = Number(maskStr);
            const ipNum = ipToLong(ip);
            const baseNum = ipToLong(base);
            const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
            return (ipNum & maskBits) === (baseNum & maskBits);
        } catch (e) {
            return false;
        }
    }
    return ip === entry;
};

const ipToLong = (ip: string) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;

if (!ADMIN_JWT_SECRET) {
    throw new Error('ADMIN_JWT_SECRET must be set');
}

export const requireAdminAuth = (allowedRoles?: AdminRole[]) => {
    return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

            const [, token] = authHeader.split(' ');
            if (!token) return res.status(401).json({ message: 'Invalid Authorization header' });

            const payload: any = jwt.verify(token, ADMIN_JWT_SECRET);

            if (payload.scope !== 'platform') {
                return res.status(403).json({ message: 'Invalid scope' });
            }

            const admin = {
                id: payload.id as string,
                role: payload.role as AdminRole,
                scope: payload.scope as string
            };

            if (allowedRoles && !allowedRoles.includes(admin.role)) {
                return res.status(403).json({ message: 'Insufficient role' });
            }

            req.admin = admin;
            next();
        } catch (err) {
            console.error('[AdminAuth] error:', err);
            return res.status(401).json({ message: 'Unauthorized' });
        }
    };
};

// Simple IP allowlist check from env list (comma-separated CIDRs/IPs)
export const ipAllowlist = (req: Request, res: Response, next: NextFunction) => {
    const raw = process.env.ADMIN_IP_ALLOWLIST;
    if (!raw) return next();
    const list = raw.split(',').map(s => s.trim()).filter(Boolean);
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const allowed = list.some(entry => isCidRorIp(entry, ip));
    if (!allowed) return res.status(403).json({ message: 'IP not allowed' });
    next();
};

export const verifyAdminMfa = (secret: string, token: string) => {
    if (!secret) return false;
    return authenticator.verify({ token, secret });
};

export const signAdminTokens = (admin: { id: string; role: string }) => {
    const accessToken = jwt.sign(
        { id: admin.id, role: admin.role, scope: 'platform' },
        ADMIN_JWT_SECRET!,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: admin.id, role: admin.role, scope: 'platform' },
        ADMIN_REFRESH_SECRET!,
        { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
};
