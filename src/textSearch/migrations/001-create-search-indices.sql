-- Migration for setting up PostgreSQL full-text search

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create search configuration for better search
CREATE TEXT SEARCH CONFIGURATION english_unaccent (COPY = english);
ALTER TEXT SEARCH CONFIGURATION english_unaccent
  ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
  WITH unaccent, simple;

-- Add tsvector columns and triggers for search entities
ALTER TABLE searches 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english_unaccent', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english_unaccent', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english_unaccent', array_to_string(NEW.tags, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_searches_search_vector 
  BEFORE INSERT OR UPDATE ON searches
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Add indices for search performance
CREATE INDEX IF NOT EXISTS idx_searches_search_vector ON searches USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_searches_category ON searches(category);
CREATE INDEX IF NOT EXISTS idx_searches_tags ON searches USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_searches_active ON searches(is_active) WHERE is_active = true;

-- Articles table search setup
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_article_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english_unaccent', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english_unaccent', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english_unaccent', COALESCE(NEW.author, '')), 'C') ||
    setweight(to_tsvector('english_unaccent', array_to_string(NEW.tags, ' ')), 'D');