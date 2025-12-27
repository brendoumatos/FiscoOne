-- Seed plans and entitlements for SQL Server
-- Assumes schema already created.

-- Plans (no free tier)
INSERT INTO plans (id, code, name, description, price_monthly, price_yearly, is_active)
VALUES
    (NEWID(), 'START', 'Start', 'Essencial para começar', 8.99, 89.90, 1),
    (NEWID(), 'ESSENTIAL', 'Essencial', 'Cobertura completa de impostos e calendário', 49.00, 499.00, 1),
    (NEWID(), 'PROFESSIONAL', 'Profissional', 'Governança com recorrência e documentos', 149.00, 1490.00, 1),
    (NEWID(), 'ENTERPRISE', 'Enterprise', 'Blindagem total com SLAs', 349.00, 3490.00, 1);

-- Entitlements (limits) using plan_code as canonical key
INSERT INTO plan_entitlements (id, plan_code, entitlement_key, limit_value, metadata)
VALUES
    (NEWID(), 'START', 'INVOICES', 2, NULL),
    (NEWID(), 'START', 'SEATS', 1, NULL),
    (NEWID(), 'START', 'ACCOUNTANTS', 0, NULL),

    (NEWID(), 'ESSENTIAL', 'INVOICES', 5, NULL),
    (NEWID(), 'ESSENTIAL', 'SEATS', 1, NULL),
    (NEWID(), 'ESSENTIAL', 'ACCOUNTANTS', 1, NULL),

    (NEWID(), 'PROFESSIONAL', 'INVOICES', 50, NULL),
    (NEWID(), 'PROFESSIONAL', 'SEATS', 3, NULL),
    (NEWID(), 'PROFESSIONAL', 'ACCOUNTANTS', 1, NULL),

    (NEWID(), 'ENTERPRISE', 'INVOICES', -1, NULL),
    (NEWID(), 'ENTERPRISE', 'SEATS', -1, NULL),
    (NEWID(), 'ENTERPRISE', 'ACCOUNTANTS', -1, NULL);
