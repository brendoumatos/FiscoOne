
-- -----------------------------------------------------------------------------
-- EXPLAINABLE AI COPILOT SCHEMA
-- -----------------------------------------------------------------------------
-- Purpose: 
-- Store and audit all AI-generated advice.
-- Ensure Accountability (all advice is logged).
-- Enable Accountant Review workflow.

-- 1. AI INTERACTIONS (The "Black Box" Recorder)
-- Stores the exact Context input and AI Output for every request.
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    intent VARCHAR(50) NOT NULL, -- e.g. EXPLAIN_TAX_SPIKE, EXPLAIN_ALERT
    
    -- Contextual Data (The "Ground Truth" fed to AI)
    -- Crucial for debugging hallucinations.
    input_context_json JSONB NOT NULL, 
    
    -- AI Output
    generated_explanation TEXT NOT NULL,
    
    -- Safety Metadata
    is_safe_response BOOLEAN DEFAULT TRUE,
    safety_disclaimer_appended BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ai_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_company ON ai_interactions(company_id);

-- 2. ACCOUNTANT OVERVIEWS (Human-in-the-loop)
-- Allows the accountant to flag or annotate AI explanations.
CREATE TABLE IF NOT EXISTS ai_accountant_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID NOT NULL,
    accountant_user_id UUID NOT NULL,
    
    status VARCHAR(20) CHECK (status IN ('APPROVED', 'FLAGGED', 'CORRECTED')),
    note_to_client TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_review_interaction FOREIGN KEY (interaction_id) REFERENCES ai_interactions(id),
    CONSTRAINT fk_review_accountant FOREIGN KEY (accountant_user_id) REFERENCES users(id)
);

-- 3. AI TEMPLATES (Controlled Prompts)
-- We do NOT allow free-form prompts. All interactions use versioned templates.
-- This table is mostly for configuration, could be code-based, but DB allows versioning.
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
    code VARCHAR(50) PRIMARY KEY, -- e.g. 'EXPLAIN_TAX_INCREASE_V1'
    system_prompt TEXT NOT NULL,
    user_prompt_structure TEXT NOT NULL,
    mandatory_disclaimer_pt_br TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed Basic Template
INSERT INTO ai_prompt_templates (code, system_prompt, user_prompt_structure, mandatory_disclaimer_pt_br)
VALUES (
    'EXPLAIN_TAX_SPIKE_V1',
    'You are a Fiscal Assistant. You analyze data and explain deviations. You NEVER give legal decisions.',
    'Revenue Current Month: {{current}}; Revenue Last Month: {{last}}; Tax Rate: {{rate}}. Explain why tax increased.',
    'Esta é uma explicação automatizada baseada em dados. Consulte seu contador para decisões legais.'
) ON CONFLICT DO NOTHING;
