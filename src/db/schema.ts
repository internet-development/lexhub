import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Valid lexicons table stores ATProto Lexicon schemas that have passed both
 * DNS validation and schema validation.
 *
 * Primary key is [nsid, cid, repo_did] to handle migrations where the same
 * lexicon content (same CID) is published from a different DID.
 */
export const valid_lexicons = pgTable(
  "valid_lexicons",
  {
    /**
     * NSID - Namespaced Identifier (e.g., com.atproto.sync.subscribeRepos)
     * Max length: 317 characters per NSID spec
     */
    nsid: varchar({ length: 317 }).notNull(),

    /**
     * CID - Content Identifier hash (e.g., bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a)
     * Base32-encoded CIDv1 with SHA-256 hash
     * Max length: 100 chars (provides headroom for future hash types)
     */
    cid: varchar({ length: 100 }).notNull(),

    /**
     * Repository DID that published this lexicon version.
     * DNS validation ensures this DID matches the NSID's DNS TXT record.
     * Max length: 256 chars for DID identifiers
     */
    repoDid: varchar("repo_did", { length: 256 }).notNull(),

    /**
     * Repository revision at time of ingestion
     */
    repoRev: varchar("repo_rev", { length: 256 }).notNull(),

    /**
     * Validated, parsed LexiconDoc in JSON format.
     * Contains: id, $type, lexicon, defs, description
     */
    data: jsonb().notNull(),

    /**
     * Timestamp when this lexicon version was ingested
     */
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Composite primary key includes repo_did to track migrations
    primaryKey({ columns: [table.nsid, table.cid, table.repoDid] }),

    // Index on nsid for quick lookup of all versions of a lexicon
    index("valid_lexicons_nsid_idx").on(table.nsid),

    // Index on repo_did to find all lexicons from a specific repository
    index("valid_lexicons_repo_did_idx").on(table.repoDid),

    // JSONB GIN index for efficient querying within lexicon content
    index("valid_lexicons_data_gin_idx").using("gin", table.data),
  ],
);

/**
 * Invalid lexicons table stores lexicon records that passed DNS validation
 * but failed schema validation. Used for debugging and helping developers
 * identify why their lexicons are broken.
 *
 * Primary key is [nsid, cid, repo_did] matching valid_lexicons structure.
 */
export const invalid_lexicons = pgTable(
  "invalid_lexicons",
  {
    /**
     * NSID - Namespaced Identifier
     */
    nsid: varchar({ length: 317 }).notNull(),

    /**
     * CID - Content Identifier hash
     */
    cid: varchar({ length: 100 }).notNull(),

    /**
     * Repository DID that published this invalid lexicon.
     * DNS was validated, but schema validation failed.
     */
    repoDid: varchar("repo_did", { length: 256 }).notNull(),

    /**
     * Repository revision at time of ingestion
     */
    repoRev: varchar("repo_rev", { length: 256 }).notNull(),

    /**
     * Raw, unvalidated data that failed schema validation.
     * May not conform to LexiconDoc structure.
     */
    rawData: jsonb("raw_data").notNull(),

    /**
     * Validation errors from Zod parser.
     * Contains ZodError issues array with details about what failed.
     */
    validationErrors: jsonb("validation_errors").notNull(),

    /**
     * Timestamp when this invalid lexicon was ingested
     */
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Composite primary key matches valid_lexicons
    primaryKey({ columns: [table.nsid, table.cid, table.repoDid] }),

    // Index on nsid for debugging specific lexicons
    index("invalid_lexicons_nsid_idx").on(table.nsid),

    // Index on repo_did to find all invalid lexicons from a repository
    index("invalid_lexicons_repo_did_idx").on(table.repoDid),

    // JSONB GIN index for searching validation errors
    index("invalid_lexicons_raw_data_gin_idx").using("gin", table.rawData),
  ],
);

export type ValidLexicon = typeof valid_lexicons.$inferSelect;
export type NewValidLexicon = typeof valid_lexicons.$inferInsert;

export type InvalidLexicon = typeof invalid_lexicons.$inferSelect;
export type NewInvalidLexicon = typeof invalid_lexicons.$inferInsert;
