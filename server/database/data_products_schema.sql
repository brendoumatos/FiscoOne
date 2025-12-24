
-- -----------------------------------------------------------------------------
-- DATA PRODUCTS SCHEMA (BENCHMARKS)
-- -----------------------------------------------------------------------------
-- Purpose: 
-- Generate anonymized, aggregated market insights.
-- Respects LGPD using k-anonymity (Minimum K=10).
-- No raw company data is exposed.

-- 1. REVENUE BENCHMARKS (Materialized View)
-- Aggregates monthly revenue by broad segment.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_benchmark_revenue AS
SELECT 
    -- Dimensions
    c.tax_regime, -- MEI, SIMPLES, LUCRO
    SUBSTRING(c.cnae, 1, 2) as sector_code, -- Broad Sector (first 2 digits)
    c.address_state as region_macro,
    DATE_TRUNC('month', i.issue_date)::DATE as reference_month,
    
    -- Anonymity Check
    COUNT(DISTINCT c.id) as sample_size,
    
    -- Metrics (Statistical Distibution)
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY i.monthly_total) as p25_revenue,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY i.monthly_total) as p50_revenue, -- Median
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY i.monthly_total) as p75_revenue,
    AVG(i.monthly_total) as avg_revenue
FROM (
    -- Pre-aggregate per company first
    SELECT company_id, issue_date, SUM(amount) as monthly_total
    FROM invoices 
    WHERE status = 'ISSUED'
    GROUP BY company_id, issue_date
) i
JOIN companies c ON i.company_id = c.id
GROUP BY c.tax_regime, SUBSTRING(c.cnae, 1, 2), c.address_state, DATE_TRUNC('month', i.issue_date)
HAVING COUNT(DISTINCT c.id) >= 10; -- K-Anonymity Enforcement (Strict)

-- Index for lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_benchmark_rev 
ON mv_benchmark_revenue (tax_regime, sector_code, region_macro, reference_month);


-- 2. OPERATIONAL METRICS (Materialized View)
-- Ticket average, Invoice volume
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_benchmark_operations AS
SELECT 
    c.tax_regime,
    SUBSTRING(c.cnae, 1, 2) as sector_code,
    DATE_TRUNC('month', i.issue_date)::DATE as reference_month,
    
    COUNT(DISTINCT c.id) as sample_size,
    
    AVG(i.monthly_count) as avg_invoice_count,
    AVG(i.avg_ticket) as avg_ticket_value
FROM (
    SELECT 
        company_id, 
        issue_date, 
        COUNT(*) as monthly_count,
        AVG(amount) as avg_ticket
    FROM invoices 
    WHERE status = 'ISSUED'
    GROUP BY company_id, issue_date
) i
JOIN companies c ON i.company_id = c.id
GROUP BY c.tax_regime, SUBSTRING(c.cnae, 1, 2), DATE_TRUNC('month', i.issue_date)
HAVING COUNT(DISTINCT c.id) >= 10;


-- 3. BENCHMARK INSIGHTS CACHE
-- Stores pre-calculated textual insights for fast display
CREATE TABLE IF NOT EXISTS benchmark_insights_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL, -- REVENUE_POSITION, TICKET_HEALTH
    
    insight_key VARCHAR(50) NOT NULL, -- TOP_25_PERCENT, BELOW_AVG
    message_pt_br TEXT NOT NULL,
    
    comparison_data JSONB, -- { "my_value": 5000, "market_avg": 4200 }
    
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    CONSTRAINT fk_bench_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_bench_cache_comp ON benchmark_insights_cache(company_id);

-- 4. REFRESH FUNCTION
CREATE OR REPLACE FUNCTION refresh_benchmarks()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_benchmark_revenue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_benchmark_operations;
END;
$$ LANGUAGE plpgsql;
