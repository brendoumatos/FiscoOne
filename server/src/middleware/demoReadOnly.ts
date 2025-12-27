import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/errorCatalog';

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID || 'demo-company-id';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Blocks write operations when running in demo mode for the demo tenant.
 * Returns a consistent DEMO_MODE error payload for UI handling.
 */
export const demoReadOnly = (req: Request, res: Response, next: NextFunction) => {
    if (!DEMO_MODE) return next();

    const companyId = (req as any)?.user?.companyId;
    if (!companyId || companyId !== DEMO_COMPANY_ID) return next();

    if (SAFE_METHODS.includes(req.method.toUpperCase())) return next();

    return sendError(res, 'FORBIDDEN', {
        error: 'DEMO_MODE',
        reason: 'Modo demonstração é somente leitura. Dados são reiniciados periodicamente.',
        cta: 'EXIT_DEMO'
    });
};
