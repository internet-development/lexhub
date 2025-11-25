import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Lexicons table stores ATProto Lexicon files.
 *
 * Each row represents a specific version of a lexicon, identified by the combination
 * of NSID (id) and CID (content hash). This allows tracking lexicons over their lifetime.
 */
export const lexicons = pgTable(
  "lexicons",
  {
    /**
     * NSID - Namespaced Identifier (e.g., com.atproto.sync.subscribeRepos)
     * Max length: 317 characters per NSID spec
     */
    id: varchar({ length: 317 }).notNull(),

    /**
     * CID - Content Identifier hash (e.g., bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a)
     * Base32-encoded CIDv1 with SHA-256 hash
     * Max length: 100 chars (provides headroom for future hash types)
     */
    cid: varchar({ length: 100 }).notNull(),

    /**
     * Full lexicon record in JSON format.
     * Contains: id, $type, lexicon, defs, description
     */
    data: jsonb().notNull(),

    /**
     * Timestamp when this lexicon record was first ingested
     */
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /**
     * Timestamp when this lexicon record was last updated
     */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Composite primary key: each NSID+CID combination is unique
    primaryKey({ columns: [table.id, table.cid] }),

    // Index on id alone for quick lookup of all versions of a lexicon
    index("lexicons_id_idx").on(table.id),

    // Index on createdAt for chronological queries
    index("lexicons_created_at_idx").on(table.createdAt),

    // JSONB GIN index for efficient querying of the entire data field
    // Useful for full-text searches and containment queries within the lexicon data
    index("lexicons_data_gin_idx").using("gin", table.data),
  ],
);

export type Lexicon = typeof lexicons.$inferSelect;
export type NewLexicon = typeof lexicons.$inferInsert;
