-- Custom SQL migration file, put your code below! --

-- Enable the pg_trgm extension for faster LIKE/ILIKE searches
-- Drizzle doesn't create extensions automatically, so we need to do it manually
CREATE EXTENSION IF NOT EXISTS pg_trgm;