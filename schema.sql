
-- FiscoOne Database Schema
-- Based on Roadmap Requirements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 5.1 Authentication & Status
CREATE TYPE user_role AS ENUM ('CLIENT', 'ACCOUNTANT', 'ADMIN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'CLIENT',
    full_name TEXT NOT NULL,
    phone TEXT,
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.2 Company / Onboarding
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id),
    cnpj TEXT UNIQUE NOT NULL,
    trade_name TEXT NOT NULL, -- Nome Fantasia
    legal_name TEXT NOT NULL, -- Razão Social
    cnae TEXT, -- Código atividade principal
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    bank_info JSONB, -- { "bank": "...", "agency": "...", "account": "..." }
    accountant_id UUID REFERENCES users(id), -- Linked accountant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.4 Invoices (NFS-e)
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'PROCESSING', 'AUTHORIZED', 'REJECTED', 'CANCELLED');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    series TEXT,
    number TEXT,
    external_id TEXT, -- ID na prefeitura
    status invoice_status DEFAULT 'DRAFT',
    
    borrower_name TEXT NOT NULL, -- Tomador
    borrower_cnpj_cpf TEXT NOT NULL,
    borrower_email TEXT,
    
    service_description TEXT NOT NULL,
    service_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    xml_url TEXT,
    pdf_url TEXT
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_value DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL
);

-- 5.5 Taxes
CREATE TYPE tax_type AS ENUM ('DAS', 'ISS', 'IR', 'INSS', 'CSLL', 'COFINS', 'PIS');
CREATE TYPE tax_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');

CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    type tax_type NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status tax_status DEFAULT 'PENDING',
    payment_link TEXT, -- Boleto or PIX URL
    bar_code TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 5.8 Chat
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id), -- Or maybe channel based
    company_id UUID REFERENCES companies(id), -- Context
    content TEXT,
    attachment_url TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.13 Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    action TEXT NOT NULL, -- e.g. "INVOICE_ISSUED"
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.0 Planos, Assinaturas e Entitlements

CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED');
CREATE TYPE billing_cycle AS ENUM ('MONTHLY', 'ANNUAL');

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- PLAN_START, PLAN_ESSENTIAL, PLAN_PROFESSIONAL, PLAN_ENTERPRISE
    name TEXT NOT NULL,
    price_monthly NUMERIC(10,2),
    invoice_limit INTEGER DEFAULT -1, -- -1 = ilimitado
    seat_limit INTEGER DEFAULT -1, -- -1 = ilimitado
    extra_invoice_price NUMERIC(10,2),
    extra_seat_price NUMERIC(10,2),
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    feature_code TEXT NOT NULL, -- e.g., ISSUE_INVOICE, DASHBOARD_FULL, RECURRENT_INVOICES
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS plan_features_unique ON plan_features(plan_id, feature_code);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    status subscription_status DEFAULT 'ACTIVE',
    renewal_cycle billing_cycle DEFAULT 'MONTHLY',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_active_subscription UNIQUE (company_id)
);

CREATE TABLE subscription_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    metric_code TEXT NOT NULL, -- INVOICES_MONTHLY, SEATS_ACTIVE
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    used_value INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, metric_code, period_start)
);

CREATE TABLE service_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    credit_type TEXT NOT NULL, -- EXTRA_INVOICE, EXTRA_SEAT
    remaining_units INTEGER NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE company_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seat_role TEXT DEFAULT 'COLLABORATOR',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

