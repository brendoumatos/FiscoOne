import { pool } from '../config/db';

export const seedPlans = async () => {
    console.log('Seeding Plans...');

    // Plans (no free tier). START is the onboarding default.
    const plans = [
        { code: 'START', name: 'Start', invoiceLimit: 2, seatLimit: 1, accountantLimit: 0, priceMonthly: 8.99, priceYearly: 89.90, desc: 'Essencial para começar.' },
        { code: 'ESSENTIAL', name: 'Essencial', invoiceLimit: 5, seatLimit: 1, accountantLimit: 1, priceMonthly: 49.0, priceYearly: 499.0, desc: 'Cobertura fiscal completa.' },
        { code: 'PROFESSIONAL', name: 'Profissional', invoiceLimit: 50, seatLimit: 3, accountantLimit: 1, priceMonthly: 149.0, priceYearly: 1490.0, desc: 'Governança e recorrência.' },
        { code: 'ENTERPRISE', name: 'Enterprise', invoiceLimit: -1, seatLimit: -1, accountantLimit: -1, priceMonthly: 349.0, priceYearly: 3490.0, desc: 'Sem limites com SLAs.' }
    ];

    for (const p of plans) {
        const res = await pool.query(
            `MERGE plans AS target
             USING (SELECT $1 AS code, $2 AS name, $3 AS description_pt_br, $4 AS price_monthly, $5 AS price_yearly) AS src
             ON target.code = src.code
             WHEN MATCHED THEN
                 UPDATE SET name = src.name, description_pt_br = src.description_pt_br, price_monthly = src.price_monthly, price_yearly = src.price_yearly
             WHEN NOT MATCHED THEN
                 INSERT (code, name, description_pt_br, price_monthly, price_yearly)
                 VALUES (src.code, src.name, src.description_pt_br, src.price_monthly, src.price_yearly)
             OUTPUT inserted.id`,
            [p.code, p.name, p.desc, p.priceMonthly, p.priceYearly]
        );
        const planId = res.rows[0].id;

        // Entitlements (DB is source of truth)
        const entitlements = [
            { key: 'INVOICES', limit: p.invoiceLimit },
            { key: 'SEATS', limit: p.seatLimit },
            { key: 'ACCOUNTANTS', limit: p.accountantLimit }
        ];

        for (const ent of entitlements) {
            await pool.query(
                `IF NOT EXISTS (SELECT 1 FROM plan_entitlements WHERE plan_code = $1 AND entitlement_key = $2)
                 BEGIN
                     INSERT INTO plan_entitlements (plan_code, entitlement_key, limit_value) VALUES ($1, $2, $3)
                 END
                 ELSE
                 BEGIN
                     UPDATE plan_entitlements SET limit_value = $3 WHERE plan_code = $1 AND entitlement_key = $2
                 END`,
                [p.code, ent.key, ent.limit]
            );
        }

        // Assign simple feature flags (optional, keep minimal for START)
        const enabledFeatures = [] as string[];
        if (p.code === 'ESSENTIAL') enabledFeatures.push('DASHBOARD_FULL');
        if (p.code === 'PROFESSIONAL') enabledFeatures.push('DASHBOARD_FULL', 'TRUST_SCORE', 'DOC_STORAGE', 'ALERTS');
        if (p.code === 'ENTERPRISE') enabledFeatures.push('DASHBOARD_FULL', 'TRUST_SCORE', 'DOC_STORAGE', 'ALERTS', 'MARKETPLACE');

        for (const featureCode of enabledFeatures) {
            await pool.query(
                `IF NOT EXISTS (SELECT 1 FROM plan_features WHERE plan_id = $1 AND feature_code = $2)
                 BEGIN
                     INSERT INTO plan_features (plan_id, feature_code) VALUES ($1, $2)
                 END`,
                [planId, featureCode]
            );
        }
    }

    console.log('Plans Seeded.');
};
