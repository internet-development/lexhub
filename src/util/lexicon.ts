import {
  LexiconSchemaRecord as OriginalLexiconSchemaRecord,
  LEXICON_SCHEMA_NSID,
} from "@atproto/lexicon-resolver";

export type LexiconSchemaRecord = OriginalLexiconSchemaRecord & {
  id: string;
};

/**
 * Type guard to check if a value is a LexiconSchemaRecord.
 * Extend the type and check for 'id' property to help with resolving the NSID.
 */
export function isLexiconSchemaRecord(v: any): v is LexiconSchemaRecord {
  return v?.["$type"] === LEXICON_SCHEMA_NSID && Object.hasOwn(v, "id");
}
