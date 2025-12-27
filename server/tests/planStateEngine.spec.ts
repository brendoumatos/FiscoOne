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
const created: Array<{ companyId: string; users: string[] }> = [];
let planInfo: { code: string; id: string; limit: number };

beforeAll(async () => {
    ensureJwtSecret();
    planInfo = await findPlanWithInvoiceLimit(5);
    app = (await import("../src/app")).default;
});

afterEach(async () => {
    for (const entry of created) {
        await clearCompanyData(entry.companyId, entry.users);
    }
    created.length = 0;
});

async function setupCompanyWithUsage(used: number, paymentStatus: string = "PAID") {
    const owner = await createTestUser("CLIENT");
    const company = await createTestCompany(owner.id);
    await addCompanyMember(company.id, owner.id, "OWNER");
    await upsertSubscription(company.id, planInfo.id, paymentStatus);
    await setUsage(company.id, "INVOICES", used);
    created.push({ companyId: company.id, users: [owner.id] });
    const token = makeToken(owner.id, company.id);
    return { companyId: company.id, token };
}

describe("Plan state engine", () => {
    it("returns ACTIVE, WARNING, BLOCKED based on usage", async () => {
        const warningUsage = Math.max(1, Math.min(planInfo.limit - 1, Math.ceil(planInfo.limit * 0.85)));
        const blockedUsage = planInfo.limit;

        const activeCtx = await setupCompanyWithUsage(0);
        const warningCtx = await setupCompanyWithUsage(warningUsage);
        const blockedCtx = await setupCompanyWithUsage(blockedUsage);

        const activeRes = await request(app)
            .get(`/companies/plan-state`)
            .set("Authorization", `Bearer ${activeCtx.token}`);
        expect(activeRes.status).toBe(200);
        expect(activeRes.body.status).toBe("ACTIVE");

        const warningRes = await request(app)
            .get(`/companies/plan-state`)
            .set("Authorization", `Bearer ${warningCtx.token}`);
        expect(warningRes.status).toBe(200);
        expect(warningRes.body.status).toBe("WARNING");

        const blockedRes = await request(app)
            .get(`/companies/plan-state`)
            .set("Authorization", `Bearer ${blockedCtx.token}`);
        expect(blockedRes.status).toBe(200);
        expect(blockedRes.body.status).toBe("BLOCKED");
    });

    it("returns GRACE when payment fails", async () => {
        const ctx = await setupCompanyWithUsage(0, "FAILED");
        const res = await request(app)
            .get(`/companies/plan-state`)
            .set("Authorization", `Bearer ${ctx.token}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("GRACE");
    });
});
