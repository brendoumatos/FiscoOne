-- FiscoOne PostgreSQL Schema
-- Created at: 2025-12-24

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CLIENT', 'ACCOUNTANT', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    tax_regime VARCHAR(50) NOT NULL,
    cnae VARCHAR(20),
    
    -- Address
    address_zip VARCHAR(8),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    
    -- Bank JSON
    bank_info_json TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_companies_users FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    
    -- Sequential Number
    number SERIAL NOT NULL,
    
    issue_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'PROCESSING', 'ISSUED', 'ERROR', 'CANCELLED')),
    amount DECIMAL(18, 2) NOT NULL,
    
    -- Borrower Snapshot
    borrower_doc VARCHAR(14) NOT NULL,
    borrower_name VARCHAR(255) NOT NULL,
    
    -- Data Lake Links
    xml_storage_url VARCHAR(1024),
    pdf_storage_url VARCHAR(1024),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_invoices_companies FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);

-- 4. Fiscal Obligations (e.g., DAS, DASN)
CREATE TABLE IF NOT EXISTS fiscal_obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DAS', 'DASN', 'ISS', 'FGTS')),
    due_date DATE NOT NULL,
    reference_month VARCHAR(7) NOT NULL, -- "YYYY-MM"
    amount DECIMAL(18, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PAID', 'LATE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_obligations_companies FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 5. Tax Payments (Records of payments)
CREATE TABLE IF NOT EXISTS tax_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obligation_id UUID NOT NULL,
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(18, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('CONFIRMED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_obligations FOREIGN KEY (obligation_id) REFERENCES fiscal_obligations(id)
);

-- 6. Fiscal Trust Scores (History)
CREATE TABLE IF NOT EXISTS fiscal_trust_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    explanation_json TEXT, -- JSON explanation for the score (deductions, basic rules applied)
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scores_companies FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_scores_company ON fiscal_trust_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_scores_computed ON fiscal_trust_scores(computed_at);

-- 7. Financial Readiness Profiles (Credit Analysis Prep)
CREATE TABLE IF NOT EXISTS financial_readiness_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('READY', 'ATTENTION', 'NOT_READY')),
    profile_summary_json TEXT, -- Aggregated stats (avg revenue, tax burden, flags)
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_readiness_companies FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_readiness_company ON financial_readiness_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_readiness_computed ON financial_readiness_profiles(computed_at);

-- 8. Marketplace Providers
CREATE TABLE IF NOT EXISTS marketplace_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    bio TEXT,
    website VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    specialties TEXT[], -- e.g., ['Contabilidade', 'Juridico']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_providers_companies FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 9. Marketplace Services
CREATE TABLE IF NOT EXISTS marketplace_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ACCOUNTING', 'LEGAL', 'TECH', 'FINANCE', 'MARKETING')),
    price_range VARCHAR(50), -- e.g., 'R$ 500 - R$ 1000'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_services_providers FOREIGN KEY (provider_id) REFERENCES marketplace_providers(id)
);

-- 10. Marketplace Contacts (Lead Generation)
CREATE TABLE IF NOT EXISTS marketplace_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL,
    interested_company_id UUID NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contacts_services FOREIGN KEY (service_id) REFERENCES marketplace_services(id),
    CONSTRAINT fk_contacts_interested FOREIGN KEY (interested_company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_services_category ON marketplace_services(category);

-- 11. Fiscal Timeline Events
CREATE TABLE IF NOT EXISTS fiscal_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- INVOICE_ISSUED, TAX_CALCULATED, SCORE_CHANGED, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata_json TEXT, -- Store ID of related entity, snapshot values, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timeline_companies FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_timeline_company ON fiscal_timeline_events(company_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON fiscal_timeline_events(created_at);

-- 12. Accountants (White Label Tenant)
CREATE TABLE IF NOT EXISTS accountants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE, -- e.g. "contabilize.fiscoone.com" or custom
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Branding Settings
CREATE TABLE IF NOT EXISTS branding_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accountant_id UUID NOT NULL,
    primary_color VARCHAR(7) DEFAULT '#10B981', -- Hex code
    secondary_color VARCHAR(7) DEFAULT '#0F172A',
    logo_url VARCHAR(255),
    favicon_url VARCHAR(255),
    company_name_display VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_branding_accountants FOREIGN KEY (accountant_id) REFERENCES accountants(id)
);

-- 14. Accountant Clients (Multi-tenancy Link)
CREATE TABLE IF NOT EXISTS accountant_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accountant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ac_accountants FOREIGN KEY (accountant_id) REFERENCES accountants(id),
    CONSTRAINT fk_ac_companies FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(accountant_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_accountant_clients_acc ON accountant_clients(accountant_id);
CREATE INDEX IF NOT EXISTS idx_accountant_clients_comp ON accountant_clients(company_id);

-- 15. Plans & Features
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- FREE, BASIC, PRO, ENTERPRISE
    name VARCHAR(100) NOT NULL,
    description_pt_br TEXT,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    invoice_limit INTEGER DEFAULT 0, -- 0 = unlimited? No, let's use -1 for unlimited
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- DASHBOARD_FULL, TRUST_SCORE, etc.
    description_pt_br VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL,
    feature_code VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_pf_plan FOREIGN KEY (plan_id) REFERENCES plans(id),
    CONSTRAINT fk_pf_feature FOREIGN KEY (feature_code) REFERENCES features(code),
    UNIQUE(plan_id, feature_code)
);

-- 16. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, CANCELED, PAST_DUE
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE, -- NULL = indefinido
    renewal_type VARCHAR(20) DEFAULT 'MONTHLY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);

-- 17. Usage Counters
CREATE TABLE IF NOT EXISTS usage_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    metric_code VARCHAR(50) NOT NULL, -- INVOICES_ISSUED, STORAGE_USED
    current_value INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usage_company FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, metric_code, period_start)
);

