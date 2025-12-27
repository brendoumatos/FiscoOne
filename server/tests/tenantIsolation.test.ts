import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../src/config/db', () => {
    const query = vi.fn();
    return {
        pool: { query }
    };
});

import { pool } from '../src/config/db';
import { ensureCompanyAccess } from '../src/middleware/ensureCompanyAccess';

const uuid = '11111111-1111-1111-1111-111111111111';

function createMockRes() {
    const res: Partial<Response> = {};
    res.statusCode = 200;
    res.status = vi.fn().mockImplementation(function (this: Response, code: number) {
        // @ts-ignore
        this.statusCode = code;
        return this;
    });
    res.json = vi.fn().mockImplementation(function (this: Response, body: any) {
        // @ts-ignore
        this.body = body;
        return this;
    });
    return res as Response & { body?: any };
}

const next: NextFunction = vi.fn();

describe('ensureCompanyAccess tenant isolation', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        (pool.query as any).mockReset();
    });

    it('rejects external companyId in params', async () => {
        const req = {
            user: { id: 'u1', companyId: uuid },
            params: { companyId: '22222222-2222-2222-2222-222222222222' },
            query: {},
            body: {}
        } as unknown as Request;
        const res = createMockRes();

        await ensureCompanyAccess(req as any, res as any, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.body).toMatchObject({ error: 'TENANT_VIOLATION', status: 403 });
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects external companyId in query or body', async () => {
        const req = {
            user: { id: 'u1', companyId: uuid },
            params: {},
            query: { companyId: uuid },
            body: { companyId: uuid }
        } as unknown as Request;
        const res = createMockRes();

        await ensureCompanyAccess(req as any, res as any, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.body).toMatchObject({ error: 'TENANT_VIOLATION', status: 403 });
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects when JWT has no companyId claim', async () => {
        const req = {
            user: { id: 'u1' },
            params: {},
            query: {},
            body: {}
        } as unknown as Request;
        const res = createMockRes();

        await ensureCompanyAccess(req as any, res as any, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.body).toMatchObject({ error: 'TENANT_VIOLATION', status: 403 });
        expect(next).not.toHaveBeenCalled();
    });

    it('allows access when claim is present and membership is active', async () => {
        (pool.query as any)
            .mockResolvedValueOnce({ rowCount: 1 }) // company exists
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ role: 'OWNER', status: 'ACTIVE' }] }); // membership

        const req = {
            user: { id: 'u1', companyId: uuid },
            params: {},
            query: {},
            body: {}
        } as unknown as Request;
        const res = createMockRes();

        await ensureCompanyAccess(req as any, res as any, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });
});
