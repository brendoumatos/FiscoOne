
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
