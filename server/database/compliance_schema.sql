
-- -----------------------------------------------------------------------------
-- COMPLIANCE & ENTERPRISE SCHEMA (GOVERNANCE)
-- -----------------------------------------------------------------------------
-- Purpose: 
-- Guarantee long-term fiscal traceability and immutability.
-- Support Audit processes and Legal defensibility.
-- Manage "Time Jail" for fiscal data (Locks).

-- 1. FISCAL CONFIGURATION HISTORY (Versioning)
-- Tracks changes to critical tax settings over time.
-- Instead of just overwriting "tax_regime", we keep the log.
CREATE TABLE IF NOT EXISTS fiscal_config_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP, -- NULL means currently active
    
    changed_by_user_id UUID NOT NULL,
    change_reason_pt_br TEXT,
    
    config_snapshot JSONB NOT NULL, -- { "tax_regime": "SIMPLES", "anexo": "III", "aliquota": 6.0 }
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_hist_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_hist_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_config_hist_company ON fiscal_config_history(company_id, valid_from);


-- 2. FISCAL PERIODS (Locking Mechanism)
-- Controls the "Write Status" of a specific month.
-- Once LOCKED, no invoices or financial movements can be added/edited for that month.
CREATE TABLE IF NOT EXISTS fiscal_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    
    ref_year INT NOT NULL,
    ref_month INT NOT NULL, -- 1-12
    
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSING', 'LOCKED', 'ARCHIVED')),
    
    closed_at TIMESTAMP,
    closed_by_user_id UUID,
    
    summary_snapshot JSONB, -- Final totals at closing moment (Revenue, Tax)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_period_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_period_closer FOREIGN KEY (closed_by_user_id) REFERENCES users(id),
    
    UNIQUE(company_id, ref_year, ref_month)
);

-- 3. COMPLIANCE AUDIT REQUESTS
-- Tracks formal requests for data export or deep audit by external parties.
CREATE TABLE IF NOT EXISTS compliance_audit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    requested_by_user_id UUID NOT NULL,
    
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('INTERNAL_REVIEW', 'FISCAL_AUDIT', 'LEGAL_DISPUTE')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'GENERATED', 'EXPIRED')),
    
    generated_file_url VARCHAR(1024), -- Secure link to encrypted export
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_req_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 4. ENTERPRISE FEATURE FLAGS (Tenant Scoped)
-- Allows enabling/disabling strict compliance modes.
CREATE TABLE IF NOT EXISTS enterprise_settings (
    company_id UUID PRIMARY KEY,
    
    enforce_strict_locking BOOLEAN DEFAULT FALSE, -- If TRUE, requires dual-approval to unlock
    retention_policy_years INTEGER DEFAULT 5,
    
    audit_log_external_sync BOOLEAN DEFAULT FALSE, -- Sync to external SIEM?
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ent_company FOREIGN KEY (company_id) REFERENCES companies(id)
);
