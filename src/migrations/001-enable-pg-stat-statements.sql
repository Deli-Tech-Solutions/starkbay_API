-- Enable pg_stat_statements extension for query analysis
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset existing statistics (optional)
SELECT pg_stat_statements_reset();

-- Create helper function for index analysis
CREATE OR REPLACE FUNCTION get_index_usage_summary()
RETURNS TABLE (
  schema_name text,
  table_name text,
  index_name text,
  scans bigint,
  size text,
  usage_level text
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::text,
    tablename::text,
    indexname::text,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid))::text,
    CASE 
      WHEN idx_scan = 0 THEN 'Never Used'
      WHEN idx_scan < 100 THEN 'Rarely Used'
      WHEN idx_scan < 1000 THEN 'Moderately Used'
      ELSE 'Frequently Used'
    END::text
  FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC;
END;
$ LANGUAGE plpgsql;

-- Create helper function for unused index detection
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE (
  schema_name text,
  table_name text,
  index_name text,
  size_bytes bigint,
  size_pretty text
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::text,
    tablename::text,
    indexname::text,
    pg_relation_size(indexrelid),
    pg_size_pretty(pg_relation_size(indexrelid))::text
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_unique%'
  ORDER BY pg_relation_size(indexrelid) DESC;
END;
$ LANGUAGE plpgsql;