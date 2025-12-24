
-- -----------------------------------------------------------------------------
-- PERFORMANCE SCHEMA: FiscoOne Dashboard Optimization
-- -----------------------------------------------------------------------------
-- Purpose: 
-- Separate OLTP (Transactional) from OLAP (Analytical) workloads.
-- Guarantee < 200ms response time for Dashboards via Pre-aggregation.
-- prepare data structures for Azure Data Lake export.

-- 1. MATERIALIZED VIEW: Monthly Financial Aggregations
-- Captures revenue, invoice counts, and tax estimates per month per company.
-- This replaces expensive SUM() operations on the raw 'invoices' table.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_financials AS
SELECT 
    i.company_id,
    DATE_TRUNC('month', i.issue_date)::DATE as reference_month,
    COUNT(i.id) as invoice_count,
    COALESCE(SUM(i.amount), 0) as total_revenue,
    COALESCE(SUM(i.amount * 0.05), 0) as estimated_taxes, -- Simplified Tax Logic (5% avg) for MVP
    COUNT(CASE WHEN i.status = 'CANCELLED' THEN 1 END) as cancelled_count,
    MAX(i.updated_at) as last_data_update
FROM invoices i
WHERE i.status IN ('ISSUED', 'PROCESSING', 'CANCELLED')
GROUP BY i.company_id, DATE_TRUNC('month', i.issue_date);

-- 2. INDEXING STRATEGY
-- Crucial for multi-tenant isolation and speed.
-- Dashboard queries filter by Company + Date Range.

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_lookup 
ON mv_monthly_financials (company_id, reference_month);

-- 3. MATERIALIZED VIEW: Fiscal Health & Trends (6 Months)
-- Rolling window analysis for trends.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_trends AS
WITH MonthlyStats AS (
    SELECT 
        company_id, 
        reference_month, 
        total_revenue
    FROM mv_monthly_financials
)
SELECT 
    curr.company_id,
    curr.reference_month,
    curr.total_revenue,
    prev.total_revenue as previous_month_revenue,
    CASE 
        WHEN prev.total_revenue > 0 
        THEN ((curr.total_revenue - prev.total_revenue) / prev.total_revenue) * 100 
        ELSE 0 
    END as growth_percentage
FROM MonthlyStats curr
LEFT JOIN MonthlyStats prev 
    ON curr.company_id = prev.company_id 
    AND prev.reference_month = (curr.reference_month - INTERVAL '1 month');

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_trends_lookup 
ON mv_revenue_trends (company_id, reference_month);

-- 4. REFRESH STRATEGY (Function)
-- Application should call this periodically (e.g. 5 min cron) or on significant events.
-- 'CONCURRENTLY' allows reads to continue while refreshing.

CREATE OR REPLACE FUNCTION refresh_dashboard_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_financials;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_trends;
END;
$$ LANGUAGE plpgsql;

-- 5. DATA LAKE EXPORT PREPARATION (CDC / Watermark Support)
-- This table tracks the cursor for Data Lake exports.

CREATE TABLE IF NOT EXISTS data_lake_export_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- INVOICE, USER, AUDIT
    last_exported_at TIMESTAMP NOT NULL,
    record_count INTEGER,
    export_status VARCHAR(20) DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example Query for Incremental Export (Documentation purposes)
-- SELECT * FROM invoices WHERE updated_at >String (SELECT MAX(last_exported_at) FROM data_lake_export_log WHERE entity_type='INVOICE');
