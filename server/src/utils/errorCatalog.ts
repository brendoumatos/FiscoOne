import { Response } from 'express';

type ErrorCode =
    | 'PLAN_BLOCKED'
    | 'TENANT_VIOLATION'
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'NOT_FOUND'
    | 'INTERNAL_ERROR';

export interface ErrorPayload {
    error: ErrorCode;
    status: number;
    reason: string;
    cta?: string | null;
    details?: any;
}

type ErrorCatalog = Record<ErrorCode, Omit<ErrorPayload, 'error'>>;

export const errorCatalog: ErrorCatalog = {
    PLAN_BLOCKED: {
        status: 403,
        reason: 'Plano bloqueado ou em período de graça.',
        cta: 'UPGRADE_PLAN'
    },
    TENANT_VIOLATION: {
        status: 403,
        reason: 'Contexto do tenant inválido. Use o companyId do token.',
        cta: null
    },
    VALIDATION_ERROR: {
        status: 400,
        reason: 'Dados inválidos.',
        cta: null
    },
    UNAUTHORIZED: {
        status: 401,
        reason: 'Autenticação necessária.',
        cta: null
    },
    NOT_FOUND: {
        status: 404,
        reason: 'Recurso não encontrado.',
        cta: null
    },
    INTERNAL_ERROR: {
        status: 500,
        reason: 'Erro interno.',
        cta: null
    }
};

export function makeError(code: ErrorCode, overrides: Partial<ErrorPayload> = {}): ErrorPayload {
    const base = errorCatalog[code] ?? errorCatalog.INTERNAL_ERROR;
    return {
        error: code,
        ...base,
        ...overrides,
        status: overrides.status ?? base.status
    };
}

export function sendError(res: Response, code: ErrorCode, overrides: Partial<ErrorPayload> = {}) {
    const payload = makeError(code, overrides);
    return res.status(payload.status).json(payload);
}
