import { LEXICON_SCHEMA_NSID } from "@atproto/lexicon-resolver";

/**
 * Extend the type from `@atproto/lexicon-resolver` to require the 'id' field.
 * This extension is necessary because we need the NSID to resolve the DID authority.
 */
export type LexiconSchemaRecord = {
  $type: typeof LEXICON_SCHEMA_NSID;
  id: string;
};

/**
 * Type guard to check if a value is a LexiconSchemaRecord.
 */
export function isLexiconSchemaRecord(v: any): v is LexiconSchemaRecord {
  return v?.["$type"] === LEXICON_SCHEMA_NSID && Object.hasOwn(v, "id");
}
