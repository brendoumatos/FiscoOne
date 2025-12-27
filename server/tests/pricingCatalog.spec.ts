import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import type { Express } from "express";
import { REQUIRED_PLANS, ensureJwtSecret } from "./utils/dbTestUtils";

let app: Express;

beforeAll(async () => {
    ensureJwtSecret();
    app = (await import("../src/app")).default;
});

describe("Public pricing catalog", () => {
    it("returns all required plans with entitlements", async () => {
        const res = await request(app).get("/pricing/plans").expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        const plans = res.body as Array<any>;
        const codes = plans.map((p) => p.code?.toUpperCase());
        for (const required of REQUIRED_PLANS) {
            expect(codes).toContain(required);
        }

        for (const plan of plans) {
            expect(plan).toHaveProperty("name");
            expect(plan).toHaveProperty("code");
            expect(plan).toHaveProperty("entitlements");
            expect(Array.isArray(plan.entitlements)).toBe(true);
            for (const ent of plan.entitlements) {
                expect(ent).toHaveProperty("key");
                expect(ent).toHaveProperty("limit");
                // limit can be null (unlimited) or number; ensure not undefined
                expect(ent.limit === null || typeof ent.limit === "number").toBe(true);
            }
        }
    });
});
