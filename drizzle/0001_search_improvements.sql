-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fast ILIKE and similarity queries
CREATE INDEX IF NOT EXISTS valid_lexicons_nsid_trgm_idx
  ON valid_lexicons USING GIN (nsid gin_trgm_ops);
CREATE INDEX IF NOT EXISTS invalid_lexicons_nsid_trgm_idx
  ON invalid_lexicons USING GIN (nsid gin_trgm_ops);
