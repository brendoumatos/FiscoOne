import request from "supertest";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
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
    makeToken
} from "./utils/dbTestUtils";

let app: Express;
let planInfo: { code: string; id: string; limit: number };
const created: Array<{ companyId: string; users: string[] }> = [];

beforeAll(async () => {
    ensureJwtSecret();
    planInfo = await findPlanWithInvoiceLimit(1);
    app = (await import("../src/app")).default;
});

afterEach(async () => {
    for (const entry of created) {
        await clearCompanyData(entry.companyId, entry.users);
    }
    created.length = 0;
});

async function setupBlockedCompany() {
    const owner = await createTestUser("CLIENT");
    const collaborator = await createTestUser("CLIENT");
    const company = await createTestCompany(owner.id);
    await addCompanyMember(company.id, owner.id, "OWNER");
    await upsertSubscription(company.id, planInfo.id, "PAID");
    await setUsage(company.id, "INVOICES", Math.max(planInfo.limit, 1));
    created.push({ companyId: company.id, users: [owner.id, collaborator.id] });
    const token = makeToken(owner.id, company.id);
    return { companyId: company.id, token, collaboratorId: collaborator.id };
}

describe("Plan enforcement", () => {
    it("blocks invoice issuance when plan is blocked", async () => {
        const ctx = await setupBlockedCompany();
        const res = await request(app)
            .post(`/invoices`)
            .set("Authorization", `Bearer ${ctx.token}`)
            .send({ borrower: { document: "123", name: "Test" }, items: [], amount: 100 });
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("PLAN_BLOCKED");
        expect(res.body.reason).toBeDefined();
        expect(res.body.cta).toBeDefined();
    });

    it("blocks collaborator add when plan is blocked", async () => {
        const ctx = await setupBlockedCompany();
        const res = await request(app)
            .post(`/collaborators`)
            .set("Authorization", `Bearer ${ctx.token}`)
            .send({ userId: ctx.collaboratorId });
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("PLAN_BLOCKED");
        expect(res.body.reason).toBeDefined();
        expect(res.body.cta).toBeDefined();
    });
});
