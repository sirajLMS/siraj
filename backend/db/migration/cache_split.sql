-- Ensure rate_limit_cache is UNLOGGED
-- This is done via ALTER because Drizzle doesn't support UNLOGGED in schema yet
ALTER TABLE IF EXISTS rate_limit_cache SET UNLOGGED;

-- Update cleanup function to include the new table and maintain security hygiene
CREATE OR REPLACE FUNCTION cleanup_expired_security_data() 
RETURNS VOID AS $$
BEGIN
    -- Cleanup expired auth rate limits
    DELETE FROM auth_rate_limits 
    WHERE (locked_until IS NOT NULL AND locked_until < NOW())
       OR (locked_until IS NULL AND updated_at < NOW() - INTERVAL '24 hours');
    
    -- Cleanup expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    
    -- Cleanup expired rate limit cache entries (UNLOGGED)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'rate_limit_cache') THEN
        DELETE FROM rate_limit_cache WHERE expires_at < NOW();
    END IF;

    -- Cleanup expired session cache entries (LOGGED)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'session_cache') THEN
        DELETE FROM session_cache WHERE expires_at < NOW();
    END IF;

    -- Legacy cleanup for the old 'cache' table if it still exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'cache') THEN
        DELETE FROM cache WHERE expires_at < NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;
