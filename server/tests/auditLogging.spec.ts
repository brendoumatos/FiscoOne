import request from "supertest";
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import type { Express } from "express";
import {
    ensureJwtSecret,
    createTestUser,
    createTestCompany,
    addCompanyMember,
    findPlanWithInvoiceLimit,
    upsertSubscription,
    setUsage,
    clearCompanyData,
    makeToken,
    getAuditLogs,
    countMembers
} from "./utils/dbTestUtils";
import { auditLogService } from "../src/services/auditLog";

let app: Express;
let planInfo: { code: string; id: string; limit: number };
const created: Array<{ companyId: string; users: string[] }> = [];

beforeAll(async () => {
    ensureJwtSecret();
    planInfo = await findPlanWithInvoiceLimit(1);
    app = (await import("../src/app")).default;
});

afterEach(async () => {
    vi.restoreAllMocks();
    for (const entry of created) {
        await clearCompanyData(entry.companyId, entry.users);
    }
    created.length = 0;
});

async function setupCompanyReady() {
    const owner = await createTestUser("CLIENT");
    const collaborator = await createTestUser("CLIENT");
    const company = await createTestCompany(owner.id);
    await addCompanyMember(company.id, owner.id, "OWNER");
    await upsertSubscription(company.id, planInfo.id, "PAID");
    await setUsage(company.id, "INVOICES", 0);
    created.push({ companyId: company.id, users: [owner.id, collaborator.id] });
    const token = makeToken(owner.id, company.id);
    return { companyId: company.id, token, collaboratorId: collaborator.id };
}

describe("Audit logging", () => {
    it("records audit rows for sensitive actions", async () => {
        const ctx = await setupCompanyReady();
        const res = await request(app)
            .post(`/collaborators`)
            .set("Authorization", `Bearer ${ctx.token}`)
            .send({ userId: ctx.collaboratorId });
        expect(res.status).toBe(201);

        const logs = await getAuditLogs(ctx.companyId, "USER_ADDED");
        expect(logs.length).toBeGreaterThan(0);
    });

    it("fails the action when audit logging fails", async () => {
        const ctx = await setupCompanyReady();
        vi.spyOn(auditLogService, "log").mockRejectedValueOnce(new Error("audit-fail"));

        const res = await request(app)
            .post(`/collaborators`)
            .set("Authorization", `Bearer ${ctx.token}`)
            .send({ userId: ctx.collaboratorId });

        expect(res.status).toBeGreaterThanOrEqual(400);
        const memberCount = await countMembers(ctx.companyId, ctx.collaboratorId);
        expect(memberCount).toBe(0);

        const logs = await getAuditLogs(ctx.companyId, "USER_ADDED");
        expect(logs.length).toBe(0);
    });
});
