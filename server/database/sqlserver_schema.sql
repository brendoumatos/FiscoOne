-- SQL Server schema for FiscoOne (Azure SQL, Free Tier)
-- Types: UUID -> UNIQUEIDENTIFIER (DEFAULT NEWID()), SERIAL -> IDENTITY, JSONB -> NVARCHAR(MAX) WITH ISJSON, TIMESTAMPTZ/TIMESTAMP -> DATETIME2(3) DEFAULT SYSUTCDATETIME()
-- Note: review index choices for 32GB tier; adjust as needed.

-- Users
CREATE TABLE users (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('CLIENT','ACCOUNTANT','ADMIN')),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Companies
CREATE TABLE companies (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    owner_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    cnpj NVARCHAR(32) NOT NULL UNIQUE,
    legal_name NVARCHAR(255) NOT NULL,
    trade_name NVARCHAR(255),
    tax_regime NVARCHAR(50) NOT NULL CHECK (tax_regime IN ('SIMPLES','LUCRO_PRESUMIDO','LUCRO_REAL')),
    plan_id UNIQUEIDENTIFIER NULL,
    address_json NVARCHAR(MAX) NULL CHECK (address_json IS NULL OR ISJSON(address_json)=1),
    bank_info_json NVARCHAR(MAX) NULL CHECK (bank_info_json IS NULL OR ISJSON(bank_info_json)=1),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    active BIT NOT NULL DEFAULT 1
);
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_cnpj ON companies(cnpj);