-- 18. Billing Events (Placeholder)
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    event_type VARCHAR(50), -- UPGRADE, DOWNGRADE, PAYMENT_FAILED
-- 19. Referral System
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ref_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS referral_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_code_id UUID NOT NULL,
    invited_company_id UUID UNIQUE, -- One invite per company
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACTIVATED, REWARDED, EXPIRED
    eligible_plan_code VARCHAR(50), -- Plan that triggered or will trigger reward
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invite_code FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id),
    CONSTRAINT fk_invite_invited FOREIGN KEY (invited_company_id) REFERENCES companies(id)
);

-- 20. Service Credits
CREATE TABLE IF NOT EXISTS service_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    credit_type VARCHAR(50) NOT NULL, -- EXTRA_INVOICES, PREMIUM_DAYS
    credit_value INTEGER NOT NULL,
    remaining_value INTEGER NOT NULL, -- To track consumption
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    source VARCHAR(50) DEFAULT 'REFERRAL', -- REFERRAL, SUPPORT, PROMO
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cred_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS credit_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_credit_id UUID NOT NULL,
    amount_used INTEGER NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    CONSTRAINT fk_log_credit FOREIGN KEY (service_credit_id) REFERENCES service_credits(id)
);

CREATE INDEX IF NOT EXISTS idx_referral_company ON referral_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_credits_company ON service_credits(company_id);

-- 21. Annual Incentives
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_cycle VARCHAR(20) DEFAULT 'MONTHLY'; -- MONTHLY, ANNUAL

CREATE TABLE IF NOT EXISTS subscription_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL,
    benefit_type VARCHAR(50) NOT NULL, -- EXTRA_INVOICES, PREMIUM_DAYS
    benefit_value INTEGER NOT NULL,
    source VARCHAR(50) DEFAULT 'ANNUAL_PLAN',
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ben_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE IF NOT EXISTS annual_incentive_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_code VARCHAR(50) NOT NULL,
    multiplier INTEGER DEFAULT 2,
    base_credit_type VARCHAR(50) NOT NULL,
    base_credit_value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed Incentive Rules
INSERT INTO annual_incentive_rules (plan_code, base_credit_type, base_credit_value)
VALUES 
('ENTERPRISE', 'PREMIUM_DAYS', 30) -- 30 * 2 = 60 days
ON CONFLICT DO NOTHING;

-- 22. Dynamic Pricing Engine
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    condition_json JSONB NOT NULL, -- e.g. { "metric": "INVOICES", "threshold_percent": 85 }
    action_json JSONB NOT NULL, -- e.g. { "recommend_plan": "PRO" }
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    current_plan_code VARCHAR(50),
    recommended_plan_code VARCHAR(50),
    reason_pt_br TEXT,
    confidence_score INTEGER, -- 0-100
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(100) NOT NULL,
    payload_json JSONB,
    emitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Rules
INSERT INTO pricing_rules (rule_code, condition_json, action_json)
VALUES 
('USAGE_HIGH_85', '{"metric": "INVOICES_ISSUED", "threshold_percent": 85, "period_months": 1}', '{"recommend_plan": "UPGRADE_TIER", "reason": "Você atingiu 85% do seu limite de notas este mês."}'),
('USAGE_LIMIT_HIT', '{"metric": "INVOICES_ISSUED", "threshold_percent": 100, "period_months": 1}', '{"recommend_plan": "UPGRADE_TIER", "reason": "Seu limite de notas foi atingido. Evite interrupções."}')
ON CONFLICT DO NOTHING;

-- 23. Collaboration & Security
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER', -- ADMIN, OPERATOR, VIEWER
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INVITED, INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_company ON company_members(company_id);
