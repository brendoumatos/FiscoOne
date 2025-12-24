import { pool } from '../config/db';

export const seedPlans = async () => {
    console.log('Seeding Plans...');

    // Features
    const features = [
        { code: 'DASHBOARD_FULL', desc: 'Dashboard Completo' },
        { code: 'TRUST_SCORE', desc: 'Score de Confiança Fiscal' },
        { code: 'DOC_STORAGE', desc: 'Armazenamento de Documentos' },
        { code: 'ALERTS', desc: 'Alertas de Vencimento' },
        { code: 'MARKETPLACE', desc: 'Acesso ao Marketplace' }
    ];

    for (const f of features) {
        await pool.query(
            `INSERT INTO features (code, description_pt_br) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
            [f.code, f.desc]
        );
    }

    // Plans
    const plans = [
        { code: 'FREE', name: 'Plano Gratuito', limit: 2, price: 0, desc: 'Ideal para MEI e pequenas movimentações.' },
        { code: 'BASIC', name: 'Plano Básico', limit: 5, price: 29.90, desc: 'Para quem está crescendo.' },
        { code: 'PRO', name: 'Plano Pro', limit: 50, price: 89.90, desc: 'Gestão completa para sua empresa.' },
        { code: 'ENTERPRISE', name: 'Plano Empresarial', limit: -1, price: 299.90, desc: 'Sem limites e com suporte exclusivo.' }
    ];

    for (const p of plans) {
        const res = await pool.query(
            `INSERT INTO plans (code, name, description_pt_br, invoice_limit, price_monthly) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (code) DO UPDATE SET invoice_limit = $4, price_monthly = $5
             RETURNING id`,
            [p.code, p.name, p.desc, p.limit, p.price]
        );
        const planId = res.rows[0].id;

        // Assign Features
        // FREE: None of the advanced features
        // BASIC: DASHBOARD_FULL
        // PRO: DASHBOARD_FULL, TRUST_SCORE, DOC_STORAGE, ALERTS
        // ENTERPRISE: ALL

        const enabledFeatures = [];
        if (p.code === 'BASIC') enabledFeatures.push('DASHBOARD_FULL');
        if (p.code === 'PRO') enabledFeatures.push('DASHBOARD_FULL', 'TRUST_SCORE', 'DOC_STORAGE', 'ALERTS');
        if (p.code === 'ENTERPRISE') enabledFeatures.push('DASHBOARD_FULL', 'TRUST_SCORE', 'DOC_STORAGE', 'ALERTS', 'MARKETPLACE');

        for (const featureCode of enabledFeatures) {
            await pool.query(
                `INSERT INTO plan_features (plan_id, feature_code) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [planId, featureCode]
            );
        }
    }

    console.log('Plans Seeded.');
};
