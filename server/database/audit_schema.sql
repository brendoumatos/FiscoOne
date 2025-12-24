
-- Audit Logs Table
-- PURPOSE: Immutable record of all sensitive actions for compliance and legal security.

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    actor_user_id UUID NOT NULL,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('COMPANY_USER', 'ACCOUNTANT', 'SYSTEM')),
    actor_accounting_firm_id UUID, -- Nullable, populated only if actor_type = ACCOUNTANT
    
    action VARCHAR(100) NOT NULL, -- e.g. INVOICE_ISSUED, USER_REMOVED
    entity_type VARCHAR(50) NOT NULL, -- e.g. INVOICE, USER, COMPANY_SETTINGS
    entity_id UUID, -- Can be null for general actions, but usually populated
    
    before_state JSONB, -- State before change (for comparisons)
    after_state JSONB, -- State after change
    
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_audit_user FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- IMMUTABILITY ENFORCEMENT
-- This trigger guarantees that no row can be modified or deleted after insertion.

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE or DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_audit_logs ON audit_logs;

CREATE TRIGGER trg_protect_audit_logs
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();
