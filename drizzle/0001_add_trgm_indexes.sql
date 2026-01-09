-- Enable pg_trgm extension for trigram-based fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "invalid_lexicons_nsid_trgm_idx" ON "invalid_lexicons" USING gin ("nsid" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "valid_lexicons_nsid_trgm_idx" ON "valid_lexicons" USING gin ("nsid" gin_trgm_ops);