-- Plans
CREATE TABLE plans (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(100) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(1024),
    price_monthly DECIMAL(18,2) NOT NULL,
    price_yearly DECIMAL(18,2) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Plan entitlements
CREATE TABLE plan_entitlements (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans(id),
    entitlement_key NVARCHAR(100) NOT NULL,
    limit_value INT NULL,
    metadata NVARCHAR(MAX) NULL CHECK (metadata IS NULL OR ISJSON(metadata)=1),
    UNIQUE(plan_id, entitlement_key)
);

-- Plan versions
CREATE TABLE plan_versions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans(id),
    version INT NOT NULL,
    valid_from DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    config_snapshot NVARCHAR(MAX) NOT NULL CHECK (ISJSON(config_snapshot)=1),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE(plan_id, version)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans(id),
    plan_version_id UNIQUEIDENTIFIER NULL REFERENCES plan_versions(id),
    status NVARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED','GRACE')),
    payment_status NVARCHAR(20) NOT NULL CHECK (payment_status IN ('PAID','UNPAID','FAILED','TRIAL')),
    expires_at DATETIME2(3) NOT NULL,
    started_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX ux_subscriptions_company ON subscriptions(company_id);

-- Usage counters
CREATE TABLE usage_counters (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    entitlement_key NVARCHAR(100) NOT NULL,
    used_value INT NOT NULL DEFAULT 0,
    updated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE(company_id, entitlement_key)
);

-- Company members
CREATE TABLE company_members (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    role NVARCHAR(50) NOT NULL CHECK (role IN ('OWNER','ACCOUNTANT','COLLABORATOR')),
    status NVARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','INVITED','BLOCKED')),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE(company_id, user_id)
);

-- Invoices
CREATE TABLE invoices (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    number INT IDENTITY(1,1) NOT NULL,
    issue_date DATETIME2(3) NOT NULL,
    status NVARCHAR(50) NOT NULL CHECK (status IN ('DRAFT','PROCESSING','ISSUED','ERROR','CANCELLED')),
    amount DECIMAL(18,2) NOT NULL,
    borrower_doc NVARCHAR(32) NOT NULL,
    borrower_name NVARCHAR(255) NOT NULL,
    xml_storage_url NVARCHAR(1024),
    pdf_storage_url NVARCHAR(1024),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_invoices_date ON invoices(issue_date);

-- Fiscal obligations
CREATE TABLE fiscal_obligations (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    type NVARCHAR(20) NOT NULL CHECK (type IN ('DAS','DASN','ISS','FGTS')),
    due_date DATE NOT NULL,
    reference_month NVARCHAR(7) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    status NVARCHAR(20) NOT NULL CHECK (status IN ('PENDING','PAID','LATE')),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Tax payments
CREATE TABLE tax_payments (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    obligation_id UNIQUEIDENTIFIER NOT NULL REFERENCES fiscal_obligations(id),
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(18,2) NOT NULL,
    status NVARCHAR(20) NOT NULL CHECK (status IN ('CONFIRMED','REJECTED')),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Fiscal trust scores
CREATE TABLE fiscal_trust_scores (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    score INT NOT NULL,
    reason NVARCHAR(255),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Audit logs (tenant actions)
CREATE TABLE audit_logs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    action NVARCHAR(100) NOT NULL,
    details NVARCHAR(MAX) NULL CHECK (details IS NULL OR ISJSON(details)=1),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_audit_company ON audit_logs(company_id);

-- Plan state snapshots
CREATE TABLE plan_state_snapshots (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    snapshot NVARCHAR(MAX) NOT NULL CHECK (ISJSON(snapshot)=1),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Notifications
CREATE TABLE notifications (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    type NVARCHAR(50) NOT NULL,
    payload NVARCHAR(MAX) NOT NULL CHECK (ISJSON(payload)=1),
    read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Credits
CREATE TABLE credits (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    amount DECIMAL(18,2) NOT NULL,
    reason NVARCHAR(255),
    expires_at DATETIME2(3) NULL,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Company blocks
CREATE TABLE company_blocks (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    reason NVARCHAR(255) NOT NULL,
    blocked_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    blocked_by UNIQUEIDENTIFIER NULL REFERENCES users(id)
);

-- Admin control plane tables
CREATE TABLE admin_users (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(32) NOT NULL CHECK (role IN ('SUPER_ADMIN','PLATFORM_ADMIN','SUPPORT_ADMIN')),
    mfa_secret NVARCHAR(255),
    ip_allowlist NVARCHAR(MAX) NULL CHECK (ip_allowlist IS NULL OR ISJSON(ip_allowlist)=1),
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE admin_sessions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    admin_id UNIQUEIDENTIFIER NOT NULL REFERENCES admin_users(id),
    refresh_token NVARCHAR(1024) NOT NULL,
    expires_at DATETIME2(3) NOT NULL,
    ip_address NVARCHAR(255),
    user_agent NVARCHAR(255),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE admin_audit_logs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    actor_admin_id UNIQUEIDENTIFIER NOT NULL REFERENCES admin_users(id),
    action NVARCHAR(255) NOT NULL,
    target_type NVARCHAR(100) NOT NULL,
    target_id NVARCHAR(255),
    before_state NVARCHAR(MAX) NULL CHECK (before_state IS NULL OR ISJSON(before_state)=1),
    after_state NVARCHAR(MAX) NULL CHECK (after_state IS NULL OR ISJSON(after_state)=1),
    impersonated_user_id UNIQUEIDENTIFIER NULL,
    original_admin_id UNIQUEIDENTIFIER NULL,
    ip_address NVARCHAR(255),
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE impersonation_sessions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    admin_id UNIQUEIDENTIFIER NOT NULL REFERENCES admin_users(id),
    company_id UNIQUEIDENTIFIER NOT NULL REFERENCES companies(id),
    user_id UNIQUEIDENTIFIER NULL REFERENCES users(id),
    expires_at DATETIME2(3) NOT NULL,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    active BIT NOT NULL DEFAULT 1,
    terminated_at DATETIME2(3) NULL
);

-- Marketplace (placeholder)
CREATE TABLE marketplace_items (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    sku NVARCHAR(100) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    metadata NVARCHAR(MAX) NULL CHECK (metadata IS NULL OR ISJSON(metadata)=1),
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- AI copilot prompts (placeholder)
CREATE TABLE ai_copilot_logs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NULL REFERENCES companies(id),
    user_id UNIQUEIDENTIFIER NULL REFERENCES users(id),
    prompt NVARCHAR(MAX) NOT NULL,
    response NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Indexes for admin audit
CREATE INDEX idx_admin_audit_actor ON admin_audit_logs(actor_admin_id);
CREATE INDEX idx_impersonation_admin ON impersonation_sessions(admin_id);

-- End of schema
