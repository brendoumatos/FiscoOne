import { describe, it, expect } from "vitest";
import { pool, REQUIRED_PLANS } from "./utils/dbTestUtils";

const REQUIRED_ENTITLEMENTS = ["INVOICES", "SEATS", "ACCOUNTANTS"] as const;

describe("Plan definitions", () => {
    it("has all required plans, prices, and entitlements", async () => {
        const planRes = await pool.query(`SELECT code, price_monthly, price_yearly FROM plans`);
        const plans = planRes.rows.reduce<Record<string, any>>((acc, row) => {
            acc[row.code] = row;
            return acc;
        }, {});

        const placeholders = REQUIRED_ENTITLEMENTS.map((_, idx) => `$${idx + 1}`).join(", ");
        const entRes = await pool.query(
            `SELECT plan_code, entitlement_key, limit_value FROM plan_entitlements WHERE entitlement_key IN (${placeholders})`,
            REQUIRED_ENTITLEMENTS as unknown as any[]
        );
        const entitlements = entRes.rows.reduce<Record<string, Record<string, number>>>((acc, row) => {
            const code = row.plan_code.toUpperCase();
            acc[code] = acc[code] || {};
            acc[code][row.entitlement_key.toUpperCase()] = Number(row.limit_value);
            return acc;
        }, {});

        const fail = (plan: string, field: string) => {
            throw new Error(`PLAN_DEFINITION_MISMATCH: ${plan} ${field}`);
        };

        for (const plan of REQUIRED_PLANS) {
            const p = plans[plan];
            if (!p) fail(plan, "MISSING");
            if (p.price_monthly === null || p.price_monthly === undefined) fail(plan, "PRICE_MONTHLY");
            if (p.price_yearly === null || p.price_yearly === undefined) fail(plan, "PRICE_YEARLY");

            const ent = entitlements[plan];
            if (!ent) fail(plan, "ENTITLEMENTS_MISSING");
            for (const key of REQUIRED_ENTITLEMENTS) {
                const value = ent[key];
                if (value === null || value === undefined) fail(plan, `${key}_LIMIT`);
            }
        }

        expect(true).toBe(true); // explicit to satisfy Vitest when no throw
    });
});