-- Seed básico de planos (idempotente)
INSERT INTO plans (code, name, price_monthly, invoice_limit, seat_limit, extra_invoice_price, extra_seat_price, is_custom)
VALUES
    ('PLAN_START', 'Start', 8.99, 2, 1, NULL, NULL, FALSE),
    ('PLAN_ESSENTIAL', 'Essencial', 49.00, 5, 1, 6.00, NULL, FALSE),
    ('PLAN_PROFESSIONAL', 'Profissional', 149.00, 50, 3, 4.00, 19.00, FALSE),
    ('PLAN_ENTERPRISE', 'Enterprise', 349.00, -1, -1, NULL, NULL, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    invoice_limit = EXCLUDED.invoice_limit,
    seat_limit = EXCLUDED.seat_limit,
    extra_invoice_price = EXCLUDED.extra_invoice_price,
    extra_seat_price = EXCLUDED.extra_seat_price,
    is_custom = EXCLUDED.is_custom,
    updated_at = NOW();

-- Seed de features por plano (merge simples)
WITH pf AS (
    SELECT p.id, p.code FROM plans p
)
INSERT INTO plan_features (plan_id, feature_code, is_enabled)
SELECT id, feature_code, TRUE FROM (
    VALUES
        ('PLAN_START', 'ISSUE_INVOICE_BASIC'),
        ('PLAN_START', 'DASHBOARD_BASIC'),
        ('PLAN_START', 'FISCAL_ALERTS_INFO'),
        ('PLAN_START', 'AUDIT_ENABLED'),

        ('PLAN_ESSENTIAL', 'ISSUE_INVOICE'),
        ('PLAN_ESSENTIAL', 'DASHBOARD_FULL'),
        ('PLAN_ESSENTIAL', 'TAX_ESTIMATION'),
        ('PLAN_ESSENTIAL', 'TAX_CALENDAR'),
        ('PLAN_ESSENTIAL', 'WHATSAPP_ALERTS'),
        ('PLAN_ESSENTIAL', 'ADVISOR_ENGINE'),

        ('PLAN_PROFESSIONAL', 'ISSUE_INVOICE'),
        ('PLAN_PROFESSIONAL', 'DASHBOARD_FULL'),
        ('PLAN_PROFESSIONAL', 'TAX_ESTIMATION'),
        ('PLAN_PROFESSIONAL', 'TAX_CALENDAR'),
        ('PLAN_PROFESSIONAL', 'WHATSAPP_ALERTS'),
        ('PLAN_PROFESSIONAL', 'ADVISOR_ENGINE'),
        ('PLAN_PROFESSIONAL', 'RECURRENT_INVOICES'),
        ('PLAN_PROFESSIONAL', 'FINANCIAL_HEALTH'),
        ('PLAN_PROFESSIONAL', 'DOCUMENT_MANAGEMENT'),
        ('PLAN_PROFESSIONAL', 'AUDIT_VISIBLE'),
        ('PLAN_PROFESSIONAL', 'FISCAL_SCORE'),
        ('PLAN_PROFESSIONAL', 'READINESS_INDEX'),

        ('PLAN_ENTERPRISE', 'ISSUE_INVOICE'),
        ('PLAN_ENTERPRISE', 'DASHBOARD_FULL'),
        ('PLAN_ENTERPRISE', 'TAX_ESTIMATION'),
        ('PLAN_ENTERPRISE', 'TAX_CALENDAR'),
        ('PLAN_ENTERPRISE', 'WHATSAPP_ALERTS'),
        ('PLAN_ENTERPRISE', 'ADVISOR_ENGINE'),
        ('PLAN_ENTERPRISE', 'RECURRENT_INVOICES'),
        ('PLAN_ENTERPRISE', 'FINANCIAL_HEALTH'),
        ('PLAN_ENTERPRISE', 'DOCUMENT_MANAGEMENT'),
        ('PLAN_ENTERPRISE', 'AUDIT_VISIBLE'),
        ('PLAN_ENTERPRISE', 'FISCAL_SCORE'),
        ('PLAN_ENTERPRISE', 'READINESS_INDEX'),
        ('PLAN_ENTERPRISE', 'DEDICATED_ACCOUNTANT'),
        ('PLAN_ENTERPRISE', 'SLA_SUPPORT'),
        ('PLAN_ENTERPRISE', 'ADVANCED_VALIDATIONS')
) seed(plan_code, feature_code)
JOIN pf ON pf.code = seed.plan_code
ON CONFLICT DO NOTHING;
